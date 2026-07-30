#!/usr/bin/env bash

# ============================================================
# DevSecOps MERN Project
# Jenkins Setup Script
#
# Target:
#   Ubuntu 22.04 / Debian-based systems
#
# Installs:
#   - OpenJDK 21 (if not already installed)
#   - Fontconfig
#   - Jenkins LTS
#
# Configures:
#   - Jenkins APT repository
#   - Jenkins systemd service
#   - Jenkins auto-start on boot
#
# Default Jenkins port:
#   8080
# ============================================================

set -euo pipefail

# ------------------------------------------------------------
# Configuration
# ------------------------------------------------------------

JAVA_PACKAGE="openjdk-21-jre"
JENKINS_REPO="https://pkg.jenkins.io/debian-stable"
JENKINS_KEY_URL="${JENKINS_REPO}/jenkins.io-2026.key"
JENKINS_KEYRING="/etc/apt/keyrings/jenkins-keyring.asc"
JENKINS_SOURCE="/etc/apt/sources.list.d/jenkins.list"

# ------------------------------------------------------------
# Helper functions
# ------------------------------------------------------------

log() {
    echo
    echo "============================================================"
    echo "$1"
    echo "============================================================"
}

error_exit() {
    echo
    echo "ERROR: $1"
    exit 1
}

# ------------------------------------------------------------
# Check root privileges
# ------------------------------------------------------------

if [[ "$EUID" -eq 0 ]]; then
    error_exit "Do not run this script as root. Run it as a normal user with sudo privileges."
fi

if ! sudo -v; then
    error_exit "This user does not have sudo privileges."
fi

# ------------------------------------------------------------
# Check OS
# ------------------------------------------------------------

log "Checking operating system"

if [[ ! -f /etc/os-release ]]; then
    error_exit "/etc/os-release not found. Unable to determine operating system."
fi

source /etc/os-release

echo "Operating System: ${PRETTY_NAME:-Unknown}"

if [[ "${ID:-}" != "ubuntu" ]]; then
    echo "WARNING: This script was designed for Ubuntu."
    echo "Detected OS: ${PRETTY_NAME:-Unknown}"
fi

# ------------------------------------------------------------
# Update package index
# ------------------------------------------------------------

log "Updating APT package index"

sudo apt update

# ------------------------------------------------------------
# Install required utilities
# ------------------------------------------------------------

log "Installing required utilities"

sudo apt install -y \
    wget \
    curl \
    gnupg \
    fontconfig

# ------------------------------------------------------------
# Check Java
# ------------------------------------------------------------

log "Checking Java installation"

JAVA_REQUIRED_MAJOR=21
JAVA_INSTALLED_MAJOR=0

if command -v java >/dev/null 2>&1; then

    JAVA_VERSION_OUTPUT=$(java -version 2>&1 || true)

    echo "$JAVA_VERSION_OUTPUT"

    JAVA_INSTALLED_MAJOR=$(echo "$JAVA_VERSION_OUTPUT" \
        | grep -oP 'version "\K[0-9]+' \
        | head -n 1 || echo "0")

fi

echo "Detected Java major version: $JAVA_INSTALLED_MAJOR"

# ------------------------------------------------------------
# Install Java 21 if required
# ------------------------------------------------------------

if [[ "$JAVA_INSTALLED_MAJOR" -lt "$JAVA_REQUIRED_MAJOR" ]]; then

    log "Installing OpenJDK 21"

    sudo apt install -y "$JAVA_PACKAGE"

else

    echo "Java 21 or newer is already installed."
fi

# ------------------------------------------------------------
# Verify Java
# ------------------------------------------------------------

log "Verifying Java"

if ! command -v java >/dev/null 2>&1; then
    error_exit "Java installation failed."
fi

java -version

# ------------------------------------------------------------
# Configure Jenkins repository key
# ------------------------------------------------------------

log "Configuring Jenkins repository signing key"

sudo mkdir -p /etc/apt/keyrings

sudo wget -q -O "$JENKINS_KEYRING" "$JENKINS_KEY_URL"

if [[ ! -s "$JENKINS_KEYRING" ]]; then
    error_exit "Failed to download Jenkins repository signing key."
fi

sudo chmod 644 "$JENKINS_KEYRING"

# ------------------------------------------------------------
# Configure Jenkins APT repository
# ------------------------------------------------------------

log "Configuring Jenkins LTS APT repository"

echo "deb [signed-by=${JENKINS_KEYRING}] ${JENKINS_REPO} binary/" \
    | sudo tee "$JENKINS_SOURCE" > /dev/null

# ------------------------------------------------------------
# Update package index again
# ------------------------------------------------------------

log "Updating APT after adding Jenkins repository"

sudo apt update

# ------------------------------------------------------------
# Check Jenkins package availability
# ------------------------------------------------------------

log "Checking Jenkins package availability"

JENKINS_VERSION=$(apt-cache policy jenkins \
    | awk '/Candidate:/ {print $2}')

if [[ -z "${JENKINS_VERSION}" || "${JENKINS_VERSION}" == "(none)" ]]; then
    error_exit "Jenkins package is not available from the configured repository."
fi

echo "Jenkins candidate version: ${JENKINS_VERSION}"

# ------------------------------------------------------------
# Install Jenkins
# ------------------------------------------------------------

if dpkg -s jenkins >/dev/null 2>&1; then

    log "Jenkins is already installed"

    dpkg-query -W -f='Installed Jenkins version: ${Version}\n' jenkins

else

    log "Installing Jenkins"

    sudo apt install -y jenkins
fi

# ------------------------------------------------------------
# Enable Jenkins at boot
# ------------------------------------------------------------

log "Enabling Jenkins service"

sudo systemctl enable jenkins

# ------------------------------------------------------------
# Start Jenkins
# ------------------------------------------------------------

log "Starting Jenkins service"

sudo systemctl start jenkins

# ------------------------------------------------------------
# Verify Jenkins service
# ------------------------------------------------------------

log "Checking Jenkins service"

if systemctl is-active --quiet jenkins; then

    echo "Jenkins service is running successfully."

else

    echo "Jenkins failed to start."
    echo
    echo "Recent Jenkins logs:"
    sudo journalctl -u jenkins --no-pager -n 50

    exit 1
fi

# ------------------------------------------------------------
# Check Jenkins port
# ------------------------------------------------------------

log "Checking Jenkins port"

if sudo ss -lntp | grep -q ':8080'; then
    echo "Jenkins is listening on port 8080."
else
    echo "WARNING: Jenkins is not currently listening on port 8080."
    echo "Check the Jenkins logs with:"
    echo
    echo "sudo journalctl -u jenkins --no-pager -n 50"
fi

# ------------------------------------------------------------
# Display Jenkins information
# ------------------------------------------------------------

log "Jenkins Installation Complete"

echo "Jenkins service:"
systemctl is-active jenkins

echo
echo "Jenkins enabled at boot:"
systemctl is-enabled jenkins

echo
echo "Jenkins version:"
jenkins --version 2>/dev/null || \
    dpkg-query -W -f='${Version}\n' jenkins

echo
echo "Jenkins URL:"
echo "http://localhost:8080"

echo
echo "If accessing Jenkins from another machine:"
echo "http://<UBUNTU_VM_IP>:8080"

echo
echo "Ubuntu VM IP:"
hostname -I

echo
echo "Initial Jenkins administrator password:"
echo
echo "sudo cat /var/lib/jenkins/secrets/initialAdminPassword"

echo
echo "IMPORTANT:"
echo "Do not share the initial administrator password."
echo
echo "Jenkins setup completed successfully."
