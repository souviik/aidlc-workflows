# Labcorp Terraform Module Hierarchy

Labcorp-specific catalog selection order for **aidlc-aws-platform-agent**. Extends Tier 1 framework knowledge in `.claude/knowledge/aidlc-aws-platform-agent/` (generic infrastructure guide and Well-Architected). When guidance conflicts, this Tier 2 content wins for Labcorp delivery.

## Labcorp IaC standard

Labcorp standard IaC for AWS application infrastructure is **Terraform** with **TFCOM / TFMOD / TFDAT** catalog modules. **CDK** and **CloudFormation** require Architecture Board exception. Tier 1 framework examples that default to CDK do not apply to Labcorp Terraform delivery.

## Selection order

Always search catalog modules before writing raw `aws_*` resources.

```text
1. TFDAT   — data lookups (tags, VPC, subnets)
2. TFMOD   — pattern modules (bundled designs)
3. TFCOM   — component modules (single AWS resources)
4. Custom  — direct aws_* only when no catalog module exists
```

## TFDAT — data modules

**Purpose:** Standard data lookups and tagging consumed by all modules — not deployable resources.

**Bitbucket:** https://git.labcorp.com/projects/TFDAT

| Module | Use for |
|--------|---------|
| `tags` | Standard resource tags (`Name`, `ManagedBy`, cost allocation) |
| `vpc` | VPC and subnet lookups by environment/labels `[TBD — confirm catalog name]` |
| `subnets` | Private/public subnet selection for AZ placement `[TBD — confirm catalog name]` |

Check [Module Catalog](https://confluence.labcorp.com/display/TER/Catalog) for current TFDAT module names and releases.

**Tags example:**

```hcl
module "tags" {
  source = "git::https://git.labcorp.com/scm/TFDAT/tags.git"
  name   = local.name
  tags   = local.mytags
}
```

**VPC data example (pattern — verify module name in catalog):**

```hcl
module "vpc_data" {
  source = "git::https://git.labcorp.com/scm/TFDAT/vpc.git?ref=release/<version>"
  labels = var.labels
  region = var.region
}
```

See `labcorp-aws-account-structure.md` for account and VPC context.

## TFCOM — component modules

**Purpose:** One AWS building block per module repo.

**Bitbucket:** https://git.labcorp.com/projects/TFCOM

**Examples:**

| Module | Use for |
|--------|---------|
| `s3` | S3 buckets with standard encryption and ownership |
| `kms` | Customer-managed KMS keys |
| `iam` | IAM roles and policies |
| `lambda_default` | Lambda with standard patterns |
| `eventbridge` | EventBridge buses and rules |
| `sns` | SNS topics |
| `ecsservice` | ECS service resources |
| `security_group` | Security groups |

**Reference implementations:** TFCOM repos on Bitbucket.

## TFMOD — pattern modules

**Purpose:** Compose multiple TFCOM modules into a reusable design.

**Bitbucket:** https://git.labcorp.com/projects/TFMOD

**Common patterns:**

| TFMOD module | Use for |
|--------------|---------|
| `lambda-default-with-cloudwatch` | Lambda + IAM + CloudWatch logs/alarms |
| `cloudwatch-alarm` | Standard CloudWatch alarms |
| `ecs-with-cluster` | Full ECS cluster + service pattern |

**Prefer TFMOD** when the use case matches an existing pattern module in the catalog.

## Custom resources

Use direct `aws_*` resources only when:

- No TFCOM or TFMOD module covers the use case
- Schema or permissions are highly application-specific

**Example:** Glue database/table and Athena workgroup with custom schema — often no catalog module; use custom resources in `tf-aws-database-infrastructure`.

## Cross-repo feature pattern

A single application feature may span multiple infra repos:

| Repo concern | Typical catalog usage |
|--------------|----------------------|
| Application | TFMOD `lambda-default-with-cloudwatch` |
| Storage | TFCOM `s3` |
| Database | Custom Glue/Athena resources |

Coordinate naming and outputs across repos when a feature is split this way.

## See also

- `labcorp-module-selection-decision-tree.md` — when to pick TFMOD vs TFCOM vs custom
- `labcorp-module-source-and-versioning.md` — Bitbucket URLs, pinned refs, Nexus exception
- `labcorp-application-tf-layout.md` — repo layout and environment folders
- `labcorp-terraform-remote-state.md` — S3 backend and state key conventions
- `labcorp-terraform-worked-example.md` — end-to-end feature module example
- `labcorp-aws-well-architected-pillars.md` — pillar validation (use catalog modules in production)
