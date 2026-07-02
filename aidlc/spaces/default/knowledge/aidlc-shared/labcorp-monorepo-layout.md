# Labcorp Monorepo Layout

> **Layer**: cross-cutting (applies to both frontend and backend agents)
> **Source**: derived from `.cursor/rules/shared/angular-nest-monorepo.mdc` (in `ai-governance`)

## Topology

The project is a single TypeScript monorepo with two top-level workspaces:

- `client/` — Angular application (frontend layer)
- `server/` — NestJS application (backend layer)

Both workspaces share TypeScript tooling, ESLint, and Prettier config when practical, but each has its own `package.json` and independent `tsconfig.json`.

## Implications for Architect Agents

- Bounded contexts are expressed as **features**:
  - Frontend: `client/src/app/features/{featureName}/`
  - Backend: `server/src/{feature}/`
- A "unit of work" (per AI-DLC Units Generation) typically spans both layers — a feature touches a NestJS module and at least one Angular feature module. Do not split a single end-user-visible capability into two units along the client/server seam.
- A new HTTP contract is co-designed: an Angular service consumes what a NestJS controller exposes. Specify both sides in the unit's functional design.

## Implications for Developer Agents

- Generated code lands in the appropriate workspace; never write Angular code under `server/` or NestJS code under `client/`.
- Shared types that cross the boundary (request/response shapes) live in whichever workspace owns the contract:
  - If the backend defines the contract: declare DTOs in `server/src/{feature}/dto/`, and have the frontend type its HTTP client responses to mirror the shape (or import from a `shared/` package if one exists).
- Do not introduce a third workspace for shared code without an explicit ADR.

## Lazy Loading

Frontend lazy loading is enabled by default. Every feature module ships with its own routing module and is loaded via `loadChildren`.
