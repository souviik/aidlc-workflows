# QA Stage Responsibilities

> **Audience:** QA engineers, QA managers, and test leads using AI-DLC.
> **Scope:** All 5 phases, 32 stages. Maps stage I/O and agent assignments to QA participation.
> **Companion docs:** `labcorp-test-plan-template.md`, `labcorp-release-process-template.md`, `labcorp-release-qualification-record.md`, `testing-guide.md`, `test-strategy-patterns.md`, `labcorp-test-automation-strategies.md`

## QA role legend

| Role | Meaning |
|------|---------|
| **Lead** | `aidlc-quality-agent` leads the stage; human QA owns gate approval and artifact review |
| **Support** | Agent provides specialist input; human QA reviews and contributes |
| **Advisory** | No agent assignment; human QA reviews artifacts for testability |
| **Monitor** | Observe outputs; act only if quality concerns arise |
| **None** | No QA participation expected |

## Quick reference — formal agent assignment

| Stage | Name | QA Agent Role |
|-------|------|---------------|
| 2.2 | Practices Discovery | **Support** |
| 3.2 | NFR Requirements | **Support** |
| 3.6 | Build and Test | **Lead** |
| 4.6 | Performance Validation | **Lead** |

All other stages: human QA participates in an **Advisory** or **Monitor** capacity as defined below.

---

## Phase 0 — Initialization (Stages 0.1–0.3)

Engine bootstrap only. No approval gates.

### Stage 0.1 — Workspace Scaffold

| Field | Value |
|-------|-------|
| **Inputs** | None (first stage after session start) |
| **Outputs** | Per-intent record tree (stage artifact dirs + verification dir); space-level `knowledge/` dir |
| **Lead Agent** | orchestrator |
| **Support Agents** | — |
| **QA Role** | **None** — Engine creates directory scaffolding. Note that `aidlc/knowledge/aidlc-quality-agent/` is available for team standards. |

### Stage 0.2 — Workspace Detection

| Field | Value |
|-------|-------|
| **Inputs** | None (filesystem scan) |
| **Outputs** | Workspace classification (greenfield/brownfield); technology stack detection |
| **Lead Agent** | orchestrator |
| **Support Agents** | — |
| **QA Role** | **Monitor** — Note brownfield vs greenfield; brownfield triggers heavier testing posture discovery in Stage 2.2. |

### Stage 0.3 — State Initialization

| Field | Value |
|-------|-------|
| **Inputs** | Workspace classification; scope from orchestrator |
| **Outputs** | `<record>/aidlc-state.md` (scope, depth, test strategy, stage checklist) |
| **Lead Agent** | orchestrator |
| **Support Agents** | — |
| **QA Role** | **Advisory** — Seed `<record>/quality/test-plan.md` from `labcorp-test-plan-template.md` using scope, depth, and test strategy from `aidlc-state.md`. Review test strategy alignment with initiative risk. |

---

## Phase 1 — Ideation (Stages 1.1–1.7)

Business intent and scope. QA contributes quality-risk perspective at gates.

### Stage 1.1 — Intent Capture & Framing

| Field | Value |
|-------|-------|
| **Inputs** | User project description; scope selection |
| **Outputs** | `intent-statement.md`, `stakeholder-map.md`, `intent-capture-questions.md` |
| **Lead Agent** | aidlc-product-agent |
| **Support Agents** | aidlc-architect-agent |
| **QA Role** | **Advisory** — Review intent for implicit quality expectations (compliance, performance SLAs, data integrity). Flag testability risks early. |

### Stage 1.2 — Market Research

| Field | Value |
|-------|-------|
| **Inputs** | Intent statement |
| **Outputs** | `competitive-analysis.md`, `market-trends.md`, `build-vs-buy.md`, `market-research-questions.md` |
| **Lead Agent** | aidlc-product-agent |
| **Support Agents** | — |
| **QA Role** | **Monitor** — Note build-vs-buy decisions that affect test scope (COTS vs custom, integration testing burden). |

### Stage 1.3 — Feasibility & Constraints

