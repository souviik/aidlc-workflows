# Labcorp Backend — NestJS Best Practices

> **Layer**: backend (NestJS server under `server/`)
> **Source**: derived from `.cursor/rules/shared/nestjs.mdc` and NestJS sections of `.cursor/rules/shared/angular-nest-monorepo.mdc` (in `ai-governance`)
> **Audience**: both architect-agent and developer-agent

This file is the consolidated backend knowledge layer for NestJS work in Angular + NestJS monorepos. Cross-cutting TypeScript rules (naming, formatting, package versions, security scanning) live in the other `aidlc-shared/labcorp-*.md` files and apply here too.

## Workspace Root

All backend code lives under `server/`. Do not generate NestJS artifacts under `client/`.

```
server/
├── src/
│   ├── main.ts                 # bootstrap, global pipes/filters/middleware
│   ├── app.module.ts           # root module
│   └── {feature}/              # one folder per bounded context / feature
│       ├── {feature}.module.ts
│       ├── controllers/
│       ├── services/
│       ├── repositories/       # data access only
│       ├── dto/
│       ├── interfaces/
│       ├── types/
│       ├── enums/
│       └── constants/
├── test/
└── package.json
```

---

## Architect Guidance

### Feature Module Boundaries

- One NestJS feature module per bounded context, at `server/src/{feature}/`.
- A feature module owns its controllers, services, repositories, and DTOs. It does not export internal repositories — only services the rest of the app needs.
- Use `@Global()` sparingly. Reserve it for truly app-wide infrastructure (config, logging, database connection module).
- Cross-feature communication goes through injected services or domain events — never by importing another feature's repository directly.

### Units of Work

When decomposing backend work:

- A unit typically covers one feature module slice: controller endpoint(s) + service method(s) + repository method(s) + DTO(s) + tests.
- Database migrations are their own unit when schema changes are involved.
- Do not split a single REST endpoint across two units.

---

## Developer Guidance

### Imports

Order imports in three groups, separated by blank lines:

1. `@nestjs/*` modules
2. Third-party libraries
3. Application modules (relative or path-alias imports)

### Class Organization

NestJS classes (controllers, services, repositories, providers) follow this member order:

1. Decorator properties (`@Inject`, custom param decorators on fields — rare)
2. Regular properties
3. Constructor
4. Public methods (alphabetized)
5. Protected methods (alphabetized)
6. Private methods (alphabetized)

Constructor parameters are `private readonly` by default. Class members are `private` by default; use `protected` only for subclass extension.

There are no Angular-style lifecycle hooks in NestJS — do not invent `onInit`-style patterns unless implementing a Nest lifecycle interface (`OnModuleInit`, etc.) explicitly.

### Reverse Engineering Scan (Backend)

When scanning `server/` during Reverse Engineering, extract:

- Feature modules under `server/src/{feature}/` and their imports/exports
- Controllers: routes, HTTP methods, guards, DTOs used
- Services: dependencies injected, public method signatures
- Repositories: query methods, ORM/query-builder usage
- Global bootstrap: ValidationPipe config, exception filters, Helmet, CORS
- DTO coverage: endpoints accepting unvalidated plain types (deviation)
- `package.json` exact-version compliance
- Missing Helmet or global ValidationPipe (deviation)

---

## Forbidden

- `@Global()` on feature modules
- `^` or `~` in `server/package.json` dependencies

## Mandated

- Feature modules at `server/src/{feature}/` with clear single responsibility
- `private readonly` constructor parameters
- `I{Name}` / `T{Name}` naming with one declaration per file and barrel exports
- Snyk scan after every code generation; loop until clean (see `labcorp-security-baseline.md`)
- Exact npm versions in `server/package.json`

## Relationship to Frontend

- Backend DTO/response shapes are the contract source; Angular interfaces in `client/` mirror them.
- Error envelope from the global exception filter is what the Angular `catchError` mapper expects — keep field names stable.
- A feature unit spanning client and server should list both the NestJS module changes and the Angular feature changes in the same delivery plan.
