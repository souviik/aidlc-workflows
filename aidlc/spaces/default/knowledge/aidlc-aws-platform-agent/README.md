# AWS Platform Agent Knowledge

Markdown files in this directory customize `aidlc-aws-platform-agent` behavior for Labcorp projects.

Files here are loaded at step 8 of the knowledge loading order (per-agent `labcorp-*.md` layer), after framework methodology.

## Reading order

1. [labcorp-terraform-module-hierarchy.md](labcorp-terraform-module-hierarchy.md) — IaC standard; TFDAT → TFMOD → TFCOM → custom
2. [labcorp-module-selection-decision-tree.md](labcorp-module-selection-decision-tree.md) — when to pick TFMOD vs TFCOM vs custom
3. [labcorp-module-source-and-versioning.md](labcorp-module-source-and-versioning.md) — Bitbucket URLs, pinned refs, Nexus exception
4. [labcorp-application-tf-layout.md](labcorp-application-tf-layout.md) — standard `tf-aws-*-infrastructure` repo layout
5. [labcorp-terraform-remote-state.md](labcorp-terraform-remote-state.md) — S3 backend and state key conventions
6. [labcorp-aws-account-structure.md](labcorp-aws-account-structure.md) — accounts, regions, VPC, tagging
7. [labcorp-terraform-worked-example.md](labcorp-terraform-worked-example.md) — end-to-end catalog-aligned feature module
8. [labcorp-aws-well-architected-pillars.md](labcorp-aws-well-architected-pillars.md) — Well-Architected implementation guide (use catalog modules in production)

## Files in this directory

| File | Content |
|------|---------|
| `labcorp-terraform-module-hierarchy.md` | Catalog tiers and selection order |
| `labcorp-module-selection-decision-tree.md` | Decision flow |
| `labcorp-module-source-and-versioning.md` | Source URLs and versioning |
| `labcorp-application-tf-layout.md` | Repo layout and environment folders |
| `labcorp-terraform-remote-state.md` | Remote state backend |
| `labcorp-aws-account-structure.md` | Account and network context |
| `labcorp-terraform-worked-example.md` | Worked Lambda + S3 example |
| `labcorp-aws-well-architected-pillars.md` | Six pillars reference |

## Related

| Topic | File |
|-------|------|
| Jenkins CI for infra repos | [`../aidlc-pipeline-deploy-agent/labcorp-jenkins-patterns.md`](../aidlc-pipeline-deploy-agent/labcorp-jenkins-patterns.md) |
| UCD deploy flow | [`../aidlc-pipeline-deploy-agent/labcorp-ucd-deploy-flow.md`](../aidlc-pipeline-deploy-agent/labcorp-ucd-deploy-flow.md) |
| AgentCore module source (Nexus) | [`../aidlc-devsecops-agent/labcorp-agentcore-safety-standards.md`](../aidlc-devsecops-agent/labcorp-agentcore-safety-standards.md) |
| HIPAA / security | [`../aidlc-compliance-agent/labcorp-hipaa-technical-safeguards.md`](../aidlc-compliance-agent/labcorp-hipaa-technical-safeguards.md) |

**Tier 1 companions** (framework built-ins): `infrastructure-guide.md`, `cdk-best-practices.md`, `cost-optimization-patterns.md`, `well-architected-framework.md`
