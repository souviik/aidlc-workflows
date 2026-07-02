# Labcorp UCD Deploy Flow

Labcorp-specific UrbanCode Deploy patterns for **aidlc-pipeline-deploy-agent**. Extends Tier 1 framework knowledge (generic deployment strategies). Tier 2 wins for Labcorp UCD delivery.

## Role of UCD

UrbanCode Deploy (UCD) is the standard promotion path from built artifacts to AWS environments.

**Dashboard:** https://ucd.labcorp.com/#dashboard

Application infrastructure READMEs state Terraform is **used during deployment through UCD**.

## High-level flow

```text
1. Developer merges to Bitbucket
2. Jenkins builds and tests (pattern per repo type)
3. Jenkins calls ucdgoals.createVersionWithArtifact(...)
4. UCD creates component version with Terraform artifacts
5. UCD deploys to target environment (Dev, QA, Stage, Production)
6. AWS resources created/updated per Terraform in that environment
```

## Jenkins to UCD handoff

From application infrastructure Jenkins pipelines:

```groovy
ucdgoals.createVersionWithArtifact(
  "${env.UCD_COMPONENT_NAME}",
  "${env.UCD_ARTIFACTS_TO_UPLOAD_BASE_DIRECTORY}",
  "${env.UCD_ARTIFACTS_TO_UPLOAD_INCLUDE_FILE_PATTERN}"
)
```

**Parameters:**

| Parameter | Meaning |
|-----------|---------|
| `UCD_COMPONENT_NAME` | UCD component receiving the version |
| `UCD_ARTIFACTS_TO_UPLOAD_BASE_DIRECTORY` | Root directory of Terraform artifacts to package |
| `UCD_ARTIFACTS_TO_UPLOAD_INCLUDE_FILE_PATTERN` | File glob for included artifacts |

Values are supplied via Jenkins environment configuration — document required vars, do not invent component names.

## Environment model

Terraform repos use per-environment folders:

- `terraform/Development/`
- `terraform/QA/`
- `terraform/Stage/`
- `terraform/Production/`

UCD environment names align with `labels` and resource naming (`${var.env}` suffix).

| Terraform folder | UCD environment | Typical `var.env` |
|------------------|-----------------|-------------------|
| `terraform/Development/` | Development | `dev` |
| `terraform/QA/` | QA | `qa` |
| `terraform/Stage/` | Stage | `stage` |
| `terraform/Production/` | Production | `prod` |

See `aidlc-aws-platform-agent/labcorp-application-tf-layout.md` for full mapping.

## UCD tokens in Terraform

Modules and Datadog configs may reference UCD substitution tokens:

- `@UCD_APP@`
- `@UCD_ENV@`
- `@UCD_SNAPSHOT@`

Example use: Datadog `DD_ENV`, `DD_SERVICE`, `DD_VERSION` on Lambda environments.

## Infrastructure vs application code

**Terraform-managed:** Buckets, IAM, Lambda infrastructure, EventBridge, etc.

**UCD/CI-CD-managed (optional):** Lambda zip/image code when `ignore_source_code_changes = true`

```hcl
variable "ignore_source_code_changes" {
  description = "When true, Terraform will not track Lambda source code changes. Use when code is managed externally via UCD/CI-CD."
  type        = bool
  default     = false
}
```

Platform agent designs infra; pipeline agent documents which artifacts UCD deploys per component.

## ECS task definitions

ECS modules may expect task definitions maintained by DevOps:

- `taskdef_path` = `./dist/<UCD component>/taskdef.json`
- Task definition sourced from application repo terraform/dist folder

Coordinate application repo build output with infra module inputs.

## Rollback

- UCD snapshot-based rollback is the primary mechanism
- Every deployment should identify the UCD snapshot/version to roll back to
- Do not assume blue/green or canary unless documented for that application type

## Local pre-deploy validation

Before Jenkins/UCD:

- Use **TFiTOOL** for local `terraform plan`, `fmt`, `validate`
- Project: https://git.labcorp.com/projects/TFiTOOL

## AI-DLC constraint

Knowledge and design only — do not execute live UCD deployments or AWS applies from AI-DLC sessions without explicit human approval and existing team runbooks.

## Deployment execution checklist

When documenting deployment for a new feature:

1. UCD component name and application mapping
2. Which repo Jenkins job publishes artifacts
3. Per-environment Terraform directory used
4. Smoke test or health check after deploy
5. Rollback procedure (UCD snapshot ID or version)
6. Separation of infra deploy vs application artifact deploy

## See also

- `labcorp-jenkins-patterns.md` — Jenkins patterns that feed UCD
- `aidlc-aws-platform-agent/labcorp-application-tf-layout.md` — environment folders UCD deploys
- `aidlc-aws-platform-agent/labcorp-module-source-and-versioning.md` — `labels` and UCD env alignment
