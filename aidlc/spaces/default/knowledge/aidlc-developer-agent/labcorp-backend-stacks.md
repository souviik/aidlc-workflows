# Labcorp Approved Backend Stacks

Reference for LabCorp-approved back-end technologies. Use during **code generation**, **reverse engineering**, **functional design** (API and data models), and **deployment execution** (migrations).

For language-agnostic coding rules, see `labcorp-coding-standards.md`. For REST/GraphQL contract shape, see `api-design-guide.md`. For data model patterns, see `data-modelling-patterns.md`. Stack **selection** is architect-led (NFR Requirements → `tech-stack-decisions.md`); this file describes **how to build** once a back-end stack is chosen.

---

## How to Use This File

1. **Greenfield:** Implement against the stack recorded in `tech-stack-decisions.md` or locked in `project.md` → `## Tech Stack`.
2. **Brownfield:** Infer stack from manifests (`*.csproj`, `pom.xml`, `build.gradle`, `pyproject.toml`, `go.mod`, `package.json` for Node services).
3. **Status labels:** Preferred · Approved · Legacy · Deprecated (same definitions as `labcorp-frontend-stacks.md`).

Replace `[TBD — Platform/EA]` placeholders with pinned versions, internal templates, and platform runbooks.

---

## Stack Summary

| Stack | Status | Typical use |
|-------|--------|-------------|
| .NET (ASP.NET Core) | Preferred | REST APIs, microservices, healthcare integrations, AWS-hosted services |
| Java (Spring Boot) | Approved | Enterprise services, event-driven systems, existing Java estates |
| Python (FastAPI) | Approved | Internal APIs, data/ML adjacency, automation services |
| Node.js (TypeScript) | Approved | BFF layers, lightweight APIs when team skill set fits |

---

## .NET (ASP.NET Core) — Preferred

**Use when:** New microservices on AWS, HL7/FHIR-adjacent integrations common in LabCorp contexts, teams with .NET strength, or pairing with Razor front ends.

**Default versions:** `[TBD — Platform/EA]` (.NET LTS, ASP.NET Core, EF Core if ORM)

**Starter / reference:** `[TBD — internal .NET service template]`

**Security and compliance:** PHI handling, authentication, and logging requirements per `labcorp-security-standards.md` and `labcorp-hipaa-technical-safeguards.md`.

**AWS and infrastructure:** Align CDK/IaC with `cdk-best-practices.md` and `labcorp-aws-well-architected-pillars.md`.

**Do not use for:** `[TBD — e.g. greenfield where Java platform mandate applies]`

**See also:** `labcorp-frontend-stacks.md`, `api-design-guide.md`, `labcorp-microservices-patterns.md`

---

## Java (Spring Boot) — Approved

**Use when:** Extending Java/Spring estates, Kafka-heavy event pipelines, or team/platform constraints favoring JVM services.

**Default versions:** `[TBD — Platform/EA]` (Spring Boot LTS, Java LTS)

**Starter / reference:** `[TBD — internal Spring Boot template]`

**Security and compliance:** Same PHI and logging requirements as the .NET section (`labcorp-security-standards.md`, `labcorp-hipaa-technical-safeguards.md`).

**Do not use for:** New services where .NET is the documented platform default without architect exception.

**See also:** `labcorp-microservices-patterns.md`, `devsecops-pipeline-patterns.md`

---

## Python (FastAPI) — Approved

**Use when:** Internal tools APIs, data-processing microservices, ML inference wrappers, or rapid API prototypes promoted to production with quality gates.

**Default versions:** `[TBD — Platform/EA]` (Python 3.x LTS, FastAPI, Pydantic v2)

**Starter / reference:** `[TBD — internal FastAPI template]`

**Do not use for:** Latency-critical synchronous paths without performance validation; high-compliance tier-1 patient APIs unless architect and security sign off.

**See also:** `labcorp-coding-standards.md`, `labcorp-test-automation-strategies.md`

---

## Node.js (TypeScript) — Approved

**Use when:** Backend-for-frontend (BFF), lightweight REST/GraphQL gateways, or teams aligning full-stack TypeScript with React front ends.

**Default versions:** `[TBD — Platform/EA]` (Node LTS, TypeScript, framework — Express/Fastify/Nest per template)

**Starter / reference:** `[TBD — internal Node service template]`

For NestJS-specific patterns (feature modules, controller/service/repository, DTOs, bootstrap), see [labcorp-backend-nestjs.md](../aidlc-shared/labcorp-backend-nestjs.md).

**Do not use for:** CPU-heavy batch processing better suited to JVM or .NET worker services.

**See also:** `labcorp-frontend-stacks.md`, `api-design-guide.md`, `labcorp-fullstack-angular-nestjs.md`, [labcorp-backend-nestjs.md](../aidlc-shared/labcorp-backend-nestjs.md)

---

## Cross-Stack Concerns

### Typical front-end pairings

| Backend | Common front-end pairing |
|---------|--------------------------|
| .NET API | React SPA, Razor server-rendered, **Angular + Bootstrap** (see `labcorp-fullstack-angular-dotnet.md`) |
| NestJS API | **Angular + Bootstrap** (see `labcorp-fullstack-angular-nestjs.md`), React |
| Spring Boot API | Angular, React |
| FastAPI | React, internal tools |
| Node BFF | React |

Details in `labcorp-frontend-stacks.md`.

### When no section matches

Document the detected stack in RE artifacts, implement using repo conventions, and escalate repeated gaps to Platform/EA for inclusion here.

---

## Maintenance

| Field | Owner | Cadence |
|-------|-------|---------|
| Version pins, templates | Platform / EA | Quarterly or on LTS change |
| Preferred vs Legacy status | Architecture guild | Semi-annual |
| Project-specific overrides | Project team | `project.md` → `## Tech Stack` |
