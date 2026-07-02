# AWS Well-Architected Framework - Implementation Guide

Practical guidance for implementing AWS Well-Architected pillars in cloud architectures.

> **Labcorp delivery note:** For production Terraform, implement using **TFCOM/TFMOD/TFDAT** per `labcorp-terraform-module-hierarchy.md`. Raw `aws_*` examples in this file illustrate Well-Architected pillar concepts — not Labcorp catalog patterns. See `labcorp-terraform-worked-example.md` for a catalog-aligned implementation.

---

## 1. Operational Excellence

### Design Principles
- Perform operations as code (IaC)
- Make frequent, small, reversible changes
- Refine operations procedures frequently
- Anticipate failure
- Learn from operational failures

### Key Practices

#### Infrastructure as Code
```hcl
# Terraform module for operational excellence
module "application" {
  source = "./modules/app"
  
  # Enable detailed monitoring
  enable_enhanced_monitoring = true
  
  # Automated deployment
  deployment_strategy = "blue_green"
  
  # Automated rollback
  rollback_on_alarm = true
  
  # CloudWatch alarms
  alarms = {
    error_rate = {
      threshold           = 5
      evaluation_periods  = 2
      alarm_actions      = [aws_sns_topic.ops_alerts.arn]
    }
  }
}
```

#### Runbooks and Playbooks
```yaml
# Example runbook structure
runbook:
  name: "Database Connection Pool Exhausted"
  severity: HIGH
  
  detection:
    - metric: "DatabaseConnectionPoolUtilization"
      threshold: "> 90%"
      duration: "5 minutes"
  
  investigation:
    - step: "Check current connection count"
      command: "aws rds describe-db-instances --query 'DBInstances[0].DbInstanceStatus'"
    
    - step: "Review application logs for connection leaks"
      command: "aws logs filter-log-events --log-group-name /aws/lambda/app --filter-pattern 'connection timeout'"
  
  remediation:
    - step: "Scale up RDS instance class temporarily"
      command: "aws rds modify-db-instance --db-instance-identifier prod-db --db-instance-class db.r5.2xlarge --apply-immediately"
    
    - step: "Restart application to clear connection pool"
      command: "aws ecs update-service --cluster prod --service app --force-new-deployment"
  
  prevention:
    - "Review connection pool configuration"
    - "Implement connection leak detection in application"
    - "Set up connection pool size auto-scaling"
```

---

## 2. Security

### Design Principles
- Implement strong identity foundation
- Enable traceability
- Apply security at all layers
- Automate security best practices
- Protect data in transit and at rest
- Keep people away from data
- Prepare for security events

### Key Practices

#### Least Privilege IAM
```hcl
# IAM role with least privilege for Lambda function
resource "aws_iam_role" "lambda_execution" {
  name = "labcorp-lambda-execution"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_policy" "lambda_permissions" {
  name = "labcorp-lambda-permissions"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query"
          # READ-ONLY, no PutItem/DeleteItem
        ]
        Resource = aws_dynamodb_table.patients.arn
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = "arn:aws:secretsmanager:us-east-1:*:secret:prod/*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}
```

#### Security Layers
```hcl
# Defense in depth - multiple security layers
module "secure_workload" {
  source = "./modules/secure-workload"
  
  # Layer 1: Network isolation
  vpc_id              = aws_vpc.main.id
  private_subnet_ids  = aws_subnet.private[*].id
  
  # Layer 2: Security groups
  security_groups = {
    alb = {
      ingress = [{
        from_port   = 443
        to_port     = 443
        protocol    = "tcp"
        cidr_blocks = ["10.0.0.0/8"]  # Internal only
      }]
    }
    app = {
      ingress = [{
        from_port       = 8080
        to_port         = 8080
        protocol        = "tcp"
        security_groups = [aws_security_group.alb.id]
      }]
    }
    db = {
      ingress = [{
        from_port       = 5432
        to_port         = 5432
        protocol        = "tcp"
        security_groups = [aws_security_group.app.id]
      }]
    }
  }
  
  # Layer 3: WAF
  waf_rules = [
    "AWSManagedRulesCommonRuleSet",
    "AWSManagedRulesKnownBadInputsRuleSet",
    "AWSManagedRulesSQLiRuleSet"
  ]
  
  # Layer 4: Encryption
  encryption = {
    at_rest  = { kms_key_id = aws_kms_key.app.id }
    in_transit = { tls_version = "TLSv1.2" }
  }
  
  # Layer 5: Secrets management
  secrets_in_secrets_manager = true
  
  # Layer 6: Audit logging
  enable_cloudtrail = true
  enable_vpc_flow_logs = true
}
```

