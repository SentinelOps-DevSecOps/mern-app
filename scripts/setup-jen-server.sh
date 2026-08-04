#!/bin/bash
set -euo pipefail

# ============================================================
# DevSecOps Jenkins Server Bootstrap
# Part 1 - System Preparation
# ============================================================

# Ensure script is run with root privileges
if [ "$EUID" -ne 0 ]; then
    echo "ERROR: This script must be run with root privileges. Please run: sudo $0"
    exit 1
fi

# Log everything
exec > >(tee /var/log/user-data.log | logger -t user-data -s 2>/dev/console) 2>&1

echo "========================================================"
echo "Starting DevSecOps Jenkins Server Bootstrap..."
echo "Started at: $(date)"
echo "========================================================"

export DEBIAN_FRONTEND=noninteractive

# ------------------------------------------------------------
# Update Ubuntu
# ------------------------------------------------------------
echo "[INFO] Updating system packages..."

apt-get update -y
apt-get upgrade -y

# ------------------------------------------------------------
# Install common dependencies
# ------------------------------------------------------------
echo "[INFO] Installing common packages..."

apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    wget \
    git \
    unzip \
    zip \
    gnupg \
    lsb-release \
    software-properties-common \
    build-essential \
    jq \
    tree \
    vim \
    net-tools

# ------------------------------------------------------------
# Install Java 17
# ------------------------------------------------------------
echo "[INFO] Installing OpenJDK 17..."

apt-get install -y openjdk-17-jdk

JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))

cat >/etc/profile.d/java.sh <<EOF
export JAVA_HOME=$JAVA_HOME
export PATH=\$JAVA_HOME/bin:\$PATH
EOF

chmod +x /etc/profile.d/java.sh

export JAVA_HOME="$JAVA_HOME"
export PATH="$JAVA_HOME/bin:$PATH"

# ------------------------------------------------------------
# Verify Java
# ------------------------------------------------------------
echo "[INFO] Java Version"

java -version

echo "JAVA_HOME=$JAVA_HOME"

# ------------------------------------------------------------
# Verify Git
# ------------------------------------------------------------
echo "[INFO] Git Version"

git --version

echo "[INFO] Part 1 system dependencies installed successfully."


# ============================================================
# Part 2 - Jenkins Installation & Configuration
# ============================================================

echo "========================================================"
echo "[INFO] Installing Jenkins..."
echo "========================================================"

# ------------------------------------------------------------
# Add Jenkins repository key & source
# ------------------------------------------------------------
rm -f /etc/apt/sources.list.d/jenkins.list
mkdir -p /usr/share/keyrings
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key | tee /usr/share/keyrings/jenkins-keyring.asc >/dev/null
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" > /etc/apt/sources.list.d/jenkins.list

apt-get update -y

# ------------------------------------------------------------
# Install Jenkins
# ------------------------------------------------------------
apt-get install -y jenkins

# ------------------------------------------------------------
# Enable Jenkins
# ------------------------------------------------------------
systemctl daemon-reload
systemctl enable jenkins
systemctl start jenkins

# Give Jenkins time to initialize
sleep 20

# ------------------------------------------------------------
# Verify Jenkins service
# ------------------------------------------------------------
if systemctl is-active --quiet jenkins; then
    echo "[SUCCESS] Jenkins is running."
else
    echo "[ERROR] Jenkins failed to start."
    systemctl status jenkins --no-pager
    exit 1
fi

# ------------------------------------------------------------
# Wait until Jenkins is listening on port 8080
# ------------------------------------------------------------
echo "[INFO] Waiting for Jenkins to become available..."

for i in {1..30}; do
    if curl -fs http://localhost:8080/login >/dev/null 2>&1; then
        echo "[SUCCESS] Jenkins is responding."
        break
    fi

    echo "Waiting... ($i/30)"
    sleep 5
done

# ------------------------------------------------------------
# Download Jenkins Plugin Manager
# ------------------------------------------------------------
echo "[INFO] Downloading Jenkins Plugin Installation Manager..."

mkdir -p /opt/jenkins

curl -L \
https://github.com/jenkinsci/plugin-installation-manager-tool/releases/latest/download/jenkins-plugin-manager.jar \
-o /opt/jenkins/jenkins-plugin-manager.jar

# ------------------------------------------------------------
# Plugin list
# ------------------------------------------------------------
cat >/opt/jenkins/plugins.txt <<EOF
git
github
pipeline-stage-view
workflow-aggregator
credentials
credentials-binding
docker-plugin
docker-workflow
nodejs
ssh-agent
matrix-auth
workspace-cleanup
timestamper
ansicolor
aws-credentials
kubernetes
blueocean
EOF

chmod 644 /opt/jenkins/plugins.txt

