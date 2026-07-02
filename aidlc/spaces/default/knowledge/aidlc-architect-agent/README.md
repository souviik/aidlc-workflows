# Architect Agent Knowledge

Markdown files in this directory customize `aidlc-architect-agent` behavior for Labcorp projects.

Files here are loaded at step 5 of the knowledge loading order, after built-in methodology.

## Files in this directory

- [labcorp-adr-template.md](labcorp-adr-template.md) — ADR template and authoring rules
- [labcorp-frontend-feature-design.md](labcorp-frontend-feature-design.md) — Angular feature scaffolding and component decomposition
- [labcorp-frontend-api-contracts.md](labcorp-frontend-api-contracts.md) — typed HTTP contracts on the client side
- [labcorp-frontend-nfr-patterns.md](labcorp-frontend-nfr-patterns.md) — signals, DRY, performance guardrails, observability
- [labcorp-microservices-patterns.md](labcorp-microservices-patterns.md) — service decomposition, communication patterns

## Related

- Shared cross-cutting rules: [`../aidlc-shared/`](../aidlc-shared/) — monorepo layout, TypeScript conventions, NestJS guide
- Developer execution rules: [`../aidlc-developer-agent/`](../aidlc-developer-agent/) — Angular code generation, fullstack guides
