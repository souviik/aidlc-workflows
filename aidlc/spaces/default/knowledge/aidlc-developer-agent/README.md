# Developer Agent Knowledge

Markdown files in this directory customize `aidlc-developer-agent` behavior for Labcorp projects.

Files here are loaded at step 5 of the knowledge loading order, after built-in methodology.

## Files in this directory

### Language-agnostic and stack catalogs

- [labcorp-coding-standards.md](labcorp-coding-standards.md) — SOLID, error handling, naming, docs
- [labcorp-frontend-stacks.md](labcorp-frontend-stacks.md) — React, Angular, Razor catalog
- [labcorp-backend-stacks.md](labcorp-backend-stacks.md) — .NET, Java, Python, Node catalog

### Full-stack guides

- [labcorp-fullstack-angular-nestjs.md](labcorp-fullstack-angular-nestjs.md) — Angular + NestJS topology, contract seam, worked Orders example
- [labcorp-fullstack-angular-dotnet.md](labcorp-fullstack-angular-dotnet.md) — Angular + .NET Core topology, contract seam, worked Orders example

### Angular code generation rules

- [labcorp-frontend-code-generation.md](labcorp-frontend-code-generation.md) — standalone components, OnPush, signals, `inject()`
- [labcorp-frontend-class-organization.md](labcorp-frontend-class-organization.md) — member order, lifecycle, constructor usage
- [labcorp-frontend-template-conventions.md](labcorp-frontend-template-conventions.md) — `@if` / `@for` / `@switch`, attribute order
- [labcorp-frontend-styling-conventions.md](labcorp-frontend-styling-conventions.md) — SCSS rules, nesting, encapsulation
- [labcorp-frontend-design-system-usage.md](labcorp-frontend-design-system-usage.md) — LDS packages and tokens
- [labcorp-frontend-notifications.md](labcorp-frontend-notifications.md) — `ToastrService` patterns
- [labcorp-frontend-observable-naming.md](labcorp-frontend-observable-naming.md) — `$` suffix rules
- [labcorp-frontend-reverse-engineering-scan.md](labcorp-frontend-reverse-engineering-scan.md) — brownfield scan output

### Related (other agent directories)

- Shared cross-cutting rules: [`../aidlc-shared/`](../aidlc-shared/) — TypeScript, package management, security baseline, NestJS, design tokens
- Design system specs: [`../aidlc-design-agent/`](../aidlc-design-agent/) — component catalog, layout, Figma
- Architect designs: [`../aidlc-architect-agent/`](../aidlc-architect-agent/) — feature design, API contracts, NFR patterns