echo "[SUCCESS] Plugin list created."

# ------------------------------------------------------------
# Verify Jenkins
# ------------------------------------------------------------
echo "--------------------------------------------------------"
echo "Jenkins Version"
echo "--------------------------------------------------------"

java -jar /usr/share/jenkins/jenkins.war --version

echo "--------------------------------------------------------"

echo "Jenkins Service Status"

systemctl status jenkins --no-pager

echo "[INFO] Part 2 completed successfully."

# ============================================================
# Part 3 - Docker & Node.js
# ============================================================

echo "========================================================"
echo "[INFO] Installing Docker & Node.js..."
echo "========================================================"

# ------------------------------------------------------------
# Install Docker Repository
# ------------------------------------------------------------
install -m 0755 -d /etc/apt/keyrings
rm -f /etc/apt/sources.list.d/docker.list

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list

apt-get update -y

# ------------------------------------------------------------
# Install Docker Engine
# ------------------------------------------------------------
echo "[INFO] Installing Docker..."

apt-get install -y \
    docker-ce \
    docker-ce-cli \
    containerd.io \
    docker-buildx-plugin \
    docker-compose-plugin

# ------------------------------------------------------------
# Enable Docker
# ------------------------------------------------------------
systemctl daemon-reload
systemctl enable docker
systemctl start docker

# ------------------------------------------------------------
# Configure Docker Permissions
# ------------------------------------------------------------
echo "[INFO] Configuring Docker permissions..."

# Create docker group if it doesn't exist
getent group docker >/dev/null || groupadd docker

# Add users to docker group
usermod -aG docker jenkins

# Ubuntu EC2 AMI user
if id ubuntu >/dev/null 2>&1; then
    usermod -aG docker ubuntu
fi

# Restart Docker
systemctl restart docker

# ------------------------------------------------------------
# Verify Docker
# ------------------------------------------------------------
echo "--------------------------------------------------------"
echo "Docker Version"
echo "--------------------------------------------------------"

docker --version

docker compose version

docker info >/dev/null

echo "[SUCCESS] Docker installed successfully."

# ------------------------------------------------------------
# Install Node.js 20 LTS
# ------------------------------------------------------------
echo "[INFO] Installing Node.js 20 LTS..."

curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

apt-get install -y nodejs

# ------------------------------------------------------------
# Verify Node.js
# ------------------------------------------------------------
echo "--------------------------------------------------------"
echo "Node Version"
echo "--------------------------------------------------------"

node -v

npm -v

echo "[SUCCESS] Node.js installed successfully."

# ------------------------------------------------------------
# Install Useful Global npm Packages
# ------------------------------------------------------------
echo "[INFO] Installing global npm packages..."

npm install -g npm@latest

npm install -g eslint

# ------------------------------------------------------------
# Verify Global Packages
# ------------------------------------------------------------
echo "--------------------------------------------------------"

npm list -g --depth=0

echo "--------------------------------------------------------"

echo "[INFO] Restarting Jenkins..."

systemctl restart jenkins

sleep 15

echo "[SUCCESS] Jenkins restarted."

echo "[INFO] Part 3 completed successfully."

# ============================================================
# Part 4 - Python, MySQL & Security Database
# ============================================================

echo "========================================================"
echo "[INFO] Installing Python & MySQL..."
echo "========================================================"

# ------------------------------------------------------------
# Install Python
# ------------------------------------------------------------
echo "[INFO] Installing Python 3..."

apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev

python3 --version
pip3 --version

# ------------------------------------------------------------
# Create Python Virtual Environment
# ------------------------------------------------------------
echo "[INFO] Creating Python virtual environment..."

python3 -m venv /opt/security-venv

source /opt/security-venv/bin/activate

pip install --upgrade pip setuptools wheel

# ------------------------------------------------------------
# Install Python Packages
# ------------------------------------------------------------
echo "[INFO] Installing Python libraries..."

pip install \
    mysql-connector-python \
    requests \
    python-dotenv \
    tabulate \
    colorama \
    pandas \
    openpyxl

deactivate

chown -R jenkins:jenkins /opt/security-venv

echo "[SUCCESS] Python environment ready."

# ============================================================
# Install MySQL
# ============================================================

echo "[INFO] Installing MySQL..."

apt-get install -y mysql-server

systemctl enable mysql
systemctl start mysql

sleep 10

# Verify service
if systemctl is-active --quiet mysql; then
    echo "[SUCCESS] MySQL service is running."
else
    echo "[ERROR] MySQL failed to start."
    systemctl status mysql --no-pager
    exit 1
fi

# ============================================================
# Database Configuration
# ============================================================

DB_NAME="devsecops_security"
DB_USER="secuser"
DB_PASSWORD="sentinelops"