---

## 3. Reliability

### Design Principles
- Automatically recover from failure
- Test recovery procedures
- Scale horizontally
- Stop guessing capacity
- Manage change through automation

### Key Practices

#### Multi-AZ Deployment
```hcl
# Highly available architecture across AZs
resource "aws_db_instance" "main" {
  identifier = "labcorp-prod-db"
  
  # Multi-AZ for automatic failover
  multi_az = true
  
  # Automated backups
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  
  # Maintenance window
  maintenance_window = "sun:04:00-sun:05:00"
  
  # Automated minor version upgrades
  auto_minor_version_upgrade = true
}

resource "aws_autoscaling_group" "app" {
  name = "labcorp-app-asg"
  
  # Span multiple AZs
  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
  
  min_size         = 3  # At least 1 per AZ
  max_size         = 12
  desired_capacity = 6  # 2 per AZ
  
  # Health checks
  health_check_type         = "ELB"
  health_check_grace_period = 300
  
  # Termination policies
  termination_policies = ["OldestInstance"]
  
  # Instance refresh for zero-downtime updates
  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 66  # Keep 2/3 healthy during update
    }
  }
}
```

#### Chaos Engineering
```python
# AWS Fault Injection Simulator experiment template
experiment_template = {
    "description": "Test application resilience to AZ failure",
    "stopConditions": [{
        "source": "aws:cloudwatch:alarm",
        "value": "arn:aws:cloudwatch:us-east-1:123:alarm:HighErrorRate"
    }],
    "targets": {
        "AppInstances": {
            "resourceType": "aws:ec2:instance",
            "resourceTags": {
                "Application": "labcorp-app",
                "Environment": "staging"
            },
            "filters": [{
                "path": "Placement.AvailabilityZone",
                "values": ["us-east-1a"]
            }],
            "selectionMode": "ALL"
        }
    },
    "actions": {
        "SimulateAZFailure": {
            "actionId": "aws:ec2:stop-instances",
            "parameters": {},
            "targets": {
                "Instances": "AppInstances"
            }
        }
    }
}
```

---

## 4. Performance Efficiency

### Design Principles
- Democratize advanced technologies
- Go global in minutes
- Use serverless architectures
- Experiment more often
- Consider mechanical sympathy

### Key Practices

#### Right-Sizing
```python
# AWS Cost Explorer API - Analyze rightsizing recommendations
import boto3

ce = boto3.client('ce')

def get_rightsizing_recommendations():
    """Get EC2 rightsizing recommendations."""
    response = ce.get_rightsizing_recommendation(
        Service='AmazonEC2',
        Configuration={
            'RecommendationTarget': 'SAME_INSTANCE_FAMILY',
            'BenefitsConsidered': True
        }
    )
    
    for rec in response['RightsizingRecommendations']:
        current = rec['CurrentInstance']
        recommended = rec['ModifyRecommendationDetail']['TargetInstances'][0]
        
        print(f"Instance: {current['ResourceDetails']['EC2ResourceDetails']['InstanceType']}")
        print(f"Recommendation: {recommended['ResourceDetails']['EC2ResourceDetails']['InstanceType']}")
        print(f"Estimated savings: ${recommended['EstimatedMonthlySavings']}")
```

#### Caching Strategy
```hcl
# Multi-layer caching architecture
resource "aws_elasticache_cluster" "app_cache" {
  cluster_id           = "labcorp-app-cache"
  engine              = "redis"
  engine_version      = "7.0"
  node_type           = "cache.r6g.large"
  num_cache_nodes     = 3
  parameter_group_name = aws_elasticache_parameter_group.app.name
  
  # High availability
  az_mode = "cross-az"
  
  # Automatic failover
  automatic_failover_enabled = true
}

# CloudFront for edge caching
resource "aws_cloudfront_distribution" "app" {
  enabled = true
  
  origin {
    domain_name = aws_lb.app.dns_name
    origin_id   = "alb"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
    }
  }
  
  default_cache_behavior {
    target_origin_id = "alb"
    
    # Cache based on headers and query strings
    cache_policy_id = aws_cloudfront_cache_policy.optimized.id
    
    # Compress content
    compress = true
    
    # Allowed methods
    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    cached_methods  = ["GET", "HEAD"]
  }
}
```

