#!/bin/bash

set -e

echo "========================================="
echo "      Trivy Installation Script"
echo "========================================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    SUDO=""
else
    SUDO="sudo"
fi

echo "[1/5] Updating package index..."
$SUDO apt-get update

echo "[2/5] Installing prerequisites..."
$SUDO apt-get install -y wget gnupg apt-transport-https

echo "[3/5] Adding Trivy GPG key..."

$SUDO mkdir -p /usr/share/keyrings

wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | \
    gpg --dearmor | \
    $SUDO tee /usr/share/keyrings/trivy.gpg > /dev/null

echo "[4/5] Adding Trivy repository..."

echo "deb [signed-by=/usr/share/keyrings/trivy.gpg] https://aquasecurity.github.io/trivy-repo/deb generic main" | \
    $SUDO tee /etc/apt/sources.list.d/trivy.list > /dev/null

echo "[5/5] Installing Trivy..."

$SUDO apt-get update
$SUDO apt-get install -y trivy

echo ""
echo "========================================="
echo "       Trivy Installation Complete"
echo "========================================="

echo ""
echo "Installed Trivy version:"
trivy --version

echo ""
echo "Trivy location:"
which trivy

echo ""
echo "Trivy is ready for Jenkins."
