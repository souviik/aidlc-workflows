# Labcorp TypeScript Conventions

> **Layer**: cross-cutting (applies to both frontend and backend agents)
> **Source**: derived from `.cursor/rules/shared/angular.mdc` and `.cursor/rules/shared/nestjs.mdc` (in `ai-governance`)

These rules apply to **all** TypeScript files in the monorepo, regardless of whether they live under `client/` or `server/`.

## Interfaces and Types

- **One per file**: each interface or type is defined in its own file.
- **Filename matches the export**: the file name and the interface or type name are identical.
- **Naming**:
  - Interfaces: `I{Name}` (e.g., `IUser`, `ITodo`)
  - Types: `T{Name}` (e.g., `TStatus`, `TPriority`)
- **Property ordering**: members of interfaces, types, and enums are listed in alphabetical order.

## Directory Conventions

Within any feature folder, place TypeScript artifacts in dedicated subdirectories:

- `interfaces/` — contains `I{Name}.ts` files
- `types/` — contains `T{Name}.ts` files
- `enums/` — contains enum files
- `constants/` — contains constant files

## Enum-Derived Types

For each exported enum in an `enums/` directory, automatically create a corresponding type in `types/` with the same base name, using a TypeScript template literal:

```typescript
// enums/ETaskFilter.ts
export enum ETaskFilter {
  All = "all",
  Active = "active",
  Completed = "completed",
}
```

```typescript
// types/TTaskFilter.ts
import { ETaskFilter } from "../enums/ETaskFilter";
export type TTaskFilter = `${ ETaskFilter }`;
```

Note the **spaces inside the braces** of the template literal — this is required (see `labcorp-typescript-formatting.md`).

## Known String Values

When comparing values from a known finite set, use enums. Do not use raw string literals.
