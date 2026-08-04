#!/bin/bash

set -e

echo "========================================="
echo "    Terraform Installation Script"
echo "========================================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    SUDO=""
else
    SUDO="sudo"
fi

echo "[1/6] Updating package index..."
$SUDO apt-get update

echo "[2/6] Installing prerequisites..."
$SUDO apt-get install -y \
    wget \
    gnupg \
    software-properties-common \
    lsb-release

echo "[3/6] Adding HashiCorp GPG key..."

wget -qO- https://apt.releases.hashicorp.com/gpg | \
    gpg --dearmor | \
    $SUDO tee /usr/share/keyrings/hashicorp-archive-keyring.gpg > /dev/null

echo "[4/6] Adding HashiCorp APT repository..."

echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | \
    $SUDO tee /etc/apt/sources.list.d/hashicorp.list > /dev/null

echo "[5/6] Installing Terraform..."

$SUDO apt-get update
$SUDO apt-get install -y terraform

echo "[6/6] Verifying installation..."

terraform --version

echo ""
echo "Terraform location:"
which terraform

echo ""
echo "========================================="
echo " Terraform Installation Completed"
echo "========================================="


