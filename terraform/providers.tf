# ─────────────────────────────────────────────────────────────────
# Terraform Providers Configuration
# ─────────────────────────────────────────────────────────────────

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.1"
    }
    # TLS provider — generates SSH key pairs
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
    # Local provider — writes files to local disk
    local = {
      source  = "hashicorp/local"
      version = "~> 2.4"
    }
  }
}

# Configure AWS provider
provider "aws" {
  region = var.aws_region

  # Tags applied to EVERY resource created
  # Makes billing and cleanup easy
  default_tags {
    tags = {
      Project     = "SentinelOps"
      Environment = "dev"
      ManagedBy   = "terraform"
      Course      = "PGCP-ITISS-2026"
    }
  }
}
