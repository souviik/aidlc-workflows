# Labcorp Terraform Remote State

Remote state conventions for **aidlc-aws-platform-agent**. Extends Tier 1 framework knowledge and `labcorp-agentcore-safety-standards.md` (S3 + DynamoDB requirement). Tier 2 wins for Labcorp delivery.

## Standard backend

All application infrastructure repos MUST use remote state — never commit `.tfstate` locally.

```hcl
terraform {
  backend "s3" {
    bucket         = "[TBD — org standard state bucket per account]"
    key            = "<app-name>/<environment>/terraform.tfstate"
    region         = "[TBD — primary region, e.g. us-east-1]"
    dynamodb_table = "[TBD — org lock table name]"
    encrypt        = true
  }
}
```

MUST NOT commit local state files. MUST enable encryption at rest on the state bucket.

## State key conventions

| Pattern | Example |
|---------|---------|
| Application infra | `myapp/dev/terraform.tfstate` |
| Per-concern repo | `myapp-storage/prod/terraform.tfstate` |
| Catalog module CI | Managed by IaC test framework — not app team state |

Align `key` with environment folder names in `labcorp-application-tf-layout.md`:

| Folder | State key segment |
|--------|-------------------|
| `Development/` | `.../dev/...` |
| `QA/` | `.../qa/...` |
| `Stage/` | `.../stage/...` |
| `Production/` | `.../prod/...` |

## Account separation

State buckets live in the **same AWS account** as the resources being managed for that environment, unless platform team documents a centralized state account `[TBD — Platform/EA]`.

Cross-account deploys use UCD with role assumption — state stays in the target account.

## Who provisions the backend

| Responsibility | Owner |
|----------------|-------|
| State bucket + DynamoDB lock table | Platform / cloud foundation team `[TBD]` |
| State key path for new application | Application team (document in repo README) |
| Backend block in `terraform/<Env>/` | Application team |

New applications request a state key prefix from platform before first `terraform init`.

## Local development

Use **TFiTOOL** for local `plan`, `fmt`, and `validate` — https://git.labcorp.com/projects/TFiTOOL

Do not run `terraform apply` locally against shared environments without team approval.

## See also

- `labcorp-aws-account-structure.md` — account and region layout
- `labcorp-application-tf-layout.md` — environment folders
- `aidlc-devsecops-agent/labcorp-agentcore-safety-standards.md` — state security requirements
- `aidlc-pipeline-deploy-agent/labcorp-ucd-deploy-flow.md` — deploy applies state changes via UCD