| Field | Value |
|-------|-------|
| **Inputs** | Intent statement; market research (if executed) |
| **Outputs** | `feasibility-assessment.md`, `constraint-register.md`, `raid-log.md`, `feasibility-questions.md` |
| **Lead Agent** | aidlc-architect-agent |
| **Support Agents** | aidlc-aws-platform-agent, aidlc-compliance-agent |
| **QA Role** | **Advisory** — Review RAID log for quality risks (technical debt, timeline compression, compliance gaps). Ensure constraints mention test environment availability. |

### Stage 1.4 — Scope Definition

| Field | Value |
|-------|-------|
| **Inputs** | Intent statement; feasibility assessment; constraint register |
| **Outputs** | `scope-document.md`, `intent-backlog.md`, `scope-definition-questions.md` |
| **Lead Agent** | aidlc-product-agent |
| **Support Agents** | aidlc-delivery-agent |
| **QA Role** | **Advisory** — Confirm scope includes NFRs, accessibility, and regression scope. Estimate test effort implications of in/out scope decisions. |

### Stage 1.5 — Team Formation

| Field | Value |
|-------|-------|
| **Inputs** | Scope definition; intent backlog; feasibility assessment |
| **Outputs** | `team-assessment.md`, `skill-matrix.md`, `mob-composition.md`, `team-formation-questions.md` |
| **Lead Agent** | aidlc-delivery-agent |
| **Support Agents** | — |
| **QA Role** | **Advisory** — Ensure QA capacity is represented in skill matrix and mob composition. Flag if no QA assigned to high-risk scope. |

### Stage 1.6 — Rough Mockups

| Field | Value |
|-------|-------|
| **Inputs** | Intent statement; scope definition; intent backlog |
| **Outputs** | `wireframes.md`, `user-flow.md`, `rough-mockups-questions.md` |
| **Lead Agent** | aidlc-design-agent |
| **Support Agents** | aidlc-product-agent |
| **QA Role** | **Advisory** — Identify testable user flows; note error/empty states missing from wireframes. |

### Stage 1.7 — Approval & Handoff

| Field | Value |
|-------|-------|
| **Inputs** | All Ideation artifacts |
| **Outputs** | `initiative-brief.md`, `decision-log.md`, `approval-handoff-questions.md` |
| **Lead Agent** | aidlc-delivery-agent |
| **Support Agents** | aidlc-product-agent |
| **QA Role** | **Advisory** — **Gate reviewer.** Confirm quality risks are documented before Inception. Sign off that test strategy level is appropriate for initiative risk. |

---

## Phase 2 — Inception (Stages 2.1–2.8)

Requirements, stories, architecture. QA shapes testability and affirms testing posture.

### Stage 2.1 — Reverse Engineering

| Field | Value |
|-------|-------|
| **Inputs** | `<record>/aidlc-state.md` |
| **Outputs** | 9 artifacts under `aidlc/spaces/<space>/codekb/<repo>/` (incl. `code-quality-assessment.md`) |
| **Lead Agent** | aidlc-developer-agent |
| **Support Agents** | aidlc-architect-agent |
| **QA Role** | **Advisory** — Review `code-quality-assessment.md` for existing test coverage, flaky tests, and test debt. Feed findings into Stage 2.2. |

### Stage 2.2 — Practices Discovery

| Field | Value |
|-------|-------|
| **Inputs** | State file + (brownfield) RE artifacts |
| **Outputs** | `team-practices.md`, `discovered-rules.md`, `evidence.md`; promoted to `team.md` / `project.md` on affirmation |
| **Lead Agent** | aidlc-pipeline-deploy-agent |
| **Support Agents** | **aidlc-quality-agent**, aidlc-developer-agent, aidlc-devsecops-agent |
| **QA Role** | **Support (critical)** — Brownfield: agent scans test frameworks, coverage tooling, CI gates. **Human QA must lead the Testing Posture interview** — affirm TDD/BDD/test-after policy, coverage floor, CI block-vs-warn. This governs all Construction testing. |

### Stage 2.3 — Requirements Analysis

| Field | Value |
|-------|-------|
| **Inputs** | RE artifacts (brownfield); project description |
| **Outputs** | `requirements.md`, `requirements-analysis-questions.md` |
| **Lead Agent** | aidlc-product-agent |
| **Support Agents** | — |
| **QA Role** | **Advisory** — Review requirements for testability: measurable acceptance criteria, explicit NFRs, error conditions, data validation rules. Request FR/NFR IDs for traceability. |

