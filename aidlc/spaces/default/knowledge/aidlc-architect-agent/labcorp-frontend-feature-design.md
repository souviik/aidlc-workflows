# Labcorp Frontend Feature Design

> **Layer**: frontend (Angular)
> **Source**: derived from `.cursor/rules/shared/angular.mdc` `## Feature Scaffolding` and `## Angular-Specific Conventions` (in `ai-governance`)

## Bounded Context = Feature Folder

In this project's Angular client, each bounded context maps to a feature folder under `client/src/app/features/{featureName}/`. The architect's component decomposition output must align with this layout.

## Required Folder Layout

For every new feature the architect specifies, prescribe this skeleton:

```
client/src/app/features/{featureName}/
├── components/         # presentational + container components
├── directives/         # feature-scoped directives (if any)
├── services/           # feature services (HTTP, state, orchestration)
├── interfaces/         # I{Name}.ts files + index.ts barrel
├── types/              # T{Name}.ts files + index.ts barrel
├── enums/              # enum files + index.ts barrel
├── constants/          # constant files + index.ts barrel
├── {featureName}.module.ts          # NgModule (legacy boundary; routing host)
└── {featureName}-routes.module.ts   # lazy-loaded routing module
```

Subdirectories without contributors stay empty rather than being omitted — their presence signals to other developers where future code goes.

## Standalone Components

All new components in a feature must be **standalone**. The architect does not specify NgModule-based component layouts for new work. The `{featureName}.module.ts` exists only as a routing host and entry point for lazy loading.

## Boundaries

- **No cross-feature component imports** for business logic. If two features need the same component, promote it to a shared module — this requires an ADR.
- Per-feature state uses a **signal-based store** by default; see [labcorp-frontend-nfr-patterns.md](labcorp-frontend-nfr-patterns.md).

## Hand-Off Checklist

Before passing a feature design to the developer agent, the architect verifies:

- [ ] Feature folder name is in kebab-case and matches the bounded context
- [ ] Route topology is specified
- [ ] Components are labeled container vs presentation
- [ ] Each component has explicit `@Input()` and `@Output()` signatures
- [ ] Required interfaces, types, enums, and constants are enumerated
- [ ] Feature service responsibilities are stated
- [ ] HTTP endpoints consumed are listed with their request and response types (referencing the backend contract)
