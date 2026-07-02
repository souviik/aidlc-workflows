# QA Release Process Template

> **Audience:** QA engineers, QA managers, release coordinators, and the quality agent.
> **Lifecycle start:** Stage **2.8 — Delivery Planning**. Seed the living artifact at `<record>/quality/release-process.md` from this template; execute release activities from **3.6 Build and Test** through **4.3 Deployment Execution** and beyond.
> **Companion docs:** `labcorp-test-plan-template.md`, `labcorp-release-qualification-record.md`, `labcorp-qa-stage-responsibilities.md`, `testing-guide.md`
> **Deploy coordination:** Pipeline & Deploy agent owns CD mechanics (Stages 4.1–4.3); this document owns QA criteria, timeline, regression, sign-off, and smoke validation.

Copy this template into `<record>/quality/release-process.md` at Stage 2.8. Replace bracketed placeholders. Remove subsections that do not apply to this release.

---

## AI-DLC lifecycle — when to update each section

| Section | First populated | Updated through |
|---------|-----------------|-----------------|
| Document control + §1 Objective | **2.8** Delivery Planning | Each release cycle |
| §2 Release timeline (planning) | **2.8** | 3.6 (re-baseline dates), 4.1 |
| §2.3 Gap analysis / RTM | 2.8 (plan), **3.6** (execute) | Pre-regression gate |
| §2.3 Environments & resources | 2.8, 4.2 Environment Provisioning | 4.3 |
| §2.4 Release timeline checklist | **2.8** | Track through 4.3 |
| §3 Release activities | **3.6** (entry criteria) | 4.3, 4.6 |
| §3.6–3.7 Regression & qualification | **3.6** (post feature-QA complete) | Pre-stage deploy |
| §3 Exit criteria & sign-off | Pre-release gate | 4.3 |
| §3 Smoke testing & release support | 4.1 Deployment Pipeline | 4.3 Deployment Execution |

At **2.8**, draft the release timeline and checklist using `bolt-plan.md`, `team-allocation.md`, and `<record>/quality/test-plan.md`. Mark execution sections `[TBD — populated at stage X.Y]`.

---

## Document control

| Field | Value |
|-------|-------|
| **Document ID** | [RP-NNN or org control number] |
| **Release / fix version** | [e.g., v1.2.0, MNS-2026-Q2] |
| **Project / Intent** | [From `aidlc-state.md`] |
| **Document Owner** | [QA lead] |
| **Status** | [Draft / Review / Approved / Executing / Complete] |
| **Last Updated** | [YYYY-MM-DD] |

### Revision history

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 1.0 | [YYYY-MM-DD] | [Name] | Initial draft seeded at Stage 2.8 |

---

## 1. Objective

This document lists the criteria used to determine a **release timeline** and the **QA activities** that must be reviewed and executed for every release of **[product / initiative name]**.

It complements `<record>/quality/test-plan.md` (what to test) with **when** and **how QA gates release** (timeline, regression, sign-off, smoke).

---

## 2. Determining release timeline

Release dates may be set by **business** or by the **product development team**. QA evaluates the criteria below, identifies pending work, estimates effort, and provides feedback on a **feasible QA release plan with dates**.

### 2.1 Assumptions

- Estimates assume ideal conditions with minimal buffer unless explicitly noted.
- Any change to scope, build availability, or environment readiness requires **re-evaluation** of the full timeline and dependent milestones.

### 2.2 Ownership

QA members assigned to the product collectively evaluate criteria from a QA perspective and communicate the feasible release plan to product, development, and release management.

| Role | Responsibility |
|------|----------------|
| QA lead | Owns this document, timeline, sign-off |
| QA engineers | Gap analysis, regression, artifacts |
| Product owner / manager | UAT coordination, release scope |
| Development | Code freeze; **provides release component list and versions after QA feature complete** |
| DevOps / pipeline-deploy | Jenkins pipelines, security scan gate, stage/prod deploy support |
| QA manager | Release plan approval |
| Release manager | Release plan, **ServiceNow ITCentral change ticket** (CHG) |

### 2.3 Criteria to be considered

#### 2.3.1 Gap analysis

**Scope coverage**

For each feature in the release, review requirements and design artifacts (`requirements.md`, `stories.md`, mockups / design links) and verify:

- [ ] Release scope item maps to at least one requirement
- [ ] Requirement is covered by at least one test scenario (automated and/or manual)
- [ ] When fully tested, requirement status updated to **Done** in work tracker

**Test coverage**

