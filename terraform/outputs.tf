# ─────────────────────────────────────────────────────────────────
# Outputs — printed after terraform apply completes
# ─────────────────────────────────────────────────────────────────

output "jenkins_public_ip" {
  description = "Jenkins EC2 public IP — use for GitHub webhook"
  value       = aws_instance.jenkins.public_ip
}

output "jenkins_url" {
  description = "Jenkins Web UI URL"
  value       = "http://${aws_instance.jenkins.public_ip}:8080"
}

output "jenkins_ssh_command" {
  description = "SSH command to connect to Jenkins EC2"
  value       = "ssh -i terraform/jenkins-key.pem ubuntu@${aws_instance.jenkins.public_ip}"
}

output "eks_cluster_name" {
  description = "EKS cluster name — use with kubectl"
  value       = aws_eks_cluster.main.name
}

output "eks_cluster_endpoint" {
  description = "EKS API server endpoint"
  value       = aws_eks_cluster.main.endpoint
}

output "kubeconfig_command" {
  description = "Command to configure kubectl for this cluster"
  value       = "aws eks update-kubeconfig --name ${aws_eks_cluster.main.name} --region ${var.aws_region}"
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "setup_instructions" {
  description = "Next steps after terraform apply"
  value       = <<-EOT

    ════════════════════════════════════════════════════
    ✅ Infrastructure Created! Next Steps:
    ════════════════════════════════════════════════════

    1. SSH into Jenkins:
       ssh -i terraform/jenkins-key.pem ubuntu@${aws_instance.jenkins.public_ip}

    2. Get Jenkins initial password:
       sudo cat /var/lib/jenkins/secrets/initialAdminPassword

    3. Open Jenkins UI:
       http://${aws_instance.jenkins.public_ip}:8080

    4. Configure kubectl:
       aws eks update-kubeconfig --name ${aws_eks_cluster.main.name} --region ${var.aws_region}

    5. Update GitHub webhook URL to:
       http://${aws_instance.jenkins.public_ip}:8080/github-webhook/

    ════════════════════════════════════════════════════
  EOT
}

# ── ECR Outputs ───────────────────────────────────────────────────
output "ecr_backend_url" {
  description = "ECR Backend repository URL"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_url" {
  description = "ECR Frontend repository URL"
  value       = aws_ecr_repository.frontend.repository_url
}

output "ecr_registry" {
  description = "ECR Registry (account + region)"
  value       = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
}
