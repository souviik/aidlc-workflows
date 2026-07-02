# Labcorp Application Terraform Layout

Standard repo layout for team-owned application infrastructure at Labcorp. Extends Tier 1 framework knowledge for **aidlc-aws-platform-agent**.

## Standard layout for application teams

```text
tf-aws-<concern>-infrastructure/
  README.md
  Jenkinsfile
  terraform/
    Development/
      main.tf
      variables.tf
      terraform.tfvars
    QA/
    Stage/
    Production/
    tf-modules/
      <feature-a>/
        main.tf
        variables.tf
        outputs.tf
      <feature-b>/
```

## Layer model

```text
Layer 4  terraform/<Environment>/main.tf
           |
           |  module "my-feature" { source = "../tf-modules/my-feature" }
           v
Layer 3  terraform/tf-modules/<feature>/
           |  locals, data sources, custom IAM, wiring
           v
Layer 2  TFMOD pattern modules
           v
Layer 1  TFCOM components + TFDAT tags
```

## Environment main.tf responsibilities

- Instantiate app feature modules only
- Pass `env`, `region`, and feature-specific variables
- Use `depends_on` for ordering when required
- Keep environment files thin — no raw `aws_*` unless unavoidable

**Example pattern:**

```hcl
module "my-lambda-feature" {
  source             = "../tf-modules/my-lambda-feature"
  env                = var.environment
  region             = var.region
  lambda_zip_path    = var.my_lambda_zip_path
  source_bucket_name = local.source_bucket_name
  target_bucket_name = local.target_bucket_name
}
```

## Feature module responsibilities

Each `tf-modules/<feature>/` module should:

1. Define `locals` and `data` sources (VPC, KMS, secrets, caller identity)
2. Call `module "tags"` from TFDAT
3. Compose TFMOD/TFCOM modules with pinned `ref=release/...`
4. Add custom `aws_iam_policy_document` only for app-specific permissions
5. Export outputs needed by other feature modules or environments

## Splitting concerns across repos

Split when lifecycle, ownership, or blast radius differ:

| Repo | Owns |
|------|------|
| `tf-aws-application-infrastructure` | Compute, events, integrations |
| `tf-aws-storage-infrastructure` | Buckets, KMS for storage, SNS alerts |
| `tf-aws-database-infrastructure` | Databases, Glue, Athena |

Coordinate bucket names, ARNs, and env suffixes across repos using consistent `local` naming: `"<resource-name>-${var.env}"`.

## Application code boundary

- Application code lives in a **separate repo** from infrastructure
- Infra module receives `lambda_zip_path` or `image_uri` as variables
- For container Lambdas, use `package_type = "Image"`; for zip deployments, `package_type = "Zip"`

Do not embed application business logic inside Terraform files.

## Environment folder mapping

| Terraform folder | Typical `var.environment` / `var.env` | UCD environment | `labels` example |
|------------------|--------------------------------------|-----------------|------------------|
| `Development/` | `dev` | Development | `myapp-dev` |
| `QA/` | `qa` | QA | `myapp-qa` |
| `Stage/` | `stage` | Stage | `myapp-stage` |
| `Production/` | `prod` | Production | `myapp-prod` |

`labels` must stay within **32 characters** (TFCOM module constraint). Align folder names, variable values, and UCD environment names across Jenkins, UCD, and Terraform — see `aidlc-pipeline-deploy-agent/labcorp-ucd-deploy-flow.md`.

## See also

- `labcorp-terraform-module-hierarchy.md` — layer model and catalog tiers
- `labcorp-terraform-worked-example.md` — feature module + environment wiring
- `labcorp-terraform-remote-state.md` — per-environment state keys
- `aidlc-pipeline-deploy-agent/labcorp-jenkins-patterns.md` — Jenkinsfile for this repo layout
