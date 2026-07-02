# Labcorp Frontend NFR Patterns

> **Layer**: frontend (Angular)
> **Source**: derived from `.cursor/rules/shared/angular.mdc` `## Signals`, `## DRY Rules`, `## Components` (in `ai-governance`)

This file covers the architect's NFR design choices for the Angular layer: state management, change detection, performance, and maintainability.

## Change Detection

OnPush is the default. The architect documents any exceptions in an **ADR**.

## Observability

- Log through the project's `LoggerService` — never `console.log` in shipped code.
- Front-end metrics (Web Vitals, route load time) are emitted from a single shared service; not re-specified per feature.

## Error Boundaries

- Component-level errors propagate to the project's `GlobalErrorHandler` provider.
- Error messaging surfaces per [labcorp-frontend-notifications.md](../aidlc-developer-agent/labcorp-frontend-notifications.md).

## NFR Hand-Off Checklist

Before code generation, the architect verifies:

- [ ] State boundary specified (signals vs observables)
- [ ] Change detection annotated on each component (OnPush by default; deviations call out an ADR)
- [ ] Computed view state listed explicitly (no template-side getters/functions)
- [ ] `@for` track expressions specified
- [ ] Observability and error-handling expectations stated