echo "[INFO] Creating database..."

mysql <<EOF

CREATE DATABASE IF NOT EXISTS ${DB_NAME};

CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost'
IDENTIFIED BY '${DB_PASSWORD}';

GRANT ALL PRIVILEGES
ON ${DB_NAME}.*
TO '${DB_USER}'@'localhost';

FLUSH PRIVILEGES;

EOF

echo "[SUCCESS] Database created."


# ============================================================
# Verify Database
# ============================================================

echo "--------------------------------------------------------"
echo "Databases"
echo "--------------------------------------------------------"

mysql -e "SHOW DATABASES;"

echo "--------------------------------------------------------"
echo "MySQL Version"
echo "--------------------------------------------------------"

mysql --version

echo "[SUCCESS] Part 4 completed successfully."

# ============================================================
# Part 5 - DevSecOps Security Tools
# ============================================================

echo "========================================================"
echo "[INFO] Installing Security Tools..."
echo "========================================================"

# ------------------------------------------------------------
# Install Gitleaks
# ------------------------------------------------------------
echo "[INFO] Installing Gitleaks..."

GITLEAKS_VERSION="8.28.0"

cd /tmp

wget -q \
https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz

tar -xzf gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz

install -m 755 gitleaks /usr/local/bin/gitleaks

rm -f \
gitleaks \
gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz \
LICENSE \
README.md

echo "[SUCCESS] Gitleaks Installed"

# ------------------------------------------------------------
# Verify Gitleaks
# ------------------------------------------------------------
gitleaks version

# ============================================================
# Install Trivy
# ============================================================

echo "[INFO] Installing Trivy..."

rm -f /etc/apt/sources.list.d/trivy.list
mkdir -p /usr/share/keyrings
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | gpg --dearmor -o /usr/share/keyrings/trivy.gpg
echo "deb [signed-by=/usr/share/keyrings/trivy.gpg] https://aquasecurity.github.io/trivy-repo/deb generic main" > /etc/apt/sources.list.d/trivy.list

apt-get update -y

apt-get install -y trivy

echo "[INFO] Downloading Trivy vulnerability database..."

trivy image --download-db-only

echo "[SUCCESS] Trivy Installed"

# ------------------------------------------------------------
# Verify Trivy
# ------------------------------------------------------------
trivy --version

# ============================================================
# Install OWASP ZAP
# ============================================================

echo "[INFO] Installing OWASP ZAP..."

ZAP_VERSION="2.16.1"

cd /tmp

wget -q \
https://github.com/zaproxy/zaproxy/releases/download/v${ZAP_VERSION}/ZAP_${ZAP_VERSION}_Linux.tar.gz

tar -xzf ZAP_${ZAP_VERSION}_Linux.tar.gz

mv ZAP_${ZAP_VERSION} /opt/zap

ln -sf /opt/zap/zap.sh /usr/local/bin/zap

chmod +x /usr/local/bin/zap

rm -f ZAP_${ZAP_VERSION}_Linux.tar.gz

echo "[SUCCESS] OWASP ZAP Installed"

# ------------------------------------------------------------
# Verify ZAP
# ------------------------------------------------------------
zap -version

# ============================================================
# Create Scan Output Directories
# ============================================================

mkdir -p /opt/security-reports

mkdir -p /opt/security-reports/gitleaks

mkdir -p /opt/security-reports/trivy

mkdir -p /opt/security-reports/zap

chown -R jenkins:jenkins /opt/security-reports

chmod -R 755 /opt/security-reports

echo "[SUCCESS] Report directories created."

# ============================================================
# Security Tools Summary
# ============================================================

echo "--------------------------------------------------------"

echo "Installed Security Tools"

echo "--------------------------------------------------------"

echo "Gitleaks : $(gitleaks version | head -1)"

echo "Trivy    : $(trivy --version | head -1)"

echo "OWASP ZAP: $(zap -version | head -1)"

echo "--------------------------------------------------------"

echo "[INFO] Part 5 completed successfully."

# ============================================================
# Part 6 - AWS & Kubernetes Tools
# ============================================================

echo "========================================================"
echo "[INFO] Installing AWS & Kubernetes Tools..."
echo "========================================================"

# ------------------------------------------------------------
# Install AWS CLI v2
# ------------------------------------------------------------
echo "[INFO] Installing AWS CLI v2..."

cd /tmp

curl -sS "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" \
-o awscliv2.zip

unzip -q awscliv2.zip

./aws/install --update

rm -rf aws awscliv2.zip

echo "[SUCCESS] AWS CLI Installed"

# ------------------------------------------------------------
# Verify AWS CLI
# ------------------------------------------------------------
aws --version

# ============================================================
# Install kubectl
# ============================================================

echo "[INFO] Installing kubectl..."

