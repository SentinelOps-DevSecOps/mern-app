#!/usr/bin/env python3
"""
OWASP ZAP DAST Scanner
──────────────────────────────────────────────────────────────
Runs OWASP ZAP in headless (daemon) mode against your running
MERN app, performs spider + active scan, saves results to MySQL,
and exits with code 1 if HIGH risk findings are found.

How it works:
1. Start ZAP as a background daemon on port 8090
2. Tell ZAP to spider (crawl) the target URL
3. Wait for spider to complete
4. Run active scan (ZAP sends attack payloads)
5. Collect all alerts/findings
6. Save to database
7. Block pipeline if HIGH findings exist
"""

import requests
import time
import json
import sys
import os
import subprocess
import argparse
import mysql.connector
from colorama import Fore, Style, init

init(autoreset=True)

ZAP_HOST    = 'http://localhost:8090'
ZAP_API_KEY = ''  # No API key in dev mode (we set -config api.disablekey=true)
POLL_INTERVAL = 5  # seconds between status checks

# ── Risk level colors ─────────────────────────────────────────────────────────
RISK_COLORS = {
    'High':          Fore.RED + Style.BRIGHT,
    'Medium':        Fore.YELLOW,
    'Low':           Fore.CYAN,
    'Informational': Fore.WHITE
}

# ── Helper: call ZAP API ──────────────────────────────────────────────────────
def zap_api(endpoint, params=None):
    """Make a GET request to ZAP's REST API."""
    try:
        url = f"{ZAP_HOST}/JSON/{endpoint}"
        resp = requests.get(url, params=params, timeout=30)
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.ConnectionError:
        print(f"{Fore.RED}❌ Cannot connect to ZAP at {ZAP_HOST}")
        print(f"   Make sure ZAP is running in daemon mode")
        sys.exit(1)
    except Exception as e:
        print(f"{Fore.RED}❌ ZAP API error: {e}")
        return {}

import shutil

# ── Start ZAP daemon ──────────────────────────────────────────────────────────
def find_zap_executable():
    """Locate zap.sh binary on system."""
    path = shutil.which('zap.sh')
    if path:
        return path
    for common_path in ['/usr/local/bin/zap.sh', '/opt/zap/zap.sh', '/usr/bin/zap.sh']:
        if os.path.isfile(common_path):
            return common_path
    return 'zap.sh'

def start_zap():
    """Start ZAP in daemon mode as background process."""
    print(f"{Fore.CYAN}🚀 Starting OWASP ZAP daemon...")

    zap_bin = find_zap_executable()
    zap_cmd = [
        zap_bin,
        '-daemon',
        '-host', '0.0.0.0',
        '-port', '8090',
        '-config', 'api.disablekey=true',
        '-config', 'api.addrs.addr.name=.*',
        '-config', 'api.addrs.addr.regex=true',
        '-config', 'autoupdate.checkonstart=false'
    ]

    # Start ZAP as background process
    proc = subprocess.Popen(
        zap_cmd,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )

    print(f"   ZAP PID: {proc.pid}")
    print(f"   Waiting for ZAP to initialize...")

    # Wait for ZAP API to become available
    max_wait = 120  # seconds
    waited   = 0
    while waited < max_wait:
        try:
            resp = requests.get(f"{ZAP_HOST}/JSON/core/view/version/", timeout=5)
            if resp.status_code == 200:
                version = resp.json().get('version', 'unknown')
                print(f"{Fore.GREEN}   ✅ ZAP ready! Version: {version}")
                return proc
        except:
            pass
        time.sleep(3)
        waited += 3
        print(f"   Waiting... ({waited}s)")

    print(f"{Fore.RED}❌ ZAP failed to start within {max_wait} seconds")
    proc.terminate()
    sys.exit(1)

# ── Spider the target ─────────────────────────────────────────────────────────
def run_spider(target_url):
    """Spider (crawl) the target to discover all pages and endpoints."""
    print(f"\n{Fore.CYAN}🕷️  Spidering target: {target_url}")

    # Start spider
    result = zap_api('spider/action/scan/', {'url': target_url})
    scan_id = result.get('scan', '0')

    # Poll until complete
    print("   Progress: ", end='', flush=True)
    while True:
        status = zap_api('spider/view/status/', {'scanId': scan_id})
        progress = int(status.get('status', 0))
        print(f"\r   Progress: {progress}%", end='', flush=True)

        if progress >= 100:
            break
        time.sleep(POLL_INTERVAL)

    print(f"\n{Fore.GREEN}   ✅ Spider complete")

    # Show what was found
    urls = zap_api('spider/view/results/', {'scanId': scan_id})
    url_list = urls.get('results', [])
    print(f"   Discovered {len(url_list)} URLs")
    for url in url_list[:10]:  # Show first 10
        print(f"     → {url}")
    if len(url_list) > 10:
        print(f"     ... and {len(url_list) - 10} more")

