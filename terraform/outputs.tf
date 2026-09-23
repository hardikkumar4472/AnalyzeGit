output "instance_id" {
  description = "EC2 Instance ID"
  value       = aws_instance.app_server.id
}

output "public_ip" {
  description = "Public Elastic IP address of the EC2 Instance"
  value       = aws_eip.app_eip.public_ip
}

output "public_dns" {
  description = "Public DNS of the EC2 Instance"
  value       = aws_eip.app_eip.public_dns
}

output "ssh_command" {
  description = "Example command to SSH into your instance (if key_name was provided)"
  value       = "ssh -i <your-key.pem> ubuntu@${aws_eip.app_eip.public_ip}"
}

output "app_url" {
  description = "Frontend URL to access the deployed application"
  value       = "http://${aws_eip.app_eip.public_ip}"
}

output "api_gateway_url" {
  description = "API Gateway Endpoint URL"
  value       = "http://${aws_eip.app_eip.public_ip}:5000"
}

output "s3_bucket_name" {
  description = "Name of the created S3 bucket for resume and document uploads"
  value       = aws_s3_bucket.resumes_bucket.id
}

output "s3_bucket_arn" {
  description = "ARN of the created S3 bucket"
  value       = aws_s3_bucket.resumes_bucket.arn
}

output "s3_bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.resumes_bucket.bucket_regional_domain_name
}

