variable "aws_region" {
  type        = string
  description = "AWS region for infrastructure deployment"
  default     = "ap-south-1"
}

variable "environment" {
  type        = string
  description = "Deployment environment name (e.g. dev, staging, prod)"
  default     = "production"
}

variable "project_name" {
  type        = string
  description = "Project name identifier"
  default     = "analyzegit"
}

# --- VPC & Networking Variables ---
variable "vpc_cidr" {
  type        = string
  description = "CIDR block for VPC"
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  type        = string
  description = "CIDR block for public subnet"
  default     = "10.0.1.0/24"
}

variable "availability_zone" {
  type        = string
  description = "Availability zone for subnets"
  default     = "ap-south-1a"
}

# --- EC2 Instance Variables ---
variable "instance_type" {
  type        = string
  description = "EC2 instance size"
  default     = "t3.micro"
}

variable "key_name" {
  type        = string
  description = "Name of existing AWS EC2 Key Pair for SSH access (optional)"
  default     = ""
}

variable "root_volume_size" {
  type        = number
  description = "Root EBS storage volume size in GB"
  default     = 30
}

variable "root_volume_type" {
  type        = string
  description = "EBS volume type"
  default     = "gp3"
}

# --- Inbound Allowed Traffic ---
variable "allowed_ssh_cidr" {
  type        = list(string)
  description = "CIDR blocks allowed for SSH access (default: all, recommended: restrict to your IP)"
  default     = ["0.0.0.0/0"]
}

# --- S3 Storage Variables ---
variable "s3_bucket_name" {
  type        = string
  description = "Name for the S3 bucket to store candidate resumes and documents"
  default     = "analyzegit-resumes-bucket"
}

