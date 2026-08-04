# ─────────────────────────────────────────────────────────────────
# Jenkins EC2 Instance
#
# This EC2 instance replaces your local Jenkins setup.
# It has a PUBLIC IP so GitHub webhooks work without ngrok.
# ─────────────────────────────────────────────────────────────────

# ── SSH Key Pair ──────────────────────────────────────────────────
# Generate a new SSH key pair for Jenkins EC2 access
resource "tls_private_key" "jenkins" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "jenkins" {
  key_name   = "${var.project_name}-jenkins-key"
  public_key = tls_private_key.jenkins.public_key_openssh
}

# Save private key to local file — you'll use this to SSH in
resource "local_file" "jenkins_private_key" {
  content         = tls_private_key.jenkins.private_key_pem
  filename        = "${path.module}/jenkins-key.pem"
  file_permission = "0400" # Read only by owner — required for SSH
}

# ── Security Group for Jenkins ────────────────────────────────────
resource "aws_security_group" "jenkins" {
  name        = "${var.project_name}-jenkins-sg"
  description = "Security group for Jenkins EC2 server"
  vpc_id      = aws_vpc.main.id

  # SSH access — from your IP only (secure)
  ingress {
    description = "SSH from your machine"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.your_ip_cidr]
  }

  # Jenkins Web UI & GitHub Webhook — port 8080
  ingress {
    description = "Jenkins Web UI and GitHub Webhook"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # All outbound traffic allowed (for HTTPS plugin downloads, package updates, etc.)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-jenkins-sg" }
}

# ── Find Latest Ubuntu 22.04 AMI ──────────────────────────────────
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical (Ubuntu's official AWS account)

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ── IAM Role for Jenkins EC2 ──────────────────────────────────────
# Allows Jenkins to interact with AWS services without hardcoded keys
resource "aws_iam_role" "jenkins" {
  name = "${var.project_name}-jenkins-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

# IAM policy allowing Jenkins to describe and discover EKS clusters
resource "aws_iam_policy" "jenkins_eks" {
  name        = "${var.project_name}-jenkins-eks-policy"
  description = "Allows Jenkins EC2 server to describe and list EKS clusters"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "eks:DescribeCluster",
          "eks:ListClusters"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "jenkins_eks" {
  role       = aws_iam_role.jenkins.name
  policy_arn = aws_iam_policy.jenkins_eks.arn
}

resource "aws_iam_role_policy_attachment" "jenkins_ecr" {
  role       = aws_iam_role.jenkins.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser"
}

resource "aws_iam_instance_profile" "jenkins" {
  name = "${var.project_name}-jenkins-profile"
  role = aws_iam_role.jenkins.name
}

# ── Jenkins EC2 Instance ──────────────────────────────────────────
resource "aws_instance" "jenkins" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.jenkins_instance_type
  subnet_id              = aws_subnet.public_1.id
  vpc_security_group_ids = [aws_security_group.jenkins.id]
  key_name               = aws_key_pair.jenkins.key_name
  iam_instance_profile   = aws_iam_instance_profile.jenkins.name

  # Root volume — 30GB (Jenkins workspace + Docker images need space)
  root_block_device {
    volume_type           = "gp3"
    volume_size           = 30
    delete_on_termination = true
    encrypted             = true
  }

  tags = {
    Name = "${var.project_name}-jenkins"
  }
}

# ── ECR Full Access for Jenkins ────────────────────────────────────
resource "aws_iam_policy" "jenkins_ecr_policy" {
  name        = "${var.project_name}-jenkins-ecr-policy"
  description = "Allows Jenkins to push images to ECR"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:GetRepositoryPolicy",
          "ecr:DescribeRepositories",
          "ecr:ListImages",
          "ecr:DescribeImages",
          "ecr:BatchGetImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "jenkins_ecr_push" {
  role       = aws_iam_role.jenkins.name
  policy_arn = aws_iam_policy.jenkins_ecr_policy.arn
}