### Stage 2.4 — User Stories

| Field | Value |
|-------|-------|
| **Inputs** | `requirements.md`; RE artifacts (brownfield) |
| **Outputs** | `stories.md`, `personas.md`, `user-stories-assessment.md` |
| **Lead Agent** | aidlc-product-agent |
| **Support Agents** | aidlc-design-agent |
| **QA Role** | **Advisory (high impact)** — Review stories for **INVEST "Testable"** criterion. Every story needs clear Given/When/Then acceptance criteria. These become the test oracle for Stage 3.6. |

### Stage 2.5 — Refined Mockups

| Field | Value |
|-------|-------|
| **Inputs** | Rough mockups; user stories; requirements |
| **Outputs** | `mockups.md`, `interaction-spec.md`, `design-system-mapping.md`, `accessibility-checklist.md` |
| **Lead Agent** | aidlc-design-agent |
| **Support Agents** | aidlc-product-agent |
| **QA Role** | **Advisory** — Review `accessibility-checklist.md` and interaction spec. Define UX acceptance test scenarios (keyboard nav, screen reader, responsive breakpoints). |

### Stage 2.6 — Application Design

| Field | Value |
|-------|-------|
| **Inputs** | Requirements; stories (if produced); RE artifacts (brownfield) |
| **Outputs** | `components.md`, `component-methods.md`, `services.md`, `component-dependency.md`, `decisions.md` |
| **Lead Agent** | aidlc-architect-agent |
| **Support Agents** | aidlc-aws-platform-agent, aidlc-design-agent |
| **QA Role** | **Advisory** — Assess design testability: dependency injection, seam points for mocking, API contract clarity, observability hooks. Flag tight coupling that blocks unit testing. |

### Stage 2.7 — Units Generation

| Field | Value |
|-------|-------|
| **Inputs** | Application design artifacts; requirements; stories |
| **Outputs** | `unit-of-work.md`, `unit-of-work-dependency.md`, `unit-of-work-story-map.md` |
| **Lead Agent** | aidlc-architect-agent |
| **Support Agents** | aidlc-delivery-agent |
| **QA Role** | **Advisory** — Review unit boundaries for test isolation. Confirm story-to-unit mapping supports incremental test coverage per Bolt. |

### Stage 2.8 — Delivery Planning

| Field | Value |
|-------|-------|
| **Inputs** | All Inception artifacts |
| **Outputs** | `bolt-plan.md`, `team-allocation.md`, `risk-and-sequencing-rationale.md`, `external-dependency-map.md` |
| **Lead Agent** | aidlc-delivery-agent |
| **Support Agents** | aidlc-architect-agent |
| **QA Role** | **Advisory** — Validate test effort is allocated per Bolt. Confirm walking-skeleton Bolt includes minimal test harness. **Seed** `<record>/quality/release-process.md` from `labcorp-release-process-template.md` (release timeline + checklist). **Gate reviewer** before Construction. |

---

## Phase 3 — Construction (Stages 3.1–3.7)

Design → code → test. QA's heaviest phase; leads Build and Test.

Per-unit stages (3.1–3.5) run **Bolt-by-Bolt**; 3.6–3.7 run **once** after all Bolts.

### Stage 3.1 — Functional Design

| Field | Value |
|-------|-------|
| **Inputs** | Unit-of-work artifacts; requirements; application design |
| **Outputs** | `business-logic-model.md`, `business-rules.md`, `domain-entities.md`, (conditional) `frontend-components.md` |
| **Lead Agent** | aidlc-architect-agent |
| **Support Agents** | aidlc-developer-agent |
| **QA Role** | **Advisory** — Derive test scenarios from `business-rules.md` (edge cases, boundary conditions, invalid inputs). Feed scenarios forward to 3.6. |

### Stage 3.2 — NFR Requirements