- [ ] Generate or update **Requirements Traceability Matrix (RTM)** for the release fix version
- [ ] Every requirement line item has at least one associated test scenario
- [ ] RTM stored at `<record>/quality/traceability-matrix.md` (attach export to release artifacts)

#### 2.3.2 Environments

| Environment | Needed for | Readiness owner | Data ready | Notes |
|-------------|------------|-----------------|------------|-------|
| Dev | [Y/N] | | [Y/N/TBD] | |
| QA | [Y/N] | | [Y/N/TBD] | Primary regression target |
| Stage | [Y/N] | | [Y/N/TBD] | UAT / performance |
| Demo | [Y/N] | | [Y/N/TBD] | User demo dry run |
| Production | [Y/N] | | [Y/N/TBD] | Smoke only |

Document effort for environment readiness and test data (see `labcorp-test-plan-template.md` §5).

#### 2.3.3 Levels of testing

Identify all testing levels required for this release. Estimate duration and dependencies for each.

| Level | In release | Owner | Environment | Est. duration | Dependencies |
|-------|------------|-------|-------------|---------------|--------------|
| UAT | [Y/N] | Product / stakeholders | Stage | | User notification, demo |
| Backward compatibility | [Y/N] | QA | QA | | Release plan scope |
| Integration | [Y/N] | QA / [other team] | QA | | Related systems |
| Performance | [Y/N] | QA | Stage | | Stage 4.6 if in scope |
| Release regression | [Y/N] | QA | QA | | Code freeze, release branch |
| Smoke (stage / prod) | [Y/N] | QA | Stage / Prod | | Post-deploy, Stage 4.3 |

For each level marked In scope, document:

- **UAT:** user demo schedule, communication plan
- **Backward compatibility:** scope and test suite reference
- **Performance:** environment availability, resource allocation, cross-team coordination
- **Release regression:** automated vs manual effort, defect triage window, artifact documentation, QA approval step
- **Smoke:** scope, documentation, data/setup (see §3 and `labcorp-test-plan-template.md` §9)

#### 2.3.4 Release build availability

Coordinate with development on build milestones. **LabCorp sequence:** feature QA completes first; development then delivers release components and versions; QA creates snapshots, deploys to QA, and runs release regression.

| Milestone | Definition | Target date | Owner |
|-----------|------------|-------------|-------|
| Dev complete | Feature development finished | | Development |
| QA complete | Feature testing done; defects fixed/triaged | | QA |
| Code freeze | No new feature code after QA complete | | Development |
| Release components provided | Dev publishes component list + version numbers for the release | | Development |
| Release snapshots created | QA (or QA-coordinated) snapshots from provided components | | QA |
| Deploy to QA for regression | Release snapshot deployed to QA environment(s) | | QA |
| Release regression complete | Automated + manual regression passed on qualified build | | QA |

**Regression starts after QA feature complete and code freeze.** Development provides **release components and versions**; QA creates **release snapshots**, deploys to QA, and records qualified versions in `<record>/quality/release-qualification.md` (from `labcorp-release-qualification-record.md`).

Release build / snapshot identifiers must match the release version. QA verifies security scan (e.g., Veracode) completed on release build in Jenkins before regression.

#### 2.3.5 Impact on related products

| Related product / system | Impact | Work required | Communicated to |
|--------------------------|--------|---------------|-----------------|
| [Product / API / integration] | [None / describe] | [Testing / notification] | [Team] |

#### 2.3.6 Downtime

| Window | Expected downtime | User communication | Rollback plan ref |
|--------|-------------------|--------------------|-------------------|
| [Deploy target / date] | [Duration] | [Channel / owner] | `<record>/operation/deployment-pipeline/rollback-runbook.md` |

#### 2.3.7 Resource availability

| Resource | Name / role | Available dates | OOO backup |
|----------|-------------|-----------------|------------|
| QA lead | | | |
| QA engineer(s) | | | |
| Performance tester | | | |
| DevOps deploy | | | |
| Product (UAT) | | | |

### 2.4 Release timeline checklist

Use when planning with the broader product team. Update status as the release progresses.

