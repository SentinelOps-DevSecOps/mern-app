#!/usr/bin/env python3
"""
DevSecOps Risk Scorer
─────────────────────────────────────────────────────────────
Reads Trivy JSON reports, calculates a weighted CVE risk score,
saves results to MySQL, and exits with code 1 if score > threshold.

Usage:
    python3 risk_scorer.py --report trivy-backend-report.json
                           --image mern-backend
                           --build 42
                           --scan-id 1
"""

import json
import sys
import os
import argparse
import datetime
import mysql.connector
from tabulate import tabulate
from colorama import Fore, Back, Style, init

# Initialize colorama for colored output
init(autoreset=True)

# ── Configuration ─────────────────────────────────────────────────────────────
CVSS_WEIGHTS = {
    'CRITICAL': 10,
    'HIGH':      5,
    'MEDIUM':    2,
    'LOW':       0.5,
    'UNKNOWN':   0
}

BLOCK_THRESHOLD = 30   # Block pipeline if score exceeds this
WARN_THRESHOLD  = 15   # Warn if score exceeds this

# Severity colors for terminal output
SEVERITY_COLORS = {
    'CRITICAL': Fore.RED + Style.BRIGHT,
    'HIGH':     Fore.RED,
    'MEDIUM':   Fore.YELLOW,
    'LOW':      Fore.GREEN,
    'UNKNOWN':  Fore.WHITE
}

# ── Database Connection ───────────────────────────────────────────────────────
def get_db_connection():
    """Connect to MySQL database."""
    try:
        conn = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'secuser'),
            password=os.getenv('DB_PASSWORD', 'StrongPass@2026'),
            database=os.getenv('DB_NAME', 'devsecops_security')
        )
        return conn
    except mysql.connector.Error as e:
        print(f"{Fore.YELLOW}⚠️  Database connection failed: {e}")
        print(f"{Fore.YELLOW}   Continuing without database storage...")
        return None

# ── Parse Trivy Report ────────────────────────────────────────────────────────
def parse_trivy_report(report_path):
    """
    Parse Trivy JSON report and extract vulnerabilities.
    Returns list of vulnerability dicts.
    """
    print(f"\n{Fore.CYAN}📄 Reading Trivy report: {report_path}")

    if not os.path.exists(report_path):
        print(f"{Fore.RED}❌ Report file not found: {report_path}")
        sys.exit(1)

    with open(report_path, 'r') as f:
        data = json.load(f)

    vulnerabilities = []

    # Trivy JSON structure:
    # { "Results": [ { "Target": "...", "Vulnerabilities": [...] } ] }
    for result in data.get('Results', []):
        target = result.get('Target', 'unknown')
        vulns  = result.get('Vulnerabilities', [])

        if vulns:
            print(f"  Found {len(vulns)} vulnerabilities in: {target}")

        for vuln in vulns:
            vulnerabilities.append({
                'target':       target,
                'cve_id':       vuln.get('VulnerabilityID', 'N/A'),
                'severity':     vuln.get('Severity', 'UNKNOWN'),
                'package':      vuln.get('PkgName', 'unknown'),
                'installed':    vuln.get('InstalledVersion', 'unknown'),
                'fixed':        vuln.get('FixedVersion', 'not available'),
                'title':        vuln.get('Title', 'No description'),
                'cvss_score':   vuln.get('CVSS', {}).get('nvd', {}).get('V3Score', 0.0)
            })

    return vulnerabilities

# ── Calculate Risk Score ──────────────────────────────────────────────────────
def calculate_risk_score(vulnerabilities):
    """
    Calculate weighted risk score from vulnerability list.
    CRITICAL=10pts, HIGH=5pts, MEDIUM=2pts, LOW=0.5pts
    """
    score = 0
    counts = {'CRITICAL': 0, 'HIGH': 0, 'MEDIUM': 0, 'LOW': 0, 'UNKNOWN': 0}

    for vuln in vulnerabilities:
        severity = vuln['severity'].upper()
        weight   = CVSS_WEIGHTS.get(severity, 0)
        score   += weight
        counts[severity] = counts.get(severity, 0) + 1

    return score, counts

# ── Print Results Table ───────────────────────────────────────────────────────
def print_vulnerability_table(vulnerabilities, image_name):
    """Print a formatted table of vulnerabilities."""

    print(f"\n{Style.BRIGHT}{'='*70}")
    print(f"  Trivy Scan Results — {image_name}")
    print(f"{'='*70}{Style.RESET_ALL}")

    if not vulnerabilities:
        print(f"{Fore.GREEN}  ✅ No vulnerabilities found!")
        return

    # Prepare table data — show top 20 worst findings
    sorted_vulns = sorted(
        vulnerabilities,
        key=lambda x: CVSS_WEIGHTS.get(x['severity'].upper(), 0),
        reverse=True
    )[:20]

    table_data = []
    for v in sorted_vulns:
        color = SEVERITY_COLORS.get(v['severity'].upper(), '')
        table_data.append([
            f"{color}{v['severity']}{Style.RESET_ALL}",
            v['cve_id'],
            v['package'][:25],
            v['installed'][:15],
            v['fixed'][:15] if v['fixed'] != 'not available' else 'No fix yet',
            v['cvss_score']
        ])

    headers = ['Severity', 'CVE ID', 'Package', 'Installed', 'Fixed In', 'CVSS']
    print(tabulate(table_data, headers=headers, tablefmt='grid'))

    if len(vulnerabilities) > 20:
        print(f"\n  ... and {len(vulnerabilities) - 20} more findings")

