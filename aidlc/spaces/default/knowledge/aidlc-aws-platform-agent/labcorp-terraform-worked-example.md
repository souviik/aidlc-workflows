# Labcorp Terraform Worked Example

End-to-end catalog-aligned example for **aidlc-aws-platform-agent**. Shows TFDAT → TFMOD → TFCOM composition in a standard `tf-aws-*-infrastructure` repo. Pin versions from [Module Catalog](https://confluence.labcorp.com/display/TER/Catalog) — versions below are illustrative.

## Scenario

Event-driven Lambda: S3 upload triggers Lambda, writes to target bucket. Application code deployed separately via UCD (`ignore_source_code_changes = true`).

## Repository layout

```text
tf-aws-myapp-application-infrastructure/
  Jenkinsfile
  terraform/
    Development/
      main.tf
      variables.tf
      backend.tf
    tf-modules/
      s3-event-lambda/
        main.tf
        variables.tf
        outputs.tf
```

## Environment `main.tf` (Layer 4)

```hcl
module "s3_event_lambda" {
  source          = "../tf-modules/s3-event-lambda"
  env             = var.environment
  region          = var.region
  labels          = var.labels
  lambda_zip_path = var.lambda_zip_path
}
```

## Feature module `tf-modules/s3-event-lambda/main.tf` (Layer 3)

```hcl
locals {
  name = "myapp-ingest-${var.env}"
}

module "tags" {
  source = "git::https://git.labcorp.com/scm/TFDAT/tags.git"
  name   = local.name
  tags = {
    Application = "myapp"
    Environment = var.env
    ManagedBy   = "Terraform"
  }
}

module "vpc_data" {
  source = "git::https://git.labcorp.com/scm/TFDAT/vpc.git?ref=release/<version>"
  labels = var.labels
  region = var.region
}

module "source_bucket" {
  source = "git::https://git.labcorp.com/scm/TFCOM/s3.git?ref=release/130.12.0"
  labels = var.labels
  name   = "${local.name}-source"
  tags   = module.tags.tags
}

module "target_bucket" {
  source = "git::https://git.labcorp.com/scm/TFCOM/s3.git?ref=release/130.12.0"
  labels = var.labels
  name   = "${local.name}-target"
  tags   = module.tags.tags
}

module "ingest_lambda" {
  source = "git::https://git.labcorp.com/scm/tfmod/lambda-default-with-cloudwatch.git?ref=release/130.19.0"

  labels              = var.labels
  function_name       = local.name
  lambda_zip_path     = var.lambda_zip_path
  package_type        = "Zip"
  ignore_source_code_changes = true  # UCD deploys application artifact

  vpc_subnet_ids         = module.vpc_data.private_subnet_ids
  vpc_security_group_ids = [module.vpc_data.default_security_group_id]

  tags = module.tags.tags
}

# App-specific S3 trigger permission — no TFCOM module; justified custom resource
resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = module.ingest_lambda.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = module.source_bucket.bucket_arn
}
```

## Outputs

```hcl
output "source_bucket_name" {
  value = module.source_bucket.bucket_name
}

output "lambda_function_name" {
  value = module.ingest_lambda.function_name
}
```

## What each layer does

| Layer | This example |
|-------|--------------|
| TFDAT | `tags`, `vpc` data lookups |
| TFCOM | `s3` buckets |
| TFMOD | `lambda-default-with-cloudwatch` |
| Custom | `aws_lambda_permission` for S3 event wiring |

## Pipeline and deploy

- **CI:** Jenkins declarative + `ucdgoals.createVersionWithArtifact` — see `aidlc-pipeline-deploy-agent/labcorp-jenkins-patterns.md`
- **CD:** UCD promotes to `Development` → `QA` → `Stage` → `Production` — see `labcorp-ucd-deploy-flow.md`
- **State:** S3 backend per `labcorp-terraform-remote-state.md`

## See also

- `labcorp-terraform-module-hierarchy.md` — catalog tiers
- `labcorp-module-selection-decision-tree.md` — why TFMOD for Lambda bundle
- `labcorp-module-source-and-versioning.md` — pinning rules
- `labcorp-application-tf-layout.md` — full repo layout
