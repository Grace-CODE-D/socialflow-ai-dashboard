variable "env"              { type = string }
variable "vpc_id"           { type = string }
variable "public_subnet_ids"  { type = list(string) }
variable "private_subnet_ids" { type = list(string) }
variable "image_uri"        { type = string }

# Security group attached to the ECS service's ENIs, created outside this
# module (see the app_sg_id note in outputs.tf) so it can be shared with the
# rds/elasticache modules without creating a circular module dependency.
variable "app_sg_id"        { type = string }

# CPU/memory right-sizing
# Values are set based on observed p95 usage plus 20% headroom from Container Insights metrics.
# Fargate valid CPU/memory combinations: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-cpu-memory-error.html
# Default (dev/staging): 256 CPU units (0.25 vCPU) / 512 MB — sufficient for low-traffic environments.
# Production overrides are set in terraform/environments/prod/main.tf.
variable "cpu"              {
  type        = number
  default     = 256
  description = "Fargate task CPU units (256, 512, 1024, 2048, 4096). Set based on p95 usage + 20% headroom."
}
variable "memory"           {
  type        = number
  default     = 512
  description = "Fargate task memory in MiB. Must be compatible with the chosen cpu value."
}

variable "desired_count"    { type = number; default = 1 }
variable "container_port"   { type = number; default = 3001 }

# Split DB connection fields (replaces a single pre-assembled database_url)
# so the password is never stored as part of one combined Terraform-tracked
# SSM parameter value. See modules/ecs/main.tf for the SSM parameters and
# backend/src/config/config.ts for runtime reassembly.
variable "db_host"          { type = string }
variable "db_port"          { type = number; default = 5432 }
variable "db_name"          { type = string }
variable "db_username"      { type = string }
variable "db_password"      { type = string; sensitive = true }

variable "redis_url"        { type = string; sensitive = true }
variable "jwt_secret"       { type = string; sensitive = true }
variable "s3_bucket"        { type = string }
variable "aws_region"       { type = string }