# ── Active scan the target ────────────────────────────────────────────────────
def run_active_scan(target_url, timeout_minutes=5):
    """
    Run ZAP active scan — sends attack payloads to every discovered URL.
    This is the actual DAST phase.
    """
    print(f"\n{Fore.CYAN}⚡ Running active scan (timeout: {timeout_minutes} min)...")
    print(f"   ZAP is sending attack payloads to: {target_url}")

    # Start active scan
    result = zap_api('ascan/action/scan/', {
        'url':       target_url,
        'recurse':   'true',
        'inScopeOnly': 'false'
    })
    scan_id = result.get('scan', '0')

    # Poll with timeout
    start_time  = time.time()
    timeout_sec = timeout_minutes * 60

    while True:
        elapsed = time.time() - start_time

        # Check timeout
        if elapsed > timeout_sec:
            print(f"\n{Fore.YELLOW}   ⚠️  Scan timeout reached ({timeout_minutes} min)")
            print(f"   Stopping scan and collecting results so far...")
            zap_api('ascan/action/stop/', {'scanId': scan_id})
            break

        status = zap_api('ascan/view/status/', {'scanId': scan_id})
        progress = int(status.get('status', 0))

        mins = int(elapsed // 60)
        secs = int(elapsed % 60)
        print(f"\r   Progress: {progress}% | Elapsed: {mins:02d}:{secs:02d}", end='', flush=True)

        if progress >= 100:
            break

        time.sleep(POLL_INTERVAL)

    total_time = time.time() - start_time
    print(f"\n{Fore.GREEN}   ✅ Active scan complete ({total_time:.0f}s)")

# ── Collect alerts ────────────────────────────────────────────────────────────
def collect_alerts():
    """Retrieve all alerts/findings from ZAP."""
    print(f"\n{Fore.CYAN}📋 Collecting scan findings...")

    result = zap_api('core/view/alerts/')
    alerts = result.get('alerts', [])

    print(f"   Found {len(alerts)} total alerts")
    return alerts

# ── Print alerts table ────────────────────────────────────────────────────────
def print_alerts(alerts):
    """Print formatted vulnerability findings."""

    if not alerts:
        print(f"\n{Fore.GREEN}✅ No vulnerabilities found by ZAP!")
        return

    # Group by risk level
    by_risk = {'High': [], 'Medium': [], 'Low': [], 'Informational': []}
    for alert in alerts:
        risk = alert.get('risk', 'Informational')
        by_risk.setdefault(risk, []).append(alert)

    print(f"\n{Style.BRIGHT}{'='*70}")
    print(f"  OWASP ZAP Scan Results")
    print(f"{'='*70}{Style.RESET_ALL}")

    for risk_level in ['High', 'Medium', 'Low', 'Informational']:
        findings = by_risk.get(risk_level, [])
        if not findings:
            continue

        color = RISK_COLORS.get(risk_level, '')
        print(f"\n  {color}[{risk_level.upper()}] — {len(findings)} finding(s){Style.RESET_ALL}")
        print(f"  {'─'*60}")

        # Deduplicate by alert name
        seen = set()
        for alert in findings:
            name = alert.get('alert', 'Unknown')
            if name in seen:
                continue
            seen.add(name)

            url = alert.get('url', '')[:60]
            cwe = alert.get('cweid', 'N/A')
            print(f"  {color}• {name}{Style.RESET_ALL}")
            print(f"    URL : {url}")
            print(f"    CWE : CWE-{cwe}")
            print(f"    Fix : {alert.get('solution','See OWASP docs')[:80]}")
            print()

# ── Save ZAP results to database ──────────────────────────────────────────────
def save_to_database(scan_id, alerts):
    """Save ZAP findings to MySQL."""
    if not scan_id:
        return

    try:
        conn = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'secuser'),
            password=os.getenv('DB_PASSWORD', 'StrongPass@2026'),
            database=os.getenv('DB_NAME', 'devsecops_security')
        )
        cursor = conn.cursor()

        for alert in alerts:
            cursor.execute("""
                INSERT INTO zap_findings
                    (scan_id, alert_name, risk_level, confidence,
                     url, description, solution, cwe_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                scan_id,
                alert.get('alert', '')[:300],
                alert.get('risk', 'Informational'),
                alert.get('confidence', 'Low'),
                alert.get('url', '')[:500],
                alert.get('description', '')[:1000],
                alert.get('solution', '')[:1000],
                f"CWE-{alert.get('cweid', '')}"
            ))

        conn.commit()
        conn.close()
        print(f"{Fore.GREEN}  💾 Saved {len(alerts)} ZAP findings to database")

    except mysql.connector.Error as e:
        print(f"{Fore.YELLOW}  ⚠️  DB save failed: {e}")

# ── Verdict ───────────────────────────────────────────────────────────────────
def determine_verdict(alerts):
    """
    Determine pass/fail verdict.
    BLOCK if any HIGH risk findings exist.
    """
    high_count   = sum(1 for a in alerts if a.get('risk') == 'High')
    medium_count = sum(1 for a in alerts if a.get('risk') == 'Medium')
    low_count    = sum(1 for a in alerts if a.get('risk') == 'Low')
    info_count   = sum(1 for a in alerts if a.get('risk') == 'Informational')

    print(f"\n{Style.BRIGHT}{'='*70}")
    print(f"  ZAP Scan Summary")
    print(f"{'='*70}{Style.RESET_ALL}")
    print(f"  {Fore.RED+Style.BRIGHT}High         : {high_count:3d}{Style.RESET_ALL}")
    print(f"  {Fore.YELLOW}Medium       : {medium_count:3d}{Style.RESET_ALL}")
    print(f"  {Fore.CYAN}Low          : {low_count:3d}{Style.RESET_ALL}")
    print(f"  Informational: {info_count:3d}")
    print()

    if high_count > 0:
        print(f"  {Fore.RED+Style.BRIGHT}❌ BLOCKED — {high_count} HIGH risk vulnerability(s) found!")
        print(f"  Fix the HIGH findings before this image can be deployed.{Style.RESET_ALL}")
        return False, high_count
    else:
        print(f"  {Fore.GREEN+Style.BRIGHT}✅ PASSED — No HIGH risk vulnerabilities found{Style.RESET_ALL}")
        return True, 0

# ── Stop ZAP ─────────────────────────────────────────────────────────────────
def stop_zap(zap_proc):
    """Cleanly shut down ZAP daemon."""
    try:
        zap_api('core/action/shutdown/')
        time.sleep(2)
    except:
        pass
    if zap_proc:
        zap_proc.terminate()
    print(f"{Fore.CYAN}🛑 ZAP daemon stopped")

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description='OWASP ZAP DAST Scanner')
    parser.add_argument('--target',  required=True, help='Target URL to scan')
    parser.add_argument('--scan-id', type=int, default=0, help='Database scan ID')
    parser.add_argument('--timeout', type=int, default=5, help='Scan timeout in minutes')
    args = parser.parse_args()

    print(f"\n{Style.BRIGHT}{Fore.CYAN}")
    print("  ╔══════════════════════════════════════════════════════════╗")
    print("  ║     🌐 OWASP ZAP DAST Scanner — PGCP-ITISS 2026         ║")
    print("  ╚══════════════════════════════════════════════════════════╝")
    print(f"{Style.RESET_ALL}")
    print(f"  Target : {args.target}")
    print(f"  Timeout: {args.timeout} minutes")
    print(f"  Scan ID: {args.scan_id}")

    zap_proc = None
    try:
        # Start ZAP daemon
        zap_proc = start_zap()

        # Spider the application
        run_spider(args.target)

        # Active scan
        run_active_scan(args.target, args.timeout)

        # Collect results
        alerts = collect_alerts()

        # Print findings
        print_alerts(alerts)

        # Save to database
        if args.scan_id > 0:
            save_to_database(args.scan_id, alerts)

        # Determine verdict
        passed, high_count = determine_verdict(alerts)

    finally:
        # Always stop ZAP cleanly
        stop_zap(zap_proc)

    sys.exit(0 if passed else 1)

if __name__ == '__main__':
    main()
