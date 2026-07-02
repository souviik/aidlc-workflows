# Labcorp Module Selection Decision Tree

Labcorp-specific module selection for **aidlc-aws-platform-agent**. Extends Tier 1 framework knowledge; Tier 2 wins for Labcorp Terraform delivery.

For catalog reference tables (module names, Bitbucket projects), see `labcorp-terraform-module-hierarchy.md`.

## Quick decision

```text
Need AWS capability?
|
+-- Need standard tags or VPC/subnet data?
|     -> TFDAT module (tags, vpc, subnets — see hierarchy doc)
|
+-- Pattern exists in TFMOD catalog?
|     YES -> Use TFMOD (pin release version)
|     NO  -> continue
|
+-- Single resource in TFCOM catalog?
|     YES -> Use TFCOM (pin release version)
|     NO  -> continue
|
+-- Document justification -> custom aws_* in tf-modules/<feature>/
```

## TFMOD vs TFCOM

| Choose TFMOD when | Choose TFCOM when |
|-------------------|-------------------|
| Need Lambda + logs + alarms bundle | Need only an S3 bucket |
| Need full ECS cluster pattern | Need only a security group |
| Team standard pattern exists in TFMOD catalog | Composing your own wiring in tf-modules |

## When custom resources are acceptable

- Glue catalog tables with application-specific schema
- Athena workgroups with custom IAM
- One-off integration resources not yet in TFCOM

Always add a comment in `main.tf` explaining why no catalog module was used.

## Anti-patterns

- Unpinned module source (`ref=master` or no `ref`)
- Duplicating TFCOM logic with raw `aws_s3_bucket` when `TFCOM/s3` applies
- Using different TFMOD Lambda release versions within the same application suite without reason
- Putting environment-specific values hardcoded in `tf-modules/` instead of variables

## Before proposing net-new TFCOM module

1. Search [Module Catalog](https://confluence.labcorp.com/display/TER/Catalog)
2. Search TFMOD for pattern modules
3. Check peer application `tf-modules/` on Bitbucket for copyable patterns
4. Escalate to IaC Terraform team only if gap is genuine

## See also

- `labcorp-terraform-module-hierarchy.md` — full catalog reference
- `labcorp-module-source-and-versioning.md` — pinning and source URLs
- `labcorp-terraform-worked-example.md` — applied example
