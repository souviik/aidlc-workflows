# QA Release Coordination

> **Audience:** Pipeline & Deploy agent and release engineers.
> **Owner document:** `aidlc-quality-agent/labcorp-release-process-template.md` — QA owns release timeline, gap analysis, regression, sign-off, and smoke validation.

The quality agent maintains the living release process at `<record>/quality/release-process.md` (seeded at Stage **2.8**). This page defines what **pipeline-deploy** owns vs what QA owns at deploy time.

## Division of responsibility

| Concern                             | Owner                                                                                         | AI-DLC stage |
|-------------------------------------|-----------------------------------------------------------------------------------------------|--------------|
| Release timeline & checklist        | QA                                                                                            | 2.8 → 4.3 |
| RTM, regression, UAT coordination   | QA                                                                                            | 3.6 → 4.3 |
| Release branch / snapshot creation  | Dev provides components/versions; **QA creates snapshots** and `release#` automation branches | Pre-regression |
| Jenkins regression execution        | QA (branch + trigger); DevOps maintains pipeline                                              | 3.6 |
| Release qualification handoff       | **QA** → Release Manager → ServiceNow ITCentral CHG                                           | Post-regression |
| Security scan gate (e.g., Veracode) | DevSecOps / CI                                                                                | 3.7 |
| CD pipeline, promotion, rollback    | **Pipeline-deploy**                                                                           | 4.1 |
| Environment provisioning            | AWS platform                                                                                  | 4.2 |
| Deploy execution, deployment log    | **Pipeline-deploy**                                                                           | 4.3 |
| Post-deploy smoke tests             | QA (execute); pipeline-deploy (trigger/wire in CD)                                            | 4.3 |

## What pipeline-deploy contributes

When leading Stages **4.1–4.3**, align `cd-config.md` and `deployment-strategy.md` with the QA release checklist (§2.4 in release process template):

- Post-deploy smoke test hook in CD (fail promotion on smoke failure when configured)
- Release version / build number tagging matching QA regression entry criteria
- **`release#` branch** naming convention in Jenkins jobs (coordinate with QA)
- Artifact retention long enough for QA to download reports before CI cleanup
- Rollback runbook referenced in QA downtime planning (§2.3.6)

Load `<record>/quality/release-process.md` and `<record>/quality/release-qualification.md` when configuring deployment pipelines if they exist.

## Cross-references

- `aidlc-quality-agent/labcorp-release-process-template.md` — full QA release process
- `aidlc-quality-agent/labcorp-release-qualification-record.md` — per-release component/snapshot/regression/CHG handoff
- `aidlc-quality-agent/labcorp-test-plan-template.md` — smoke testing detail (§9)
- `cicd-patterns.md` — CI/CD stage ordering and gates
- `deployment-strategies.md` — blue-green, canary, rolling
