# Test Plan Template

> **Audience:** QA engineers, test leads, and the quality agent.
> **Lifecycle start:** Stage **0.3 — State Initialization**. Seed the living artifact at `<record>/quality/test-plan.md` from this template; update sections as upstream artifacts arrive.
> **Companion docs:** `labcorp-qa-stage-responsibilities.md`, `labcorp-release-process-template.md`, `test-strategy-patterns.md`, `testing-guide.md`

Copy this template into `<record>/quality/test-plan.md` at Stage 0.3. Replace bracketed placeholders. Delete optional subsections that do not apply (e.g., AI/ML evaluation, UAT when scope excludes it).

---

## AI-DLC lifecycle — when to update each section

| Section | First populated | Updated through |
|---------|-----------------|-----------------|
| Document control + §2 Introduction | **0.3** State Initialization | 1.7 Approval & Handoff |
| §3 Scope | **0.3** (from scope + test strategy in `aidlc-state.md`) | 1.4 Scope Definition, 2.8 Delivery Planning |
| §4 Test Methodology | 2.2 Practices Discovery | 3.7 CI Pipeline |
| §5 Test Environment & Data | 1.3 Feasibility, 2.4 User Stories | 4.2 Environment Provisioning |
| §6 Test Strategy | **0.3** (test strategy level) | 2.2, 3.2 NFR Requirements, 3.6 Build and Test |
| §7 Test Execution | 2.4 User Stories | 3.6, 4.3 Deployment Execution |
| §8 Features & deliverables | 2.4 User Stories | 3.6 (status), 4.7 Feedback |
| §9 Smoke Testing | 4.1 Deployment Pipeline | 4.3 Deployment Execution |
| §10 Strategy adjustments | Any gate when scope or risk changes | 4.7 Feedback |

At **0.3**, copy scope, depth, test strategy (Minimal / Standard / Comprehensive), and project type (greenfield / brownfield) from `<record>/aidlc-state.md` into §2 and §3. Mark all other sections `[TBD — populated at stage X.Y]`.

---

## Document control

| Field | Value |
|-------|-------|
| **Document ID** | [TP-NNN or org control number] |
| **Project / Intent** | [Project name from state file] |
| **Scope** | [enterprise / feature / mvp / poc / …] |
| **Test Strategy** | [Minimal / Standard / Comprehensive — from `aidlc-state.md`] |
| **Document Owner** | [QA lead name] |
| **Status** | [Draft / Review / Approved / Baseline] |
| **Last Updated** | [YYYY-MM-DD] |

### 1. Revision history

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 1.0 | [YYYY-MM-DD] | [Name] | Initial draft seeded at Stage 0.3 |

---

## 2. Introduction

This document describes the approach and strategy used by the QA team to drive testing and validate quality for **[project / initiative name]** through its **[scope label — e.g., MVP, feature release]**.

**Purpose:** Define what will be tested, how, with what tools and data, and the criteria for entry, exit, and release readiness.

**References:**

| Artifact | Location | Stage |
|----------|----------|-------|
| State file | `<record>/aidlc-state.md` | 0.3 |
| Scope document | `<record>/ideation/scope-definition/scope-document.md` | 1.4 |
| Requirements | `<record>/inception/requirements-analysis/requirements.md` | 2.3 |
| User stories | `<record>/inception/user-stories/stories.md` | 2.4 |
| Testing posture | Space memory `team.md` / `project.md` (affirmed at 2.2) | 2.2 |
| Build & test results | `<record>/construction/build-and-test/` | 3.6 |

---

## 3. Scope

### 3.1 In scope

Mark each subsection **In scope / Out of scope / TBD** for this intent. Delete subsections marked Out of scope.

#### 3.1.1 Feature testing

[Describe functional and UI validation in scope — e.g., happy-path automation for MVP features on target browser(s) and persona(s).]

