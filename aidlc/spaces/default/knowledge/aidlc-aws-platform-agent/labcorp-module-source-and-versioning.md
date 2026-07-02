# Labcorp Module Source and Versioning

Labcorp-specific Terraform source and versioning rules for **aidlc-aws-platform-agent**. Extends Tier 1 framework knowledge; Tier 2 wins for Labcorp delivery.

## Module source authority

| Catalog type | Source | When |
|--------------|--------|------|
| TFCOM / TFMOD / TFDAT | Bitbucket git (`git::https://git.labcorp.com/scm/...`) with pinned `ref=release/...` | Standard AWS application infrastructure |
| AgentCore / specialized modules | Nexus internal registry | Per `labcorp-agentcore-safety-standards.md` |

Do not substitute public Terraform Registry modules for Labcorp catalog modules. Do not mix source types for the same logical module.

## Source URL format

All catalog modules MUST use Bitbucket git sources with pinned release refs:

```hcl
source = "git::https://git.labcorp.com/scm/TFCOM/s3.git?ref=release/130.12.0"
```

```hcl
source = "git::https://git.labcorp.com/scm/tfmod/lambda-default-with-cloudwatch.git?ref=release/130.19.0"
```

```hcl
source = "git::https://git.labcorp.com/scm/TFDAT/tags.git"
```

Note: Project paths may appear as `TFCOM`, `tfcom`, or `TFMOD`, `tfmod` — match the exact URL from Module Catalog or peer modules.

## Versioning rules

1. **Pin every catalog module** with `?ref=release/<version>`
2. **Check Confluence catalog** for current release before upgrading
3. **Align versions** across related modules in the same application feature
4. **Match provider constraints** in `required_versions.tf` when upgrading modules

## required_versions.tf template

```hcl
terraform {
  required_version = ">= 1.13.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.0.0, < 7.0.0"
    }
  }
}
```

## labels variable

Required on most TFCOM modules:

- Combines application/repo identity with UCD environment
- Maximum length: **32 characters**
- Example: `myapp-dev`

## Tags

Use TFDAT tags module; merge application tags with standard keys:

```hcl
locals {
  mytags = merge(var.tags, {
    Name      = local.name
    ManagedBy = "Terraform"
  })
}

module "tags" {
  source = "git::https://git.labcorp.com/scm/TFDAT/tags.git"
  name   = local.name
  tags   = local.mytags
}
```

## Local module sources

App feature modules use relative paths from environment folders:

```hcl
source = "../tf-modules/my-feature"
```

Never publish app `tf-modules/` to git.labcorp.com as TFCOM modules without IaC team review.

## Provider 6.x compatibility

When upgrading modules, verify AWS provider 6.x compatibility. Module release notes may state provider 6 requirement (see TFCOM `docs/releasenotes.md`).

## Outputs

When wrapping catalog modules, use module outputs — do not duplicate attribute lookups:

```hcl
# Good
function_name = module.my_lambda.lambda_name

# Avoid
function_name = aws_lambda_function.this.function_name  # when module owns the resource
```

## See also

- `labcorp-terraform-module-hierarchy.md` — catalog tiers (TFDAT, TFMOD, TFCOM)
- `labcorp-module-selection-decision-tree.md` — selection flow
- `labcorp-terraform-remote-state.md` — backend configuration
- `aidlc-devsecops-agent/labcorp-agentcore-safety-standards.md` — Nexus modules for AgentCore workloads
