# ─────────────────────────────────────────────────────────────────
# Input Variables
# ─────────────────────────────────────────────────────────────────

variable "aws_region" {
  description = "AWS region to deploy in"
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Project name used for naming all resources"
  type        = string
  default     = "SentinelOps"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "jenkins_instance_type" {
  description = "EC2 instance type for Jenkins server"
  type        = string
  default     = "t3.small"
}

variable "your_ip_cidr" {
  description = "Your IP address for SSH access (run: curl ifconfig.me)"
  type        = string
  # CHANGE THIS to your actual IP + /32
  default = "0.0.0.0/0"
}

variable "eks_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.31"
}