---

## 5. Cost Optimization

### Design Principles
- Implement cloud financial management
- Adopt a consumption model
- Measure overall efficiency
- Stop spending on undifferentiated heavy lifting
- Analyze and attribute expenditure

### Key Practices

#### Cost Allocation and Tagging
```hcl
# Consistent tagging strategy
locals {
  common_tags = {
    Environment     = var.environment
    CostCenter     = var.cost_center
    Application    = var.application_name
    Owner          = var.owner_email
    ManagedBy      = "terraform"
    Project        = var.project_name
    DataClass      = var.data_classification
    BackupPolicy   = var.backup_policy
  }
}

resource "aws_instance" "app" {
  ami           = data.aws_ami.app.id
  instance_type = var.instance_type
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.application_name}-${var.environment}-app"
      Role = "application-server"
    }
  )
}

# Cost allocation tags
resource "aws_organizations_policy_attachment" "cost_allocation" {
  policy_id = aws_organizations_policy.cost_allocation.id
  target_id = data.aws_organizations_organization.main.roots[0].id
}

resource "aws_organizations_policy" "cost_allocation" {
  name = "CostAllocationTags"
  
  content = jsonencode({
    tags = {
      cost_allocation_tags = {
        tag_keys = [
          "Environment",
          "CostCenter",
          "Application",
          "Project"
        ]
      }
    }
  })
}
```

#### Reserved Capacity and Savings Plans
```python
# Analyze RI coverage and recommendations
def analyze_ri_coverage():
    """Analyze Reserved Instance coverage and savings."""
    ce = boto3.client('ce')
    
    # Get RI coverage
    response = ce.get_reservation_coverage(
        TimePeriod={
            'Start': '2024-01-01',
            'End': '2024-02-01'
        },
        Granularity='MONTHLY',
        Metrics=['CoverageHours', 'CoverageNormalizedUnits']
    )
    
    for period in response['CoveragesByTime']:
        coverage = period['Total']['CoverageHours']['CoverageHoursPercentage']
        print(f"RI Coverage: {coverage}%")
    
    # Get RI purchase recommendations
    recommendations = ce.get_reservation_purchase_recommendation(
        Service='Amazon Elastic Compute Cloud - Compute',
        LookbackPeriodInDays='SIXTY_DAYS',
        TermInYears='ONE_YEAR',
        PaymentOption='NO_UPFRONT'
    )
    
    for rec in recommendations['Recommendations']:
        print(f"Instance Type: {rec['RecommendationDetails']['InstanceDetails']['EC2InstanceDetails']['InstanceType']}")
        print(f"Estimated Monthly Savings: ${rec['RecommendationDetails']['EstimatedMonthlySavingsAmount']}")
```

#### Auto-Scaling for Cost
```hcl
# Cost-optimized auto-scaling
resource "aws_autoscaling_policy" "scale_down_aggressive" {
  name                   = "scale-down-aggressive"
  autoscaling_group_name = aws_autoscaling_group.app.name
  
  policy_type = "TargetTrackingScaling"
  
  target_tracking_configuration {
    target_value = 40.0  # Lower threshold for scaling down
    
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    
    # Scale down quickly to save costs
    scale_in_cooldown = 60
  }
}

# Scheduled scaling for predictable patterns
resource "aws_autoscaling_schedule" "business_hours_scale_up" {
  scheduled_action_name  = "business-hours-scale-up"
  autoscaling_group_name = aws_autoscaling_group.app.name
  
  recurrence      = "0 8 * * MON-FRI"  # 8 AM Monday-Friday
  desired_capacity = 10
}

resource "aws_autoscaling_schedule" "evening_scale_down" {
  scheduled_action_name  = "evening-scale-down"
  autoscaling_group_name = aws_autoscaling_group.app.name
  
  recurrence      = "0 18 * * *"  # 6 PM daily
  desired_capacity = 2  # Minimal capacity
}

# Weekend scale-down
resource "aws_autoscaling_schedule" "weekend_scale_down" {
  scheduled_action_name  = "weekend-scale-down"
  autoscaling_group_name = aws_autoscaling_group.app.name
  
  recurrence      = "0 20 * * FRI"  # 8 PM Friday
  desired_capacity = 1
}
```

