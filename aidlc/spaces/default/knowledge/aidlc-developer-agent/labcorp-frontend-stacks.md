# Labcorp Approved Frontend Stacks

Reference for LabCorp-approved front-end technologies. Use during **code generation**, **reverse engineering**, and **functional design** when implementing or scanning UI layers.

For language-agnostic coding rules, see `labcorp-coding-standards.md`. For API contracts the UI consumes, see `api-design-guide.md`. Stack **selection** for greenfield work is architect-led (NFR Requirements → `tech-stack-decisions.md`); this file describes **how to build** once a front-end stack is chosen.

---

## How to Use This File

1. **Greenfield:** Confirm the chosen stack in upstream `tech-stack-decisions.md` or `project.md` → `## Tech Stack` before generating UI code.
2. **Brownfield:** Detect the stack from the repo (`package.json`, build config, framework imports) and follow the matching section below.
3. **Status labels:**
   - **Preferred** — default for new patient-facing and internal web applications unless architect records a justified exception.
   - **Approved** — supported; use when constraints (team skills, integration, legacy coexistence) require it.
   - **Legacy** — maintain and extend only; do not start new greenfield work without architect approval.
   - **Deprecated** — migrate away; no new features except compliance or security fixes.

Replace `[TBD — Platform/EA]` placeholders with your organization's pinned versions, starter repos, and internal doc links.

---

## Stack Summary

| Stack | Status | Typical use |
|-------|--------|-------------|
| React + TypeScript | Preferred | SPAs, portals, internal tools, component-rich UX |
| Angular + TypeScript | Approved | Large enterprise modules, long-lived clinical/business apps |
| Angular + Bootstrap + NestJS | Approved | Full-stack TypeScript — see `labcorp-fullstack-angular-nestjs.md` |
| Angular + Bootstrap + .NET Core | Approved | Full-stack with .NET API — see `labcorp-fullstack-angular-dotnet.md` |
| Server-rendered (.NET Razor / similar) | Approved | Form-heavy workflows tightly coupled to a .NET backend |

---

## React + TypeScript — Preferred

**Use when:** New web applications, design-system-driven UX, teams standardizing on component libraries, or integrations that expect a JSON API + SPA.

**Default versions:** `[TBD — Platform/EA]` (e.g. React 18+, TypeScript 5+, Node LTS for tooling)

**Starter / reference:** `[TBD — internal template repo or golden path URL]`

### Security and compliance

- Treat all displayed patient or order data as sensitive; mask in logs and avoid persisting PHI in `localStorage` unless compliance approves.
- Follow `labcorp-security-standards.md` for auth (OIDC/OAuth2), CSP, and dependency scanning.

**Do not use for:** `[TBD — e.g. teams without React capability, mandated Angular-only platforms]`

**See also:** `labcorp-coding-standards.md`, `code-generation-patterns.md`, `api-design-guide.md`

---

## Angular + TypeScript — Approved

**Use when:** Extending existing Angular codebases, modules owned by Angular-experienced teams, or platform mandates requiring Angular.

**Default versions:** `[TBD — Platform/EA]` (e.g. Angular LTS aligned with org support window)

**Starter / reference:** `[TBD — internal Angular workspace template]`

### Security and compliance

- Same PHI handling rules as the React stack above; follow `labcorp-security-standards.md`.

**Do not use for:** New greenfield SPAs when React is the team default unless architect documents an exception in `tech-stack-decisions.md`.

**See also:** `labcorp-coding-standards.md`, `labcorp-backend-stacks.md`, `labcorp-fullstack-angular-nestjs.md`, `labcorp-fullstack-angular-dotnet.md`

---

## Cross-Stack Concerns

### Design system and branding

Use the org design system when specified in functional design or team knowledge (`aidlc/knowledge/aidlc-design-agent/`). Do not invent ad hoc color, typography, or component patterns when a design system applies.

### When no section matches

1. Record the detected stack in the RE/code-scan artifact.
2. Do not assume Preferred defaults — follow what the repo and `tech-stack-decisions.md` specify.
3. Propose adding a new stack entry to this file via team review if a repeated gap appears.

---

## Maintenance

| Field | Owner | Cadence |
|-------|-------|---------|
| Version pins, starter repos | Platform / EA | Quarterly or on LTS change |
| Preferred vs Legacy status | Architecture guild | Semi-annual |
| Project-specific overrides | Project team | `project.md` → `## Tech Stack` |