| # | Milestone | Target date | Actual date | Status | Owner |
|---|-----------|-------------|-------------|--------|-------|
| 1 | Dev complete (all development) | | | [ ] | Dev |
| 2 | QA complete (feature testing + defects triaged + code freeze) | | | [ ] | QA |
| 3 | Dev provides release components and versions | | | [ ] | Dev |
| 4 | QA creates release snapshots | | | [ ] | QA |
| 5 | Deploy release snapshot to QA environment | | | [ ] | QA |
| 6 | Backward compatibility test | | | [ ] | QA |
| 7 | Integration test | | | [ ] | QA |
| 8 | QA regression (`release#` branch, Jenkins) | | | [ ] | QA |
| 9 | Release qualification recorded + handoff to Release Manager | | | [ ] | QA |
| 10 | Performance test | | | [ ] | QA |
| 11 | UAT (may parallel regression) | | | [ ] | Product |
| 12 | Dry run on demo | | | [ ] | Product / QA |
| 13 | Deploy to demo (if applicable) | | | [ ] | DevOps |
| 14 | Dry run on stage | | | [ ] | QA |
| 15 | Deploy to stage | | | [ ] | DevOps |
| 16 | Smoke testing on stage | | | [ ] | QA |
| 17 | Dry run on production | | | [ ] | QA / Release mgmt |
| 18 | Release / deploy to production | | | [ ] | DevOps |
| 19 | Smoke testing on production | | | [ ] | QA |

---

## 3. Release activities

QA performs the activities below **in order** for every release unless noted as parallel.

### Entry criteria — regression phase

All must be satisfied before regression begins:

- [ ] All features, bugs, and defects for the release tested, reviewed, and **passed** (feature QA complete)
- [ ] **Code freeze** in effect
- [ ] Development provides **release component list and version numbers** for the release
- [ ] Development provides release builds for regression **after** security scan (e.g., Veracode) on release build
- [ ] **Build number matches release version**
- [ ] QA verified security scan complete in Jenkins for release build version(s)

### 3.0 Release snapshot and regression setup *(LabCorp)*

After feature QA complete and dev delivers components/versions:

1. **Development** publishes release components and version numbers (see §3.0.1).
2. **QA** creates **release snapshots** from those components.
3. **QA** deploys release snapshot to the QA environment(s) for backward compatibility, integration, and regression.
4. **QA** creates automation branch(es) with **`release#` prefix** matching the release version (e.g., `release2.4.0`) on the test automation repo(s).
5. **Jenkins** executes regression on the release branch(es); download and attach reports (links expire per retention policy).
6. On regression pass, complete `<record>/quality/release-qualification.md` and **hand off to Release Manager** for release plan and ServiceNow ITCentral change ticket (CHG).

#### 3.0.1 Release components from development

Record dev-delivered components when received (full detail in `release-qualification.md`):

