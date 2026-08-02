#!/usr/bin/env python3
"""
Database Manager for DevSecOps Pipeline
────────────────────────────────────────
Creates and updates pipeline scan records in MySQL.
Called by Jenkins at the start and end of each pipeline run.
"""

import mysql.connector
import sys
import os
import argparse
import datetime
from colorama import Fore, Style, init

init(autoreset=True)

def get_db_connection():
    """Connect to MySQL."""
    try:
        return mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'secuser'),
            password=os.getenv('DB_PASSWORD', 'sentinelops'),
            database=os.getenv('DB_NAME', 'devsecops_security')
        )
    except mysql.connector.Error as e:
        print(f"{Fore.RED}❌ DB connection failed: {e}")
        sys.exit(1)

def create_scan_record(build_number, branch, commit_hash):
    """
    Create a new pipeline scan record.
    Returns the scan_id — used by other scripts to link findings.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO pipeline_scans
            (build_number, branch, commit_hash, overall_status)
        VALUES (%s, %s, %s, 'FAILED')
    """, (build_number, branch, commit_hash))

    conn.commit()
    scan_id = cursor.lastrowid

    print(f"{Fore.GREEN}✅ Created scan record — ID: {scan_id}")
    print(f"   Build: #{build_number} | Branch: {branch}")
    print(f"   Commit: {commit_hash[:8] if commit_hash else 'unknown'}")

    conn.close()

    # Print the ID so Jenkins can capture it with sh(returnStdout: true)
    print(f"SCAN_ID={scan_id}")
    return scan_id

def update_scan_status(scan_id, status, risk_score=0,
                        trivy_passed=False, zap_passed=False,
                        npm_passed=False):
    """Update the scan record when pipeline completes."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE pipeline_scans
        SET overall_status = %s,
            risk_score     = %s,
            trivy_passed   = %s,
            zap_passed     = %s,
            npm_passed     = %s
        WHERE id = %s
    """, (status, risk_score, trivy_passed, zap_passed, npm_passed, scan_id))

    conn.commit()
    conn.close()

    color = Fore.GREEN if status == 'PASSED' else Fore.RED
    print(f"{color}{'✅' if status == 'PASSED' else '❌'} "
          f"Scan #{scan_id} updated: {status}")

def show_recent_scans(limit=10):
    """Show recent pipeline scan history."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT id, build_number, branch, overall_status,
               risk_score, trivy_passed, zap_passed, npm_passed,
               DATE_FORMAT(scan_timestamp, '%Y-%m-%d %H:%i') as scan_time
        FROM pipeline_scans
        ORDER BY id DESC
        LIMIT %s
    """, (limit,))

    scans = cursor.fetchall()
    conn.close()

    if not scans:
        print("No scan records found yet.")
        return

    print(f"\n{Style.BRIGHT}Recent Pipeline Scans:{Style.RESET_ALL}")
    print(f"{'ID':>4} {'Build':>6} {'Branch':<12} {'Status':<10} "
          f"{'Score':>7} {'Trivy':>6} {'ZAP':>6} {'npm':>6} {'Time':<17}")
    print("─" * 75)

    for s in scans:
        status_color = Fore.GREEN if s['overall_status'] == 'PASSED' else Fore.RED
        print(
            f"{s['id']:>4} "
            f"#{s['build_number']:<5} "
            f"{s['branch']:<12} "
            f"{status_color}{s['overall_status']:<10}{Style.RESET_ALL} "
            f"{s['risk_score']:>7.1f} "
            f"{'✅' if s['trivy_passed'] else '❌':>6} "
            f"{'✅' if s['zap_passed'] else '❌':>6} "
            f"{'✅' if s['npm_passed'] else '❌':>6} "
            f"{s['scan_time']:<17}"
        )

def main():
    parser = argparse.ArgumentParser(description='DevSecOps DB Manager')
    subparsers = parser.add_subparsers(dest='command')

    # create-scan command
    create_parser = subparsers.add_parser('create-scan')
    create_parser.add_argument('--build',  required=True, type=int)
    create_parser.add_argument('--branch', default='main')
    create_parser.add_argument('--commit', default='')

    # update-scan command
    update_parser = subparsers.add_parser('update-scan')
    update_parser.add_argument('--scan-id', required=True, type=int)
    update_parser.add_argument('--status',  required=True,
                               choices=['PASSED','FAILED','BLOCKED'])
    update_parser.add_argument('--score',        type=float, default=0)
    update_parser.add_argument('--trivy-passed', action='store_true')
    update_parser.add_argument('--zap-passed',   action='store_true')
    update_parser.add_argument('--npm-passed',   action='store_true')

    # history command
    subparsers.add_parser('history')

    args = parser.parse_args()

    if args.command == 'create-scan':
        create_scan_record(args.build, args.branch, args.commit)

    elif args.command == 'update-scan':
        update_scan_status(
            args.scan_id, args.status, args.score,
            args.trivy_passed, args.zap_passed, args.npm_passed
        )

    elif args.command == 'history':
        show_recent_scans()

    else:
        parser.print_help()

if __name__ == '__main__':
    main()