# ── Print Score Summary ───────────────────────────────────────────────────────
def print_score_summary(score, counts, image_name):
    """Print the risk score summary with verdict."""

    print(f"\n{Style.BRIGHT}{'='*70}")
    print(f"  Risk Score Summary — {image_name}")
    print(f"{'='*70}{Style.RESET_ALL}")
    print()

    # Severity breakdown
    print(f"  Vulnerability Breakdown:")
    print(f"  {Fore.RED+Style.BRIGHT}  CRITICAL : {counts['CRITICAL']:3d}  × 10pts = {counts['CRITICAL']*10:6.1f}pts{Style.RESET_ALL}")
    print(f"  {Fore.RED}  HIGH     : {counts['HIGH']:3d}  × 5pts  = {counts['HIGH']*5:6.1f}pts{Style.RESET_ALL}")
    print(f"  {Fore.YELLOW}  MEDIUM   : {counts['MEDIUM']:3d}  × 2pts  = {counts['MEDIUM']*2:6.1f}pts{Style.RESET_ALL}")
    print(f"  {Fore.GREEN}  LOW      : {counts['LOW']:3d}  × 0.5pts= {counts['LOW']*0.5:6.1f}pts{Style.RESET_ALL}")
    print()
    print(f"  {'─'*40}")
    print(f"  Total Risk Score   : {Style.BRIGHT}{score:.1f} points{Style.RESET_ALL}")
    print(f"  Warning Threshold  : {WARN_THRESHOLD} points")
    print(f"  Block Threshold    : {BLOCK_THRESHOLD} points")
    print()

    # Verdict
    if score == 0:
        verdict_color = Fore.GREEN + Style.BRIGHT
        verdict       = "✅  PASSED — No vulnerabilities found!"
    elif score <= WARN_THRESHOLD:
        verdict_color = Fore.GREEN
        verdict       = f"✅  PASSED — Score {score:.1f} is below thresholds"
    elif score <= BLOCK_THRESHOLD:
        verdict_color = Fore.YELLOW
        verdict       = f"⚠️   WARNING — Score {score:.1f} is elevated (threshold: {BLOCK_THRESHOLD})"
    else:
        verdict_color = Fore.RED + Style.BRIGHT
        verdict       = f"❌  BLOCKED — Score {score:.1f} exceeds threshold {BLOCK_THRESHOLD}!"

    print(f"  {verdict_color}{verdict}{Style.RESET_ALL}")
    print(f"  {'='*68}")

    return score > BLOCK_THRESHOLD

# ── Save to Database ──────────────────────────────────────────────────────────
def save_to_database(conn, scan_id, image_name, vulnerabilities, score):
    """Save Trivy findings to MySQL database."""
    if not conn:
        return

    try:
        cursor = conn.cursor()

        for vuln in vulnerabilities:
            cursor.execute("""
                INSERT INTO trivy_findings
                    (scan_id, image_name, cve_id, severity,
                     package_name, installed_ver, fixed_ver,
                     title, cvss_score)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                scan_id,
                image_name,
                vuln['cve_id'],
                vuln['severity'],
                vuln['package'],
                vuln['installed'],
                vuln['fixed'],
                vuln['title'][:500] if vuln['title'] else '',
                vuln['cvss_score']
            ))

        conn.commit()
        print(f"\n{Fore.GREEN}  💾 Saved {len(vulnerabilities)} findings to database (scan_id: {scan_id})")

    except mysql.connector.Error as e:
        print(f"{Fore.YELLOW}  ⚠️  Database save failed: {e}")

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description='DevSecOps Risk Scorer — evaluates Trivy scan results'
    )
    parser.add_argument('--report',   required=True,  help='Path to Trivy JSON report')
    parser.add_argument('--image',    required=True,  help='Image name being scanned')
    parser.add_argument('--build',    type=int, default=0, help='Jenkins build number')
    parser.add_argument('--scan-id',  type=int, default=0, help='Database scan ID')
    parser.add_argument('--threshold',type=int, default=BLOCK_THRESHOLD,
                        help=f'Risk score threshold (default: {BLOCK_THRESHOLD})')
    args = parser.parse_args()

    print(f"\n{Style.BRIGHT}{Fore.CYAN}")
    print("  ╔══════════════════════════════════════════════════════════╗")
    print("  ║     🛡️  SentinelOps Risk Scorer — DevSecOps              ║")
    print("  ╚══════════════════════════════════════════════════════════╝")
    print(f"{Style.RESET_ALL}")
    print(f"  Image     : {args.image}")
    print(f"  Report    : {args.report}")
    print(f"  Build     : #{args.build}")
    print(f"  Timestamp : {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Connect to database
    conn = get_db_connection()

    # Parse the Trivy JSON report
    vulnerabilities = parse_trivy_report(args.report)

    # Print vulnerability table
    print_vulnerability_table(vulnerabilities, args.image)

    # Calculate risk score
    score, counts = calculate_risk_score(vulnerabilities)

    # Print summary and get verdict
    should_block = print_score_summary(score, counts, args.image)

    # Save findings to database
    if args.scan_id > 0:
        save_to_database(conn, args.scan_id, args.image, vulnerabilities, score)

    # Close database connection
    if conn:
        conn.close()

    # Exit with code 1 if pipeline should be blocked
    # Jenkins reads this exit code — non-zero = stage failed
    if should_block:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == '__main__':
    main()