- **Target personas / profiles:** [List representative test accounts or synthetic users]
- **Browsers / clients:** [e.g., Chrome latest, mobile Safari]
- **Coverage detail:** See §8 — Features in scope and test deliverables

#### 3.1.2 AI / ML evaluation *(optional)*

Include when the product uses LLMs, embeddings, or generative AI.

- **Evaluation focus:** [Semantic accuracy, content safety, hallucination rate, prompt adherence]
- **Features in scope:** [TBD / list features]
- **Approach:** [Automated similarity scoring, human review, red-team prompts]

#### 3.1.3 Backend / API testing

- **Endpoints in scope:** [List or reference OpenAPI / service catalog]
- **Approach:** [Automated contract or service tests, manual exploratory as needed]

#### 3.1.4 User acceptance testing (UAT)

- **Stakeholders:** [Roles / teams performing UAT]
- **Scope:** [Features validated by stakeholders before release]
- **Data:** [Reference test account registry — §5.2.5]

#### 3.1.5 Regression testing

- **Environment:** [QA / staging]
- **Trigger:** [Pre-release, nightly, on merge to main]
- **Automation target:** [% automated vs manual — align with affirmed testing posture]
- **Prerequisites:**
  - [ ] Feature testing complete
  - [ ] Integration testing complete (if in scope)
  - [ ] UAT complete (if in scope)
  - [ ] End-to-end testing complete (if in scope)

#### 3.1.6 Smoke testing

- **Environment:** [Post-deploy target — e.g., staging, production]
- **Trigger:** [After every release / deploy]
- **Detail:** See §9

### 3.2 Out of scope

Document explicitly excluded test types and the owning team if another group validates them.

#### 3.2.1 Integration / end-to-end testing

