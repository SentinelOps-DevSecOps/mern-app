# ─────────────────────────────────────────────────────────────────
# EKS (Elastic Kubernetes Service) Cluster
#
# This is the managed Kubernetes cluster where your
# MERN app will run in production.
# ─────────────────────────────────────────────────────────────────

# ── IAM Role for EKS Control Plane ───────────────────────────────
resource "aws_iam_role" "eks_cluster" {
  name = "${var.project_name}-eks-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "eks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  role       = aws_iam_role.eks_cluster.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

# ── IAM Role for EKS Worker Nodes ────────────────────────────────
resource "aws_iam_role" "eks_nodes" {
  name = "${var.project_name}-eks-nodes-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  role       = aws_iam_role.eks_nodes.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  role       = aws_iam_role.eks_nodes.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}

resource "aws_iam_role_policy_attachment" "eks_ecr_readonly" {
  role       = aws_iam_role.eks_nodes.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

# ── Security Group for EKS ────────────────────────────────────────
resource "aws_security_group" "eks" {
  name        = "${var.project_name}-eks-sg"
  description = "Security group for EKS cluster"
  vpc_id      = aws_vpc.main.id

  # Allow Jenkins EC2 to reach EKS API
  ingress {
    description     = "Jenkins to EKS API"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.jenkins.id]
  }

  # Allow nodes to communicate with each other
  ingress {
    description = "Node to node communication"
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    self        = true
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-eks-sg" }
}

# ── EKS Cluster ───────────────────────────────────────────────────
resource "aws_eks_cluster" "main" {
  name     = "${var.project_name}-eks"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = var.eks_version


  vpc_config {
    subnet_ids = [
      aws_subnet.private_1.id,
      aws_subnet.private_2.id,
      aws_subnet.public_1.id,
      aws_subnet.public_2.id
    ]
    security_group_ids      = [aws_security_group.eks.id]
    endpoint_private_access = true
    endpoint_public_access  = true # Allows kubectl from your laptop
  }

  access_config {
    authentication_mode = "API_AND_CONFIG_MAP"
  }

  # Enable control plane logging
  enabled_cluster_log_types = ["api", "audit", "authenticator"]

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
  ]

  tags = { Name = "${var.project_name}-eks" }
}

# ── EKS Access Entry for Current IAM Caller ─────────────────────────
# Grants the local admin IAM user/role cluster access for kubectl
resource "aws_eks_access_entry" "admin_caller" {
  cluster_name  = aws_eks_cluster.main.name
  principal_arn = data.aws_caller_identity.current.arn
  type          = "STANDARD"
}

resource "aws_eks_access_policy_association" "admin_caller_policy" {
  cluster_name  = aws_eks_cluster.main.name
  policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
  principal_arn = data.aws_caller_identity.current.arn

  access_scope {
    type = "cluster"
  }
}

# ── EKS Access Entry for Jenkins IAM Role ──────────────────────────
# Grants Jenkins server cluster access so kubectl and deployment pipelines work
resource "aws_eks_access_entry" "jenkins" {
  cluster_name  = aws_eks_cluster.main.name
  principal_arn = aws_iam_role.jenkins.arn
  type          = "STANDARD"
}

resource "aws_eks_access_policy_association" "jenkins_admin" {
  cluster_name  = aws_eks_cluster.main.name
  policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
  principal_arn = aws_iam_role.jenkins.arn

  access_scope {
    type = "cluster"
  }
}


# ── EKS Node Group ─────────────────────────────────────────────────
# These are the EC2 instances that actually run your pods
resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.project_name}-nodes"
  node_role_arn   = aws_iam_role.eks_nodes.arn

  # Use private subnets for nodes (more secure)
  subnet_ids = [
    aws_subnet.private_1.id,
    aws_subnet.private_2.id
  ]

  # Auto scaling configuration
  scaling_config {
    desired_size = 2 # Start with 2 nodes
    max_size     = 4 # Scale up to 4 when needed
    min_size     = 1 # Never go below 1
  }

  instance_types = ["t3.small"] # 2 vCPU, 2GB RAM each (supports up to 11 pods per node)

  # Node disk
  disk_size = 20

  # Use latest EKS-optimized AMI
  ami_type = "AL2_x86_64"

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_ecr_readonly,
  ]

  tags = { Name = "${var.project_name}-node-group" }
}