---

## 6. Sustainability

### Design Principles
- Understand your impact
- Establish sustainability goals
- Maximize utilization
- Anticipate and adopt new hardware and software
- Use managed services
- Reduce downstream impact

### Key Practices

#### Right-Sizing and Efficiency
```python
# Identify idle resources for termination
def find_idle_resources():
    """Find underutilized resources to reduce carbon footprint."""
    cloudwatch = boto3.client('cloudwatch')
    ec2 = boto3.client('ec2')
    
    instances = ec2.describe_instances(
        Filters=[{'Name': 'instance-state-name', 'Values': ['running']}]
    )
    
    idle_instances = []
    
    for reservation in instances['Reservations']:
        for instance in reservation['Instances']:
            # Get CPU utilization for last 7 days
            metrics = cloudwatch.get_metric_statistics(
                Namespace='AWS/EC2',
                MetricName='CPUUtilization',
                Dimensions=[{'Name': 'InstanceId', 'Value': instance['InstanceId']}],
                StartTime=datetime.now() - timedelta(days=7),
                EndTime=datetime.now(),
                Period=86400,  # 1 day
                Statistics=['Average']
            )
            
            avg_cpu = sum(d['Average'] for d in metrics['Datapoints']) / len(metrics['Datapoints']) if metrics['Datapoints'] else 0
            
            if avg_cpu < 5:  # Less than 5% average CPU
                idle_instances.append({
                    'instance_id': instance['InstanceId'],
                    'type': instance['InstanceType'],
                    'avg_cpu': avg_cpu
                })
    
    return idle_instances
```

#### Graviton Migration
```hcl
# Migrate to ARM-based Graviton instances for better efficiency
resource "aws_launch_template" "app_graviton" {
  name = "labcorp-app-graviton"
  
  # Graviton2/3 instances are 40% more energy efficient
  instance_type = "c7g.xlarge"  # ARM-based Graviton3
  
  image_id = data.aws_ami.arm64_app.id
  
  # Same performance, lower carbon footprint
  block_device_mappings {
    device_name = "/dev/xvda"
    
    ebs {
      volume_type = "gp3"  # More efficient than gp2
      volume_size = 50
      iops        = 3000
    }
  }
}
```

---

## Implementation Checklist

### Operational Excellence
- [ ] All infrastructure defined as code
- [ ] CI/CD pipelines for all deployments
- [ ] Runbooks for common operational tasks
- [ ] Automated backup and restore procedures
- [ ] Regular game days to test procedures

### Security
- [ ] All IAM roles follow least privilege
- [ ] MFA enabled for all users
- [ ] Security groups deny by default
- [ ] All data encrypted at rest and in transit
- [ ] CloudTrail enabled in all regions
- [ ] GuardDuty enabled
- [ ] Security Hub enabled

### Reliability
- [ ] Multi-AZ deployment for critical services
- [ ] Automated backups configured
- [ ] Disaster recovery plan tested quarterly
- [ ] Auto-scaling configured
- [ ] Health checks for all services
- [ ] Chaos engineering experiments run monthly

### Performance Efficiency
- [ ] CloudWatch metrics and alarms configured
- [ ] Application instrumented with X-Ray
- [ ] Caching implemented where appropriate
- [ ] CDN used for static content
- [ ] Database queries optimized
- [ ] Regular load testing performed

### Cost Optimization
- [ ] All resources tagged for cost allocation
- [ ] Cost anomaly detection alerts configured
- [ ] Rightsizing recommendations reviewed monthly
- [ ] Reserved capacity analyzed quarterly
- [ ] Unused resources terminated weekly
- [ ] Cost optimization report to stakeholders

### Sustainability
- [ ] Graviton instances used where possible
- [ ] Idle resources identified and terminated
- [ ] Auto-scaling maximizes resource utilization
- [ ] Managed services preferred over self-managed
- [ ] Data retention policies minimize storage
- [ ] Efficient algorithms and code patterns used

---

## See also

- `labcorp-terraform-module-hierarchy.md` — implement production infra with TFCOM/TFMOD/TFDAT
- `labcorp-terraform-worked-example.md` — catalog-aligned example
- `labcorp-aws-account-structure.md` — accounts, regions, tagging