[Describe cross-system flows excluded from this team's scope and who owns validation — e.g., upstream portal team validates integration with this application.]

#### 3.2.2 Performance testing

[In scope / Out of scope for this release. If deferred, note planned phase and environment — typically Stage 4.6 Performance Validation in Stage environment.]

#### 3.2.3 [Other exclusions]

[Security pen-test, accessibility audit, load testing, etc.]

---

## 4. Test methodology

### 4.1 Overview

[Describe the overall approach — e.g., MVP-focused happy-path automation first, then edge cases; or test-pyramid-first with unit-heavy coverage per `test-strategy-patterns.md`.]

Align depth with the active **Test Strategy** from `aidlc-state.md`:

| Strategy | Typical approach |
|----------|------------------|
| Minimal | Requirement-driven unit tests; happy-path floor; skip non-essential types |
| Standard | Unit + integration; selective UI automation |
| Comprehensive | Full pyramid + performance + security + E2E as applicable |

### 4.2 Objective

[Primary objective — e.g., maximum coverage of in-scope features via automation-first delivery, or validated acceptance criteria per story before Bolt completion.]

### 4.3 Test automation

#### 4.3.1 UI / application automation tools

| Category | Selection | Notes |
|----------|-----------|-------|
| Language | [e.g., Python, TypeScript] | |
| BDD framework | [e.g., Behave, Cucumber, Playwright Test] | |
| Browser / UI driver | [e.g., Playwright, Selenium] | |
| IDE | [e.g., VS Code] | |
| Scenario language | [Gherkin / native test code] | |
| CI runner | [e.g., Jenkins, GitHub Actions] | |
| Test management | [e.g., Jira + Zephyr, TestRail, Xray] | |

#### 4.3.2 Service / API automation tools *(optional)*

| Category | Selection | Notes |
|----------|-----------|-------|
| Language | [e.g., Java, Python] | |
| Framework | [e.g., Spring Boot, REST Assured, pytest] | |
| BDD / contract | [Cucumber, Pact, OpenAPI diff] | |
| AI validation | [If applicable — semantic kernel, custom eval harness] | |

#### 4.3.3 Test management

- **Work tracking:** [Issue type for QA tasks in sprint — e.g., Jira Task]
- **Test cases:** [Tool and linking policy — link cases to requirements and sprint tasks]
- **Traceability:** Every test case links to requirement / story ID (see §7.3)

#### 4.3.4 Estimation

| Size | Meaning |
|------|---------|
| 1 | 1 day or less |
| 2 | Up to 2 days |
| 3 | Up to 3 days |
| 5 | Roughly one week |

#### 4.3.5 CI/CD configuration

| Setting | Value |
|---------|-------|
| Pipeline type | [Multi-branch / scheduled / on-PR] |
| Schedule | [e.g., daily on develop, per-PR on feature branches] |
| Branch policy | [Which branches publish results to test management] |
| Reports | [Living documentation, HTML report, email notification] |
| Quality gates | [Reference `quality-gates.md` from Stage 3.7] |

---

## 5. Test environment and data

### 5.1 Test environment

| Environment | Purpose | Automation runs | Notes |
|-------------|---------|-----------------|-------|
| Dev | Early dev verification | [Yes / No] | |
| QA | Primary test execution | [Yes] | |
| Stage | Pre-prod / perf | [Yes / No / future phase] | |
| Production | Smoke only | [Post-deploy smoke — §9] | |

[Note constraints — e.g., framework supports multi-env config but stage runs deferred until perf phase.]

### 5.2 Test data

#### 5.2.1 Test data setup

**Purpose:** Enable thorough testing in a controlled environment that mimics production while protecting sensitive data.

- **Production-derived data:** [Yes / No — if yes, describe anonymization and approval process]
- **Synthetic data:** [Describe factory / seed scripts]
- **Loading process:** [How data reaches test stores — scripts, batch jobs, API seeding]
- **Privacy / compliance:** [HIPAA, de-identification, retention policy]

#### 5.2.2 Feature testing data

[Reference test account registry, persona list, or data catalog location.]

#### 5.2.3 Integration testing data

[TBD / describe cross-system fixtures]

#### 5.2.4 Performance testing data

[N/A if out of scope / volume and distribution requirements for load tests]

#### 5.2.5 UAT data

[Accounts and datasets stakeholders use — link to registry]

#### 5.2.6 Smoke testing data

[Minimal prod-safe accounts or synthetic smoke personas — TBD until §9 defined]

---

## 6. Test strategy

### 6.1 Test objective

[Restate objective for this release — e.g., validate all MVP features via automation-first approach as code becomes available from development.]

### 6.2 Entry criteria

QA proceeds when all items below are satisfied:

- [ ] Work items created to track QA workflow through the sprint
- [ ] QA tasks estimated
- [ ] Access to source repository and test automation repo
- [ ] Deployable build available in target environment
- [ ] Test environment and data ready (§5)
- [ ] Requirements / stories baselined with testable acceptance criteria

### 6.3 Exit criteria

QA considers this release phase complete when:

- [ ] Target test coverage met [% or story AC coverage — calibrate to test strategy level]
- [ ] Target automation coverage met [% automated vs manual]
- [ ] All planned tests executed
- [ ] Pass rate meets threshold [% pass on daily / release run]
- [ ] Test case status updated in test management tool
- [ ] Test artifacts delivered (§7.3)
- [ ] Requirements traceability report complete
- [ ] All QA work items closed
- [ ] Test plan reviewed and approved

### 6.4 Assumptions and exceptions

| # | Assumption / exception | Impact | Owner |
|---|------------------------|--------|-------|
| 1 | [e.g., Single browser for MVP] | [Limits cross-browser coverage] | QA |
| 2 | [None / list] | | |

---

## 7. Test execution

### 7.1 Levels of testing

| Level | In scope (§3) | Owner | Environment | Automation |
|-------|---------------|-------|-------------|------------|
| Unit | [Y/N] | Dev / QA | Local / CI | [Y/N] |
| Feature / component | [Y/N] | QA | QA | [Y/N] |
| Integration | [Y/N] | QA / other team | QA | [Y/N] |
| End-to-end | [Y/N] | [Team] | [Env] | [Y/N] |
| UAT | [Y/N] | Stakeholders | QA / UAT | [Manual] |
| Performance | [Y/N] | QA | Stage | [Y/N] |
| Regression | [Y/N] | QA | QA | [Y/N] |
| Smoke | [Y/N] | QA | Prod / staging | [Y/N] |
| Security | [Y/N] | DevSecOps / QA | CI / QA | [Y/N] |

### 7.2 Defect management

| Type | When used | Workflow |
|------|-----------|----------|
| Defect | Issues found in test environments during initial / pre-release phases | Triage → prioritize → fix → retest |
| Bug | Production or post-release issues | Same; may trigger hotfix process |

Every defect / bug requires: severity, reproduction steps, environment, link to failing test (if automated), and retest confirmation.

### 7.3 Test deliverables

| Deliverable | Location | Due |
|-------------|----------|-----|
| Test plan (this document) | `<record>/quality/test-plan.md` | Baseline before Construction; update through Operation |
| Test cases | [Test management tool] | Per sprint |
| Automated test reports / living documentation | [CI artifact path] | Continuous |
| Requirements traceability matrix | `<record>/quality/traceability-matrix.md` | Before release gate |
| Test execution results | `<record>/construction/build-and-test/test-results.md` | Stage 3.6 |
| Performance metrics | `<record>/operation/performance-validation/` | Stage 4.6 (if in scope) |

---

## 8. Features in scope and test deliverables

Populate from user stories (Stage 2.4) and update through Build and Test (Stage 3.6).

| Feature / area | Test detail | Status | Notes |
|----------------|-------------|--------|-------|
| [Feature name] | [Happy path / AC summary] | [Not started / In progress / Done / Deferred] | [Automation scope, blockers] |
| [Feature name] | [Test detail] | [Status] | |
| [API / prompt endpoint] | [Validation approach] | [Status] | |

**Status legend:** `Done` = automated or manual coverage complete and passing; `In progress` = partial coverage; `Pending` = planned but not started; `Deferred` = explicitly out of release automation scope.

---

## 9. Smoke testing

**Trigger:** [After each deployment to target environment]

**Objective:** Confirm the application is accessible and critical paths render for representative users without deep functional validation.

| Step | Check | Expected |
|------|-------|----------|
| 1 | Application loads for smoke persona | [200 / login success] |
| 2 | Navigate core MVP features | [Data displays, no critical errors] |
| 3 | [Additional check] | [Expected result] |

**Personas / accounts:** [TBD — define before first production deploy]

**Owner:** QA (Stage 4.3 Deployment Execution — review `smoke-test-results.md`)

---

## 10. Strategy adjustments and rationale

Record material changes to test approach mid-initiative. Update this section whenever scope, timeline, or risk triggers a strategy pivot (e.g., added data-validation phase, deferred automation, expanded AI eval).

### 10.1 Objective

[Why the adjustment is needed — e.g., support data integrity validation for whitelisted users before MVP release.]

### 10.2 Impact

[Effect on §8 feature status, automation targets, resource allocation, and exit criteria.]

### 10.3 Approach

**Data integrity / validation example** *(delete if not applicable)*

| Role | Responsibility |
|------|----------------|
| UAT / business | Select representative sample; identify UI areas requiring validation |
| QA | Assign resources; coordinate API readiness with development |
| Development | Provide stable endpoints for data retrieval |

**Validation steps:**

1. Retrieve data via API for sample users
2. Verify UI reflects backend data in designated areas
3. Validate identity fields (name, DOB, contact, etc.) for logged-in user
4. Validate domain-specific content (summaries, clinical sections, etc.)
5. Report mismatches, duplicates, or missing records

**Tracking:** [Link to validation tracker — spreadsheet, Jira epic, or `<record>/quality/data-validation-log.md`]

---

*Template version: AI-DLC quality-agent knowledge. Seed at Stage 0.3; treat as living document through Operation.*