| Component | Version | Artifact / build ref | Received date |
|-----------|---------|----------------------|---------------|
| [service / UI / API] | [x.y.z] | [Jenkins build # / snapshot ref] | |

### 3.1 Deploy (QA environments)

| Item | Value |
|------|-------|
| Release version | [Version — must match build #] |
| Release components | See §3.0.1 and `release-qualification.md` |
| Snapshot name(s) | [QA-created snapshot identifier(s)] |
| Target environment(s) | QA — backward compatibility / integration / regression |
| Deploy executor | **QA** (deploy release snapshot to QA per LabCorp practice) |
| Deploy artifact ref | `<record>/operation/deployment-execution/deployment-log.md` |

QA deploys the **QA-created release snapshot** (built from dev-provided component versions) to QA environment(s) for backward compatibility, integration, and regression.

### 3.2 Backward compatibility testing

- **When:** After QA feature complete, per release plan
- **Scope:** [List scenarios / suite reference]
- **Result:** [Pass / fail / link to results]

### 3.3 Integration testing

- **When:** Per release plan
- **Scope:** [Cross-system flows]
- **Owner:** [QA / partner team]
- **Result:** [Pass / fail / link to results]

### 3.4 UAT

- **Timing:** Mostly parallel with regression
- **Deploy:** Release version to stage (release management)
- **Notification:** Product owner / manager notifies UAT participants
- **Environment:** Regress-tested stage build
- **Status tracker:** [Link or `<record>/quality/uat-status.md`]

### 3.5 Performance testing

- **When:** Every release on stage (unless release plan excludes)
- **Reference:** `<record>/operation/performance-validation/` (Stage 4.6)
- **Expected results:** [NFR targets from test plan / NFR requirements]
- **Result:** [Pass / fail / link to `nfr-validation-matrix.md`]

### 3.6 Release regression

| Step | Detail |
|------|--------|
| Automation branch | QA creates branch with **`release#` prefix** + release version (e.g., `release2.4.0`) on test automation repo(s) |
| CI execution | **Jenkins** regression job triggered on release branch(es) |
| Environment | QA environment deployed with QA-created release snapshot (§3.1) |
| Defect handling | Triage, fix, retest; **regression cycle restarts** if fix scope warrants |
| Artifacts | Download Jenkins reports (HTML, Cucumber, living documentation) — do not rely on expiring build links |
| Qualification record | Update `<record>/quality/release-qualification.md` with components, snapshots, branch, Jenkins run, and pass/fail |

### 3.7 Release qualification and change-management handoff

When regression (and parallel UAT / performance, if applicable) passes, QA finalizes **`release-qualification.md`** and sends to **Release Manager**. Release Manager uses this to build the release plan and populate the **LabCorp ServiceNow ITCentral change ticket (CHG)**.

Handoff must include:

- Release version and qualified **component versions**
- **Snapshot name(s)** deployed and regression-tested on QA
- **`release#` automation branch** name(s) and Jenkins run evidence
- QA qualification status (passed / exceptions)
- Link to test artifacts and RTM
- ServiceNow **CHG number** (once created): [CHG########]

Template: `labcorp-release-qualification-record.md` → living artifact `<record>/quality/release-qualification.md`.

### Exit criteria — release QA complete

Release QA is complete when **all** items below are satisfied:

- [ ] Release items list — all **Done**
- [ ] All tests passed OR defects triaged with accepted disposition
- [ ] UAT complete
- [ ] Performance testing complete with expected results (if in scope)
- [ ] Release artifacts documented (see §3.8)
- [ ] **`release-qualification.md` complete and sent to Release Manager**
- [ ] **`confluence-artifact-row.md` auto-generated (§3.1) and row appended to Confluence release test artifacts page**
- [ ] **`qa-release-signoff-email.md` auto-generated from qualification record (§7) and sent to business / engineering / product / project**
- [ ] ServiceNow ITCentral CHG ticket referenced (Release Manager may create from handoff)
- [ ] QA manager approved release plan
- [ ] Change ticket created (if required): [Change #]

### 3.8 Release artifacts

Document in the team's artifact repository (Confluence, `<record>/quality/release-artifacts/`, or equivalent):

| Artifact | Location / attachment |
|----------|----------------------|
| Release items list | [Jira fix version / release board] |
| RTM | Downloaded matrix for this release version |
| Requirements marked Done | Work tracker query / export |
| API test artifacts | [Path / attachment] |
| UI test artifacts | [Path / attachment] |
| Performance test artifacts | [Path / attachment] |
| CI run evidence | Downloaded reports (HTML, Cucumber, living documentation) |
| UAT status | Summary comment or sign-off record |
| Smoke testing status | §3.9 |
| Release qualification record | `<record>/quality/release-qualification.md` |
| QA sign-off email (auto-generated) | `<record>/quality/qa-release-signoff-email.md` — from qualification record §7 |
| Confluence artifact row (auto-generated) | `<record>/quality/confluence-artifact-row.md` — from qualification record §3.1; append to cumulative Confluence registry |
| Change ticket (ServiceNow ITCentral) | CHG [number] — populated by Release Manager from QA handoff |

**Confluence release test artifacts page** is a **cumulative registry** (one row per release). Populate each row from Jenkins regression output via `release-qualification.md` §3.1. Do not create a separate row template file.

**QA sign-off email** is **not** a separate template file. The quality agent generates it from `release-qualification.md` §7 when regression passes. Must include: release items list, test artifacts (Confluence registry page), qualified environment, snapshot(s), and component version tables.

### 3.9 Smoke testing

**Planning and data:** Update smoke scope and personas per `labcorp-test-plan-template.md` §9 before stage/prod deploy.

| Environment | When | Scope ref | Result | Owner |
|-------------|------|-----------|--------|-------|
| Stage | After stage deploy | | [Pass / fail] | QA |
| Production | After prod deploy | | [Pass / fail] | QA |

Results recorded in `<record>/operation/deployment-execution/smoke-test-results.md` (Stage 4.3).

### 3.10 Release QA support

QA remains available during production deploy for:

- Smoke test execution on stage and/or production as applicable
- Defect triage for deploy-window issues
- Rollback validation if triggered (coordinate with pipeline-deploy agent / `rollback-runbook.md`)

---

*Template version: AI-DLC quality-agent knowledge. Seed at Stage 2.8; execute through Operation (4.1–4.3+). Deploy mechanics: see pipeline-deploy-agent `cicd-patterns.md` and `deployment-strategies.md`.*
