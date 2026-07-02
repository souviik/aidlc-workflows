# Pipeline & Deploy Agent Knowledge

Markdown files in this directory customize `aidlc-pipeline-deploy-agent` behavior for Labcorp projects.

Files here are loaded at step 8 of the knowledge loading order (per-agent `labcorp-*.md` layer), after framework methodology.

## Reading order

**Infrastructure deploy (Terraform / UCD):**

1. [labcorp-jenkins-patterns.md](labcorp-jenkins-patterns.md) — TFCOM IaC tests vs application infra UCD upload
2. [labcorp-ucd-deploy-flow.md](labcorp-ucd-deploy-flow.md) — Jenkins → UCD → AWS environment promotion

**Release coordination (Stages 4.1–4.3):**

3. [labcorp-qa-release-coordination.md](labcorp-qa-release-coordination.md) — QA vs pipeline-deploy responsibility split

Application code repo CI/CD: `[TBD — Platform/DevOps]` — confirm before designing non-infra pipelines.

## Files in this directory

### Infrastructure CI/CD

- [labcorp-jenkins-patterns.md](labcorp-jenkins-patterns.md) — `terraform.IaCTests` (catalog modules) vs declarative pipeline + `ucdgoals.createVersionWithArtifact` (app infra)
- [labcorp-ucd-deploy-flow.md](labcorp-ucd-deploy-flow.md) — UCD promotion, environment folders, rollback

### QA / release coordination

- [labcorp-qa-release-coordination.md](labcorp-qa-release-coordination.md) — QA vs pipeline-deploy responsibility split for Stages **4.1–4.3**

When leading Stages **4.1–4.3**:

- **Pipeline-deploy owns:** CD pipeline, promotion, rollback, deploy execution, deployment log
- **QA owns:** Release timeline, regression, sign-off, smoke test execution (coordinate CD hooks with QA)

Load `<record>/quality/release-process.md` and `<record>/quality/release-qualification.md` when configuring deployment pipelines if they exist.

## Related

| Topic | File |
|-------|------|
| Infra repo layout | [`../aidlc-aws-platform-agent/labcorp-application-tf-layout.md`](../aidlc-aws-platform-agent/labcorp-application-tf-layout.md) |
| Full QA release process | [`../aidlc-quality-agent/labcorp-release-process-template.md`](../aidlc-quality-agent/labcorp-release-process-template.md) |
| Per-release qualification / CHG handoff | [`../aidlc-quality-agent/labcorp-release-qualification-record.md`](../aidlc-quality-agent/labcorp-release-qualification-record.md) |
| Smoke testing detail | [`../aidlc-quality-agent/labcorp-test-plan-template.md`](../aidlc-quality-agent/labcorp-test-plan-template.md) (§9) |
| QA stage map | [`../aidlc-quality-agent/labcorp-qa-stage-responsibilities.md`](../aidlc-quality-agent/labcorp-qa-stage-responsibilities.md) |

**Tier 1 companions** (framework built-ins): `cicd-patterns.md`, `deployment-strategies.md`, `branching-strategies.md`
