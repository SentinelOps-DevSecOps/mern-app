#!/bin/bash

set -e

echo "========================================="
echo "      OWASP ZAP Installation Script"
echo "========================================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    SUDO=""
else
    SUDO="sudo"
fi

echo "[1/6] Checking Java installation..."

if command -v java >/dev/null 2>&1; then
    java -version
else
    echo "Java is not installed."
    echo "Please install Java 17 or later before installing OWASP ZAP."
    exit 1
fi

echo
echo "[2/6] Downloading OWASP ZAP..."

cd /tmp

wget -O ZAP_unix.sh \
https://github.com/zaproxy/zaproxy/releases/download/v2.17.0/ZAP_2_17_0_unix.sh

echo
echo "[3/6] Making installer executable..."

chmod +x ZAP_unix.sh

echo
echo "[4/6] Installing OWASP ZAP..."

$SUDO ./ZAP_unix.sh -q

echo
echo "[5/6] Cleaning temporary files..."

rm -f ZAP_unix.sh

echo
echo "[6/6] Verifying installation..."

if command -v zap.sh >/dev/null 2>&1; then
    echo "OWASP ZAP installed successfully."
    echo
    zap.sh -version
else
    echo "Searching for ZAP installation..."

    ZAP_PATH=$(find /opt /usr -name zap.sh 2>/dev/null | head -n 1)

    if [ -n "$ZAP_PATH" ]; then
        echo "Found ZAP at:"
        echo "$ZAP_PATH"
        "$ZAP_PATH" -version
    else
        echo "Installation completed, but zap.sh was not found in PATH."
        echo "Locate it manually using:"
        echo "find / -name zap.sh 2>/dev/null"
    fi
fi

echo
echo "========================================="
echo " OWASP ZAP Installation Completed"
echo "========================================="

