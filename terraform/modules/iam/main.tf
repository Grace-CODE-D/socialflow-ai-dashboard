resource "aws_iam_role" "terraform_executor" {
  name = "socialflow-terraform-${var.env}-executor"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = var.trusted_principals
        }
      }
    ]
  })

  tags = {
    Environment = var.env
    Purpose     = "Terraform State Access"
  }
}

resource "aws_iam_role_policy" "terraform_state_access" {
  name = "socialflow-terraform-${var.env}-state-access"
  role = aws_iam_role.terraform_executor.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3StateAccess"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "arn:aws:s3:::socialflow-terraform-state/env/${var.env}/*"
      },
      {
        Sid    = "S3ListBucket"
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = "arn:aws:s3:::socialflow-terraform-state"
        Condition = {
          StringLike = {
            "s3:prefix" = "env/${var.env}/*"
          }
        }
      },
      {
        Sid    = "DynamoDBLockAccess"
        Effect = "Allow"
        Action = [
          "dynamodb:DescribeTable",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem"
        ]
        Resource = "arn:aws:dynamodb:*:*:table/socialflow-terraform-locks"
        Condition = {
          StringEquals = {
            "dynamodb:LeadingKeys" = ["env/${var.env}"]
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "terraform_infrastructure_access" {
  name = "socialflow-terraform-${var.env}-infrastructure-access"
  role = aws_iam_role.terraform_executor.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EC2Access"
        Effect = "Allow"
        Action = [
          "ec2:DescribeVpcs",
          "ec2:CreateVpc",
          "ec2:DeleteVpc",
          "ec2:DescribeSubnets",
          "ec2:CreateSubnet",
          "ec2:DeleteSubnet",
          "ec2:DescribeInternetGateways",
          "ec2:AttachInternetGateway",
          "ec2:CreateInternetGateway",
          "ec2:DeleteInternetGateway",
          "ec2:DescribeNatGateways",
          "ec2:CreateNatGateway",
          "ec2:DeleteNatGateway",
          "ec2:DescribeEips",
          "ec2:CreateEip",
          "ec2:DeleteEip",
          "ec2:DescribeRouteTables",
          "ec2:CreateRouteTable",
          "ec2:DeleteRouteTable",
          "ec2:CreateRoute",
          "ec2:DeleteRoute",
          "ec2:AssociateRouteTable",
          "ec2:DisassociateRouteTable",
          "ec2:DescribeSecurityGroups",
          "ec2:CreateSecurityGroup",
          "ec2:DeleteSecurityGroup",
          "ec2:AuthorizeSecurityGroupIngress",
          "ec2:AuthorizeSecurityGroupEgress",
          "ec2:RevokeSecurityGroupIngress",
          "ec2:RevokeSecurityGroupEgress",
          "ec2:DescribeFlowLogs",
          "ec2:CreateFlowLogs",
          "ec2:DeleteFlowLogs",
          "ec2:CreateTags",
          "ec2:DeleteTags"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestedRegion" = var.aws_region
          }
        }
      },
      {
        Sid    = "RDSAccess"
        Effect = "Allow"
        Action = [
          "rds:DescribeDBSubnetGroups",
          "rds:CreateDBSubnetGroup",
          "rds:DeleteDBSubnetGroup",
          "rds:DescribeDBParameterGroups",
          "rds:CreateDBParameterGroup",
          "rds:DeleteDBParameterGroup",
          "rds:DescribeDBInstances",
          "rds:CreateDBInstance",
          "rds:DeleteDBInstance",
          "rds:ModifyDBInstance",
          "rds:AddTagsToResource",
          "rds:RemoveTagsFromResource"
        ]
        Resource = "arn:aws:rds:*:*:db/socialflow-${var.env}-*"
      },
      {
        Sid    = "ElastiCacheAccess"
        Effect = "Allow"
        Action = [
          "elasticache:DescribeCacheSubnetGroups",
          "elasticache:CreateCacheSubnetGroup",
          "elasticache:DeleteCacheSubnetGroup",
          "elasticache:DescribeReplicationGroups",
          "elasticache:CreateReplicationGroup",
          "elasticache:DeleteReplicationGroup",
          "elasticache:ModifyReplicationGroup",
          "elasticache:AddTagsToResource",
          "elasticache:RemoveTagsFromResource"
        ]
        Resource = "arn:aws:elasticache:*:*:cluster:socialflow-${var.env}-*"
      },
      {
        Sid    = "ECSAccess"
        Effect = "Allow"
        Action = [
          "ecs:DescribeClusters",
          "ecs:CreateCluster",
          "ecs:DeleteCluster",
          "ecs:DescribeTaskDefinitions",
          "ecs:RegisterTaskDefinition",
          "ecs:DeregisterTaskDefinition",
          "ecs:DescribeServices",
          "ecs:CreateService",
          "ecs:UpdateService",
          "ecs:DeleteService",
          "ecs:DescribeTasks",
          "ecs:RunTask",
          "ecs:StopTask"
        ]
        Resource = "arn:aws:ecs:*:*:cluster/socialflow-${var.env}-*"
      },
      {
        Sid    = "ECRAccess"
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage"
        ]
        Resource = "arn:aws:ecr:*:*:repository/socialflow-${var.env}-*"
      },
      {
        Sid    = "IAMRoleAccess"
        Effect = "Allow"
        Action = [
          "iam:CreateRole",
          "iam:DeleteRole",
          "iam:GetRole",
          "iam:PutRolePolicy",
          "iam:DeleteRolePolicy",
          "iam:AttachRolePolicy",
          "iam:DetachRolePolicy",
          "iam:PassRole"
        ]
        Resource = "arn:aws:iam::*:role/socialflow-${var.env}-*"
      }
    ]
  })
}
