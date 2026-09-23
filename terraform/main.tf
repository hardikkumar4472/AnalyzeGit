# -------------------------------------------------------------
# 1. VPC & Networking
# -------------------------------------------------------------
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project_name}-vpc"
    Environment = var.environment
  }
}

resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.project_name}-igw"
    Environment = var.environment
  }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = var.availability_zone
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project_name}-public-subnet"
    Environment = var.environment
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }

  tags = {
    Name        = "${var.project_name}-public-rt"
    Environment = var.environment
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# -------------------------------------------------------------
# 2. Security Group (Firewall Rules)
# -------------------------------------------------------------
resource "aws_security_group" "app_sg" {
  name        = "${var.project_name}-sg"
  description = "Security group for AnalyzeGit EC2 host running Docker & K8s/Microservices"
  vpc_id      = aws_vpc.main.id

  # SSH Access
  ingress {
    description = "SSH access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidr
  }

  # HTTP / Frontend
  ingress {
    description = "HTTP Traffic / Frontend"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS
  ingress {
    description = "HTTPS Traffic"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # API Gateway
  ingress {
    description = "API Gateway Port"
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Vite Frontend Dev Port (Optional)
  ingress {
    description = "Vite Dev Port"
    from_port   = 5173
    to_port     = 5173
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Grafana Dashboard Port
  ingress {
    description = "Grafana Observability Dashboard"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Prometheus Server Port
  ingress {
    description = "Prometheus Metrics Server"
    from_port   = 9090
    to_port     = 9090
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Kubernetes NodePort Range (Optional for K8s ingress)
  ingress {
    description = "Kubernetes NodePort Range"
    from_port   = 30000
    to_port     = 32767
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Outbound All Traffic
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-sg"
    Environment = var.environment
  }
}

# -------------------------------------------------------------
# 3. Ubuntu 22.04 LTS AMI Data Source
# -------------------------------------------------------------
data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["099720109477"] # Canonical
}

# -------------------------------------------------------------
# 4. EC2 Instance Provisioning with Docker, K8s (k3s), and Git
# -------------------------------------------------------------
resource "aws_instance" "app_server" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.app_sg.id]
  key_name               = var.key_name != "" ? var.key_name : null

  root_block_device {
    volume_size           = var.root_volume_size
    volume_type           = var.root_volume_type
    delete_on_termination = true
  }

  # User Data Script to automatically install Docker, Docker Compose, kubectl, and lightweight k3s Kubernetes
  user_data = <<-EOF
              #!/bin/bash
              set -e

              # Set system timezone to Mumbai (Asia/Kolkata)
              timedatectl set-timezone Asia/Kolkata || ln -sf /usr/share/zoneinfo/Asia/Kolkata /etc/localtime

              # Update system
              apt-get update -y
              apt-get upgrade -y

              # Configure 4GB Swap (Essential for Free Tier t2.micro with 1GB RAM)
              fallocate -l 4G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096
              chmod 600 /swapfile
              mkswap /swapfile
              swapon /swapfile
              echo '/swapfile none swap sw 0 0' >> /etc/fstab

              # Install essential tools
              apt-get install -y curl wget git apt-transport-https ca-certificates gnupg lsb-release

              # Install Docker & Docker Compose
              mkdir -p /etc/apt/keyrings
              curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
              echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
              apt-get update -y
              apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin docker-compose

              # Add ubuntu user to docker group
              usermod -aG docker ubuntu
              systemctl enable docker
              systemctl start docker

              # Install kubectl
              curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
              install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
              rm kubectl

              # Install lightweight single-node Kubernetes (K3s) with Metrics Server enabled for HPA
              curl -sfL https://get.k3s.io | sh -s - --write-kubeconfig-mode 644
              mkdir -p /home/ubuntu/.kube
              cp /etc/rancher/k3s/k3s.yaml /home/ubuntu/.kube/config
              chown -R ubuntu:ubuntu /home/ubuntu/.kube

              echo "AnalyzeGit EC2 Server Initialization Complete!" > /var/log/startup-complete.log
              EOF

  tags = {
    Name        = "${var.project_name}-server"
    Environment = var.environment
  }
}

# -------------------------------------------------------------
# 5. Elastic IP (Static Public IP)
# -------------------------------------------------------------
resource "aws_eip" "app_eip" {
  instance = aws_instance.app_server.id
  domain   = "vpc"

  tags = {
    Name        = "${var.project_name}-eip"
    Environment = var.environment
  }
}

# -------------------------------------------------------------
# 6. S3 Bucket for Resume & Document Storage
# -------------------------------------------------------------
resource "random_string" "bucket_suffix" {
  length  = 6
  special = false
  upper   = false
}

resource "aws_s3_bucket" "resumes_bucket" {
  bucket        = "${var.s3_bucket_name}-${random_string.bucket_suffix.result}"
  force_destroy = true

  tags = {
    Name        = "${var.project_name}-resumes-bucket"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_cors_configuration" "resumes_cors" {
  bucket = aws_s3_bucket.resumes_bucket.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_public_access_block" "resumes_public_access" {
  bucket = aws_s3_bucket.resumes_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "resumes_public_read_policy" {
  depends_on = [aws_s3_bucket_public_access_block.resumes_public_access]
  bucket     = aws_s3_bucket.resumes_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.resumes_bucket.arn}/*"
      }
    ]
  })
}