| Field | Value |
|-------|-------|
| **Inputs** | Functional design artifacts; `requirements.md`; RE artifacts |
| **Outputs** | `performance-requirements.md`, `security-requirements.md`, `scalability-requirements.md`, `reliability-requirements.md`, `tech-stack-decisions.md` |
| **Lead Agent** | aidlc-architect-agent |
| **Support Agents** | aidlc-devsecops-agent, aidlc-compliance-agent, **aidlc-quality-agent** |
| **QA Role** | **Support** — Define **testable** NFR scenarios with measurable targets (p95 latency, error rate, availability %). Each NFR must have a validation method (load test, chaos test, security scan). |

### Stage 3.3 — NFR Design

| Field | Value |
|-------|-------|
| **Inputs** | NFR requirements; functional design artifacts |
| **Outputs** | `performance-design.md`, `security-design.md`, `scalability-design.md`, `reliability-design.md`, `logical-components.md` |
| **Lead Agent** | aidlc-architect-agent |
| **Support Agents** | aidlc-aws-platform-agent |
| **QA Role** | **Advisory** — Confirm NFR design includes test hooks (metrics endpoints, feature flags, circuit breaker observability). Map designs to test types for 3.6 and 4.6. |

### Stage 3.4 — Infrastructure Design

| Field | Value |
|-------|-------|
| **Inputs** | NFR design; application design; functional design |
| **Outputs** | `deployment-architecture.md`, `infrastructure-services.md`, `monitoring-design.md`, `cicd-pipeline.md` |
| **Lead Agent** | aidlc-aws-platform-agent |
| **Support Agents** | aidlc-devsecops-agent, aidlc-compliance-agent |
| **QA Role** | **Advisory** — Review test environment topology, test data isolation, and monitoring design. Confirm CI/CD plan includes test stages. |

### Stage 3.5 — Code Generation

| Field | Value |
|-------|-------|
| **Inputs** | All prior design artifacts for the unit |
| **Outputs** | Application code + `code-generation-plan.md`, `code-summary.md` |
| **Lead Agent** | aidlc-developer-agent |
| **Support Agents** | — |
| **QA Role** | **Advisory** — Per affirmed Testing Posture: review generated tests alongside code. Verify tests map to acceptance criteria. Flag missing error-path coverage before Bolt completes. |

### Stage 3.6 — Build and Test

| Field | Value |
|-------|-------|
| **Inputs** | ALL code generation outputs across all units |
| **Outputs** | `build-instructions.md`, `unit-test-instructions.md`, `integration-test-instructions.md`, `performance-test-instructions.md`, `security-test-instructions.md`, `build-and-test-summary.md`, `test-results.md` |
| **Lead Agent** | **aidlc-quality-agent** |
| **Support Agents** | aidlc-devsecops-agent |
| **QA Role** | **Lead (primary QA stage)** — Own test strategy execution: run build, execute test suites per active test strategy (Minimal/Standard/Comprehensive), validate coverage vs acceptance criteria, enforce quality gates. Update release process gap analysis; create `release-qualification.md` when dev delivers release components; **auto-generate `confluence-artifact-row.md`** from Jenkins regression (§3.1) and **`qa-release-signoff-email.md`** when release regression passes. **Human QA approves gate** before CI Pipeline. |

### Stage 3.7 — CI Pipeline

| Field | Value |
|-------|-------|
| **Inputs** | Code generation output; build/test results |
| **Outputs** | `ci-config.md`, `quality-gates.md`, `ci-pipeline-questions.md` |
| **Lead Agent** | aidlc-pipeline-deploy-agent |
| **Support Agents** | — |
| **QA Role** | **Advisory (high impact)** — Review `quality-gates.md`: coverage thresholds, blocking vs warning, security scan integration, test parallelization. Confirm gates match affirmed Testing Posture. |

---

## Phase 4 — Operation (Stages 4.1–4.7)

Deploy, monitor, validate in production-like environments.

### Stage 4.1 — Deployment Pipeline

| Field | Value |
|-------|-------|
| **Inputs** | CI pipeline config; infrastructure design |
| **Outputs** | `cd-config.md`, `deployment-strategy.md`, `rollback-runbook.md` |
| **Lead Agent** | aidlc-pipeline-deploy-agent |
| **Support Agents** | — |
| **QA Role** | **Advisory** — Confirm CD pipeline includes post-deploy smoke tests and rollback triggers on test failure. Align `quality-gates.md` with release process entry criteria (security scan, release version tagging). |

