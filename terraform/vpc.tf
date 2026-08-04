# ─────────────────────────────────────────────────────────────────
# VPC (Virtual Private Cloud) Configuration
#
# Architecture:
# VPC (10.0.0.0/16)
# ├── Public Subnet  (10.0.1.0/24) → Jenkins EC2, Load Balancer
# ├── Public Subnet  (10.0.2.0/24) → Multi-AZ requirement
# ├── Private Subnet (10.0.3.0/24) → EKS worker nodes
# └── Private Subnet (10.0.4.0/24) → EKS worker nodes (Multi-AZ)
#
# Public subnets: have direct internet access via Internet Gateway
# Private subnets: internet access ONLY via NAT Gateway (more secure)
# ─────────────────────────────────────────────────────────────────

# ── VPC ──────────────────────────────────────────────────────────
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true # Allow EC2 instances to have DNS names
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# ── Internet Gateway ─────────────────────────────────────────────
# Allows public subnets to communicate with internet
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

# ── Public Subnets ────────────────────────────────────────────────
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true # EC2s here get public IPs automatically

  tags = {
    Name                                            = "${var.project_name}-public-1"
    "kubernetes.io/role/elb"                        = "1" # EKS needs this
    "kubernetes.io/cluster/${var.project_name}-eks" = "shared"
  }
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true

  tags = {
    Name                                            = "${var.project_name}-public-2"
    "kubernetes.io/role/elb"                        = "1"
    "kubernetes.io/cluster/${var.project_name}-eks" = "shared"
  }
}

# ── Private Subnets ───────────────────────────────────────────────
resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "${var.aws_region}a"

  tags = {
    Name                                            = "${var.project_name}-private-1"
    "kubernetes.io/role/internal-elb"               = "1"
    "kubernetes.io/cluster/${var.project_name}-eks" = "shared"
  }
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.4.0/24"
  availability_zone = "${var.aws_region}b"

  tags = {
    Name                                            = "${var.project_name}-private-2"
    "kubernetes.io/role/internal-elb"               = "1"
    "kubernetes.io/cluster/${var.project_name}-eks" = "shared"
  }
}

# ── Elastic IP for NAT Gateway ────────────────────────────────────
# NAT Gateway needs a fixed public IP
resource "aws_eip" "nat" {
  domain = "vpc"
  tags = {
    Name = "${var.project_name}-nat-eip"
  }
}

# ── NAT Gateway ───────────────────────────────────────────────────
# Allows private subnet resources to reach internet (for pulling images, updates)
# but internet CANNOT initiate connections TO private subnet
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public_1.id # NAT lives in PUBLIC subnet

  tags = {
    Name = "${var.project_name}-nat"
  }

  depends_on = [aws_internet_gateway.main]
}

# ── Route Tables ──────────────────────────────────────────────────
# Public route table: traffic goes to Internet Gateway
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "${var.project_name}-public-rt" }
}

# Private route table: traffic goes to NAT Gateway
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = { Name = "${var.project_name}-private-rt" }
}

# ── Route Table Associations ──────────────────────────────────────
resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_1" {
  subnet_id      = aws_subnet.private_1.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_2" {
  subnet_id      = aws_subnet.private_2.id
  route_table_id = aws_route_table.private.id
}
