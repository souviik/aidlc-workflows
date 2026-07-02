# Labcorp AWS Account Structure

Account, region, and network context for **aidlc-aws-platform-agent**. Extends Tier 1 Well-Architected guidance with Labcorp landing-zone conventions. Replace `[TBD — Platform/EA]` placeholders with values from your platform team.

## Account layout

| Environment | Typical AWS account | Purpose |
|-------------|---------------------|---------|
| Development | `[TBD — dev account ID]` | Integration testing, developer experimentation |
| QA | `[TBD — qa account ID]` | QA validation, automated test environments |
| Stage | `[TBD — stage account ID]` | Pre-production parity testing |
| Production | `[TBD — prod account ID]` | Live workloads |

Align with UCD environments in `aidlc-pipeline-deploy-agent/labcorp-ucd-deploy-flow.md` and Terraform folders in `labcorp-application-tf-layout.md`.

## Approved regions

| Region | Status | Notes |
|--------|--------|-------|
| `us-east-1` | Preferred | `[TBD — org default]` |
| `us-west-2` | Approved | DR / secondary `[TBD]` |
| Other | Exception | Architecture Board approval required |

Enable services in the target region before infrastructure design. Confirm Bedrock and other service availability per region for AI workloads.

## VPC and subnet access

Application teams do **not** create org VPCs in application repos. Use **TFDAT** data modules for lookups:

```hcl
module "vpc_data" {
  source = "git::https://git.labcorp.com/scm/TFDAT/vpc.git?ref=release/<version>"
  labels = var.labels
  region = var.region
}
```

Verify exact TFDAT module names in [Module Catalog](https://confluence.labcorp.com/display/TER/Catalog).

**Typical pattern:**

- Deploy compute (Lambda, ECS) in **private subnets**
- ALB/API Gateway endpoints in **public** or **edge** subnets per security review
- Security groups via TFCOM `security_group` module

## IAM and permission boundaries

- Application IAM roles: least privilege; compose via TFCOM `iam` where possible
- Cross-account access: via UCD-deployed roles — document trust policies in feature modules
- PHI workloads: follow `aidlc-compliance-agent/labcorp-hipaa-technical-safeguards.md` and `aidlc-devsecops-agent/labcorp-security-standards.md`

## Cost allocation tags

Required on all resources (via TFDAT `tags` module):

| Tag | Example | Required |
|-----|---------|----------|
| `Environment` | `dev`, `prod` | Yes |
| `Application` | `myapp` | Yes |
| `Owner` | team email or DL | Yes |
| `CostCenter` | `CC-12345` | Yes |
| `ManagedBy` | `Terraform` | Yes |
| `DataClassification` | `PHI`, `Internal` | When applicable |

## Service limits and quotas

Before proposing new high-volume resources (Lambda concurrency, DynamoDB RCU, API Gateway TPS), check:

- AWS Service Quotas console in target account
- Org-approved service catalog `[TBD — Confluence link]`

Document quota increase requests in infrastructure design artifacts when NFRs exceed defaults.

## See also

- `labcorp-terraform-module-hierarchy.md` — TFDAT for VPC/tags
- `labcorp-terraform-remote-state.md` — per-account state buckets
- `labcorp-aws-well-architected-pillars.md` — pillar validation
- `labcorp-module-source-and-versioning.md` — `labels` variable (32 char max)