### Stage 4.2 — Environment Provisioning

| Field | Value |
|-------|-------|
| **Inputs** | Infrastructure design; CD pipeline config |
| **Outputs** | `environment-inventory.md`, `validation-report.md` |
| **Lead Agent** | aidlc-aws-platform-agent |
| **Support Agents** | aidlc-devsecops-agent, aidlc-compliance-agent |
| **QA Role** | **Advisory** — Validate test/staging environments mirror production sufficiently for meaningful testing. Confirm test data strategy for non-prod. |

### Stage 4.3 — Deployment Execution

| Field | Value |
|-------|-------|
| **Inputs** | CD config; provisioned environments; Construction artifacts |
| **Outputs** | `deployment-log.md`, `smoke-test-results.md`, `health-check-report.md` |
| **Lead Agent** | aidlc-pipeline-deploy-agent |
| **Support Agents** | aidlc-developer-agent |
| **QA Role** | **Advisory** — Review/execute smoke tests post-deploy per `labcorp-release-process-template.md` §3.8. Validate critical paths before sign-off. Execute release regression exit criteria and sign-off artifacts. Escalate failures before Operation continues. |

### Stage 4.4 — Observability Setup

| Field | Value |
|-------|-------|
| **Inputs** | NFR design; infrastructure design; deployed application |
| **Outputs** | `dashboards.md`, `alarms.md`, `slo-config.md`, `log-queries.md`, `tracing-config.md` |
| **Lead Agent** | aidlc-operations-agent |
| **Support Agents** | — |
| **QA Role** | **Advisory** — Confirm SLOs align with NFR targets from 3.2. Ensure quality metrics (error rate, latency) are monitored for regression detection. |

### Stage 4.5 — Incident Response

| Field | Value |
|-------|-------|
| **Inputs** | Observability setup; NFR design; infrastructure design |
| **Outputs** | `runbooks.md`, `incident-plan.md`, `escalation-matrix.md` |
| **Lead Agent** | aidlc-operations-agent |
| **Support Agents** | — |
| **QA Role** | **Monitor** — Review runbooks for quality-related incidents (test failures in prod, performance degradation). Ensure defect escape feedback loop to QA. |

### Stage 4.6 — Performance Validation

| Field | Value |
|-------|-------|
| **Inputs** | NFR requirements + design; deployed application; observability data |
| **Outputs** | `load-test-plan.md`, `test-results.md`, `nfr-validation-matrix.md`, `performance-validation-questions.md` |
| **Lead Agent** | **aidlc-quality-agent** |
| **Support Agents** | — |
| **QA Role** | **Lead** — Design and execute load/stress/soak tests. Produce NFR validation matrix (target vs actual). Recommend capacity planning. **Human QA approves gate** before Feedback stage. |

### Stage 4.7 — Feedback & Optimization

| Field | Value |
|-------|-------|
| **Inputs** | All Operation artifacts; production monitoring data |
| **Outputs** | `slo-report.md`, `cost-analysis.md`, `drift-report.md`, `feedback-loop.md` |
| **Lead Agent** | aidlc-operations-agent |
| **Support Agents** | aidlc-aws-platform-agent |
| **QA Role** | **Advisory** — Review defect escape rate, flaky test trends, and quality feedback loop. Feed learnings into next intent's Practices Discovery. |

---

## Approval gates — QA attendance

| Gate | QA action |
|------|-----------|
| 1.7 Approval & Handoff | Recommended — quality risk sign-off |
| 2.2 Practices Discovery (Testing Posture) | **Required** — affirm testing methodology |
| 2.4 User Stories | Recommended — acceptance criteria review |
| 2.8 Delivery Planning | Recommended — test effort validation |
| 3.6 Build and Test | **Required** — quality gate owner |
| 4.6 Performance Validation | **Required** — NFR sign-off |
| All other gates | Optional — review if quality concerns exist |

---

## Traceability chain

```
Requirements (2.3) → Stories + AC (2.4) → NFR targets (3.2) → Test instructions (3.6)
→ test-results.md (3.6) → quality-gates.md (3.7) → smoke tests (4.3) → NFR matrix (4.6)
```
