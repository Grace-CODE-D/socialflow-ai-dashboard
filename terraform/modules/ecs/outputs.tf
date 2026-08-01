output "alb_dns_name" { value = aws_lb.main.dns_name }

# app_sg_id is no longer created here — it's a root-level resource (see
# environments/{dev,prod}/main.tf) shared by the ecs, rds, and elasticache
# modules so that rds/elasticache no longer need to depend on this module's
# output, which previously created a circular dependency (ecs depended on
# rds.endpoint for database_url, while rds depended on ecs.app_sg_id).
output "alb_sg_id"    { value = aws_security_group.alb.id }
output "cluster_name" { value = aws_ecs_cluster.main.name }
