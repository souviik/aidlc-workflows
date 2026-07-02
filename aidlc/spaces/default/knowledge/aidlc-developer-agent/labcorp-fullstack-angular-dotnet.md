# Full-Stack Guide: Angular + .NET Core

Worked reference for a LabCorp web application: **Angular** SPA with the **Labcorp Design System** (`@labcorp/labcorp-bootstrap`, `@labcorp/labcorp-ng-ui`), backed by an **ASP.NET Core** REST API. Use when `tech-stack-decisions.md` or `project.md` → `## Tech Stack` specifies Angular + .NET.

This file is stack-specific only: full-stack topology, the .NET solution layout, the Angular ↔ .NET contract seam, and the .NET-specific differences from the NestJS variant. **Angular code conventions, design-system rules, and the brownfield scan** all live in dedicated modular files — see [See also](#see-also).

For the NestJS variant, see [labcorp-fullstack-angular-nestjs.md](labcorp-fullstack-angular-nestjs.md). For stack catalogs, see [labcorp-frontend-stacks.md](labcorp-frontend-stacks.md) and [labcorp-backend-stacks.md](labcorp-backend-stacks.md). For coding rules, see [labcorp-coding-standards.md](labcorp-coding-standards.md).

---

## Stack at a Glance

| Layer | Technology | Role |
|-------|------------|------|
| UI framework | Angular (TypeScript), standalone + OnPush | SPA routing, components, forms, HTTP client |
| UI styling | `@labcorp/labcorp-bootstrap` | LabCorp Bootstrap theme, tokens, utilities |
| UI components | `@labcorp/labcorp-ng-ui` | Atoms, molecules, organisms — prefer catalog over custom |
| Notifications | `ngx-toastr` (`ToastrService`) | User-facing success/error/info/warning |
| API | ASP.NET Core Web API | REST endpoints, auth, validation, business logic |
| Data | EF Core (typical) | Relational persistence and migrations |
| Contract | OpenAPI (Swagger) | TypeScript interfaces mirror C# DTO shapes |

**Default versions:** Pin **exact** versions for `@labcorp/*` packages — no `^` or `~`. Align Angular and .NET to org LTS — `[TBD — Platform/EA]`.

---

## Solution Layout

```
<repo-root>/
├── client/                            # Angular — all UI code here only
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/
│   │   │   ├── shared/
│   │   │   └── features/              # one folder per feature (lazy-loaded)
│   │   ├── assets/                    # images/, icons/, fonts/, videos/
│   │   └── styles/styles.scss
│   ├── angular.json
│   └── package.json
├── server/                            # ASP.NET Core — all API code here only
│   ├── src/
│   │   ├── <AppName>.Api/             # Controllers, Program.cs, DI composition
│   │   ├── <AppName>.Application/     # Commands, queries, DTOs, validators
│   │   ├── <AppName>.Domain/          # Entities, domain services
│   │   └── <AppName>.Infrastructure/  # EF Core, migrations, HTTP/messaging adapters
│   └── tests/
│       ├── <AppName>.UnitTests/
│       └── <AppName>.IntegrationTests/
└── <AppName>.sln
```

**Rules:**

- Never write Angular under `server/` or .NET under `client/`.
- A unit of work spans both layers: `client/src/app/features/{name}/` plus matching API under `server/src/<AppName>.Api/`.
- Co-design HTTP contracts: Angular services consume what .NET controllers expose. DTOs live in the API; mirror shapes in Angular interfaces or generate from OpenAPI.
- Do not add a third `shared/` workspace without an ADR.
- Every feature ships with its own routing module and loads via `loadChildren`.

---

## Back End: ASP.NET Core Web API

Solution layers and .NET build/test/data-access guidance follow the .NET section of [labcorp-backend-stacks.md](labcorp-backend-stacks.md) (`<AppName>.Api/Application/Domain/Infrastructure`).

**Hosting:** align CDK/IaC with [labcorp-aws-well-architected-pillars.md](../aidlc-aws-platform-agent/labcorp-aws-well-architected-pillars.md). Typical hosting: ECS/Fargate, Lambda, or org-standard compute.

---

## Front-to-Back Integration

The key .NET-specific seam: the API returns **RFC 7807 Problem Details** on failure, whereas the NestJS variant returns the canonical NestJS error envelope. Angular error mapping must read `error.error?.title` from Problem Details (not `error.error?.message`).

| Concern | `client/` | `server/` |
|---------|-----------|-----------|
| Error envelope | `catchError` → typed `IApplicationError` (maps `error.error?.title`) | RFC 7807 Problem Details |
| Action feedback | `ToastrService` | N/A |
| API contract | `I{Name}` interfaces in `client/src/app/features/{name}/interfaces/` | C# DTOs + OpenAPI |

**Local dev:**

```bash
dotnet run --project server/src/<AppName>.Api   # Terminal 1
cd client && ng serve                            # Terminal 2
```

`client/proxy.conf.json`:

```json
{
  "/api": {
    "target": "https://localhost:5001",
    "secure": false,
    "changeOrigin": true
  }
}
```

---

## Worked Example: Orders Feature

The Angular worked example (interface, service, component, template) is identical to the one in [labcorp-fullstack-angular-nestjs.md](labcorp-fullstack-angular-nestjs.md#worked-example-orders-feature-angular) — follow it there. The only .NET-specific difference is error mapping: the service reads `error.error?.title` from the Problem Details response rather than `error.error?.message`.

---

## Security Checklist

- [ ] JWT from org IdP; tokens not in `localStorage` unless approved
- [ ] PHI masked in logs
- [ ] Snyk clean on client; `dotnet list package --vulnerable` on server

See [labcorp-security-standards.md](../aidlc-devsecops-agent/labcorp-security-standards.md) and [labcorp-hipaa-technical-safeguards.md](../aidlc-compliance-agent/labcorp-hipaa-technical-safeguards.md).

---

## When to Use This Guide

**Use when:** Angular + .NET Core, Labcorp Design System, `client/` + `server/` monorepo.

**Prefer a different pattern when:** Angular + NestJS ([labcorp-fullstack-angular-nestjs.md](labcorp-fullstack-angular-nestjs.md)), React ([labcorp-frontend-stacks.md](labcorp-frontend-stacks.md)), or server-rendered Razor was selected.

---

## See Also

### Shared TypeScript and monorepo rules

- [labcorp-monorepo-layout.md](../aidlc-shared/labcorp-monorepo-layout.md) — workspace topology, lazy loading
- [labcorp-package-management.md](../aidlc-shared/labcorp-package-management.md) — exact versions only (client)
- [labcorp-typescript-conventions.md](../aidlc-shared/labcorp-typescript-conventions.md) — `I{Name}` / `T{Name}`, barrels, paths
- [labcorp-typescript-formatting.md](../aidlc-shared/labcorp-typescript-formatting.md) — decorator and control-flow formatting
- [labcorp-security-baseline.md](../aidlc-shared/labcorp-security-baseline.md) — Snyk scanning loop, secrets

### Frontend (Angular)

- [labcorp-frontend-code-generation.md](labcorp-frontend-code-generation.md) — standalone, OnPush, signals, `inject()`
- [labcorp-frontend-class-organization.md](labcorp-frontend-class-organization.md) — member order and lifecycle
- [labcorp-frontend-template-conventions.md](labcorp-frontend-template-conventions.md) — `@if`, `@for`, `@switch`, attributes
- [labcorp-frontend-styling-conventions.md](labcorp-frontend-styling-conventions.md) — SCSS rules
- [labcorp-frontend-design-system-usage.md](labcorp-frontend-design-system-usage.md) — LDS packages and tokens
- [labcorp-frontend-notifications.md](labcorp-frontend-notifications.md) — `ToastrService`
- [labcorp-frontend-observable-naming.md](labcorp-frontend-observable-naming.md) — `$` suffix rules
- [labcorp-frontend-reverse-engineering-scan.md](labcorp-frontend-reverse-engineering-scan.md) — brownfield scan output
- [labcorp-frontend-design-tokens.md](../aidlc-shared/labcorp-frontend-design-tokens.md) — token vocabulary
- [labcorp-design-system-overview.md](../aidlc-design-agent/labcorp-design-system-overview.md) — design-system foundations
- [labcorp-frontend-component-catalog.md](../aidlc-design-agent/labcorp-frontend-component-catalog.md) — component catalog
- [labcorp-frontend-layout-patterns.md](../aidlc-design-agent/labcorp-frontend-layout-patterns.md) — breakpoints, grid

### Backend (.NET)

- [labcorp-backend-stacks.md](labcorp-backend-stacks.md) — .NET section: build/test, data, security
- [labcorp-coding-standards.md](labcorp-coding-standards.md) — language-agnostic coding rules
- [labcorp-aws-well-architected-pillars.md](../aidlc-aws-platform-agent/labcorp-aws-well-architected-pillars.md) — hosting/IaC alignment

### Architect

- [labcorp-frontend-feature-design.md](../aidlc-architect-agent/labcorp-frontend-feature-design.md) — feature scaffolding
- [labcorp-frontend-api-contracts.md](../aidlc-architect-agent/labcorp-frontend-api-contracts.md) — typed HTTP contracts
- [labcorp-frontend-nfr-patterns.md](../aidlc-architect-agent/labcorp-frontend-nfr-patterns.md) — signals, DRY, performance
- [labcorp-adr-template.md](../aidlc-architect-agent/labcorp-adr-template.md) — ADR template
