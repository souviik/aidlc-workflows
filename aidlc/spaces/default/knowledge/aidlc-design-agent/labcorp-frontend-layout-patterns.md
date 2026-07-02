# Labcorp Design System — Layout Patterns

> **Layer**: frontend (Angular)
> **Source**: derived from `.cursor/rules/shared/labcorp-ui-design-system.mdc` layout sections and `.cursor/rules/shared/labcorp_design_system_particles.mdc` (in `ai-governance`)

Token values (breakpoints, spacing, containers) are defined in [labcorp-frontend-design-tokens.md](../aidlc-shared/labcorp-frontend-design-tokens.md). This file covers **when and how** to apply layout patterns in mockups and specs.

## Figma references

- **Size & spacing**: https://www.figma.com/design/yaQVpEFfD6ASpm0Pii5DXY/Labcorp-Bootstrap-v4?node-id=2-5
- **Grids & viewports**: https://www.figma.com/design/yaQVpEFfD6ASpm0Pii5DXY/Labcorp-Bootstrap-v4?node-id=2-6

## Breakpoints

Design key screens at the LDS breakpoint widths (**576, 768, 992, 1200, 1400px**). Document breakpoint-specific layout changes in mockups (stack → side-by-side, hide/show nav, etc.).

## Containers

Prefer `[lds-container]` in specs when the Angular directive applies — it wires container max-widths automatically.

## Grid

For complex 2D layouts, note when CSS Grid is acceptable outside the Bootstrap grid (requires ADR if it becomes a pattern).

## Spacing rhythm

Use the `$spacing-*` scale (0–14) for vertical rhythm between sections:

- **Within a card/form**: `$spacing-3`–`$spacing-4`
- **Between cards in a list**: `$spacing-5`–`$spacing-6`
- **Between page sections**: `$spacing-7`–`$spacing-8`
- **Hero regions**: `$spacing-9`+

In Figma, match spacing tokens to auto-layout gaps — do not use arbitrary pixel values.
