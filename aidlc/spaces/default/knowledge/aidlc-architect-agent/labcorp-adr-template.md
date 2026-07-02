# Labcorp ADR Template

> **Layer**: cross-cutting (applies to architect decisions across frontend and backend)
> **Overrides**: framework `adr-template.md`

## Scope

Patterns the project's rules already mandate (e.g., "use standalone Angular components") do **not** need an ADR — they are pre-decided by the company's rules layer.

## Structure

Use the standard ADR structure (status, context, decision, consequences, alternatives, links), plus one required Labcorp field:

- **Layer**: `frontend | backend | both` — required so the ADR set can be filtered by concern.

## Labcorp Rules

- ADRs are numbered sequentially: `ADR-0001`, `ADR-0002`. Numbering does not reset per layer.
- Store ADRs under `docs/adrs/` in the project repo (not in the `lca-ai-kb` or `ai-governance` repos).