KUBECTL_VERSION=$(curl -L -s \
https://dl.k8s.io/release/stable.txt)

curl -LO \
https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl

install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

rm -f kubectl

echo "[SUCCESS] kubectl Installed"

kubectl version --client

# ============================================================
# Install eksctl
# ============================================================

echo "[INFO] Installing eksctl..."

ARCH=amd64

PLATFORM=$(uname -s)_${ARCH}

curl --silent --location \
"https://github.com/eksctl-io/eksctl/releases/latest/download/eksctl_${PLATFORM}.tar.gz" \
| tar xz -C /tmp

install -m 0755 /tmp/eksctl /usr/local/bin

rm -f /tmp/eksctl

echo "[SUCCESS] eksctl Installed"

eksctl version

# ============================================================
# Configure Jenkins Workspace
# ============================================================

echo "[INFO] Creating Kubernetes workspace..."

mkdir -p /var/lib/jenkins/.kube

chown -R jenkins:jenkins /var/lib/jenkins/.kube

chmod 700 /var/lib/jenkins/.kube

# ============================================================
# Configure AWS Directory
# ============================================================

mkdir -p /var/lib/jenkins/.aws

chown -R jenkins:jenkins /var/lib/jenkins/.aws

chmod 700 /var/lib/jenkins/.aws

# ============================================================
# Verify Installed Tools
# ============================================================

echo "--------------------------------------------------------"
echo "Installed Versions"
echo "--------------------------------------------------------"

echo "AWS CLI"

aws --version

echo

echo "kubectl"

kubectl version --client

echo

echo "eksctl"

eksctl version

echo "--------------------------------------------------------"

echo "[INFO] Part 6 completed successfully."

# ============================================================
# Part 7 - Final Verification & Cleanup
# ============================================================

echo "========================================================"
echo "[INFO] Running Final Verification..."
echo "========================================================"

# ------------------------------------------------------------
# Restart Services
# ------------------------------------------------------------

systemctl restart docker
systemctl restart mysql
systemctl restart jenkins

sleep 20

# ------------------------------------------------------------
# Verify Services
# ------------------------------------------------------------

SERVICES=(
    jenkins
    docker
    mysql
)

echo
echo "Service Status"
echo "=============="

for service in "${SERVICES[@]}"
do
    if systemctl is-active --quiet "$service"; then
        printf "%-15s : RUNNING\n" "$service"
    else
        printf "%-15s : FAILED\n" "$service"
    fi
done

echo

# ------------------------------------------------------------
# Verify Installed Tools
# ------------------------------------------------------------

echo "Installed Tools"
echo "==============="

printf "%-20s %s\n" "Java" "$(java -version 2>&1 | head -1)"

printf "%-20s %s\n" "Git" "$(git --version)"

printf "%-20s %s\n" "Docker" "$(docker --version)"

printf "%-20s %s\n" "Node" "$(node -v)"

printf "%-20s %s\n" "npm" "$(npm -v)"

printf "%-20s %s\n" "Python" "$(python3 --version)"

printf "%-20s %s\n" "Pip" "$(pip3 --version | head -1)"

printf "%-20s %s\n" "AWS CLI" "$(aws --version)"

printf "%-20s %s\n" "kubectl" "$(kubectl version --client --short 2>/dev/null || kubectl version --client)"

printf "%-20s %s\n" "eksctl" "$(eksctl version)"

printf "%-20s %s\n" "Trivy" "$(trivy --version | head -1)"

printf "%-20s %s\n" "Gitleaks" "$(gitleaks version)"

printf "%-20s %s\n" "OWASP ZAP" "$(zap -version | head -1)"

echo

# ------------------------------------------------------------
# Verify MySQL Database
# ------------------------------------------------------------

echo "Database Verification"
echo "====================="

mysql -e "SHOW DATABASES;" | grep devsecops_security || true


echo

# ------------------------------------------------------------
# Cleanup
# ------------------------------------------------------------

echo "Cleaning temporary files..."

apt-get autoremove -y

apt-get autoclean

rm -rf /tmp/*

echo

# ------------------------------------------------------------
# Jenkins Initial Password
# ------------------------------------------------------------

echo "========================================================"

echo "Jenkins Initial Admin Password"

echo "========================================================"

cat /var/lib/jenkins/secrets/initialAdminPassword

echo

# ------------------------------------------------------------
# Display Access Information
# ------------------------------------------------------------

PUBLIC_IP=$(curl -s http://checkip.amazonaws.com)

echo "========================================================"

echo "Jenkins URL"

echo "========================================================"

echo

echo "http://${PUBLIC_IP}:8080"

echo

echo "========================================================"

echo "Bootstrap Completed Successfully"

echo "Completed at: $(date)"

echo "========================================================"


