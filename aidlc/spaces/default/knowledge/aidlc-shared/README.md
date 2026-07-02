# Shared Knowledge

Files in this directory are loaded by **all** agents at step 8 of the knowledge loading order (`aidlc-shared/labcorp-*.md` layer), after framework methodology — company standards, monorepo conventions, and cross-cutting rules.

## Files in this directory

### Cross-cutting TypeScript and tooling

- [labcorp-monorepo-layout.md](labcorp-monorepo-layout.md) — `client/` + `server/` topology, lazy loading
- [labcorp-package-management.md](labcorp-package-management.md) — exact npm versions only, no `^` / `~`
- [labcorp-typescript-conventions.md](labcorp-typescript-conventions.md) — `I{Name}` / `T{Name}`, barrels, path aliases
- [labcorp-typescript-formatting.md](labcorp-typescript-formatting.md) — decorator, control flow, template literal formatting

### Security

- [labcorp-security-baseline.md](labcorp-security-baseline.md) — Snyk scanning loop, secrets, surface reduction

### Backend deep dives

- [labcorp-backend-nestjs.md](labcorp-backend-nestjs.md) — NestJS modules, controllers, services, repositories, bootstrap

### Frontend design tokens

- [labcorp-frontend-design-tokens.md](labcorp-frontend-design-tokens.md) — LDS color, spacing, typography, radius, motion vocabulary
