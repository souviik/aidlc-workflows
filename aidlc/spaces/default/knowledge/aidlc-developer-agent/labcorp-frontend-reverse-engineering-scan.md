# Labcorp Frontend Reverse Engineering Scan

> **Layer**: frontend (Angular)
> **Source**: net-new — defines what to extract from an existing Angular client during AI-DLC's Reverse Engineering "Code Scan" step

When the developer agent runs the Reverse Engineering code scan against the `client/` workspace, the scan output must include the following artifacts for the architect to synthesize into an architectural model.

## Workspace Discovery

- Detect the Angular CLI version (`angular.json`, `package.json` `@angular/core`)
- Detect the package manager (npm / yarn / pnpm) by lockfile presence
- Detect any nx / Lerna workspace configuration
- List all `angular.json` projects (apps and libraries)
- Note the active build configuration and output paths

## Feature Inventory

For each folder under `client/src/app/features/`:

- Feature name (folder name)
- Standalone vs NgModule-based (count of each, with the per-file split)
- Routing module name and the parent route's `loadChildren` reference
- Sub-folders present (components, services, interfaces, types, enums, constants, directives)
- Sub-folders missing (signals incomplete scaffolding)

## Component Inventory

For each component file under `client/src/app/`:

- File path
- Class name
- Selector
- `standalone: true | false`
- `changeDetection`: OnPush / Default / not specified
- Inputs (name and type)
- Outputs (name and type)
- Whether the template uses `*ngIf` / `*ngFor` / `*ngSwitch` (legacy) or `@if` / `@for` / `@switch` (modern)
- Whether the template invokes getters or component methods directly (anti-pattern)

## Service Inventory

For each service:

- File path
- Class name
- `providedIn` scope (`root`, component-specific, not provided)
- HTTP endpoints consumed (URL pattern, HTTP method, response type if typed)
- Whether `catchError` is wired into HTTP pipelines
- Whether the service uses signals, observables, or both for state

## State Management Inventory

- Per-feature: which mechanism is in use (signals, RxJS subjects, NgRx, Akita, custom)
- Whether any feature mixes mechanisms (a smell)
- Global state primitives (root-scoped services exposing reactive state)

## Routing Topology

Reconstruct the route tree:

- Top-level routes
- Lazy-loaded children
- Guards (canActivate, canMatch, etc.) attached to each route
- Resolvers attached to each route

## Style Inventory

- Component styles using SCSS vs plain CSS (count of each; plain CSS is a deviation)
- Use of `:host` for layout (deviation)
- Encapsulation overrides (`None` / `ShadowDom`)
- Hardcoded color hexes or font-size values (count per file)

## Dependency Inventory

Parse `client/package.json`:

- All `dependencies` and `devDependencies` with their exact versions
- Flag any entry using `^` or `~` (deviation from `labcorp-package-management.md`)
- Flag any duplicate transitive Angular packages (Angular ecosystem fragmentation)
- Flag any package with known high-severity advisories (from Snyk results)

## Anti-Pattern Flagging

Surface counts and locations of:

- `*ngIf` / `*ngFor` / `*ngSwitch` usage in templates
- `ngClass` with 2 or fewer classes (should be `[class.name]`)
- Method calls or getters in template interpolations / bindings
- `MatSnackBar`, `alert()`, `confirm()` usage
- `console.log` and other `console.*` calls
- `any` type annotations
- Constructor parameters missing `private readonly`
- Observables without the `$` suffix
- `track item` (object reference) in `@for` loops
- Components without `changeDetection: ChangeDetectionStrategy.OnPush`

## Output Format

Produce the scan as a structured report the architect-agent can consume in its synthesis step. The exact file/format is determined by the framework's RE stage protocol; this file specifies **what** to capture, not **how** to serialize it.

Each item should include:

- A category (one of the inventories above)
- A file path (relative to repo root)
- A line range when applicable
- A short factual finding (one sentence)
- A severity tag: `info`, `deviation`, `anti-pattern`
