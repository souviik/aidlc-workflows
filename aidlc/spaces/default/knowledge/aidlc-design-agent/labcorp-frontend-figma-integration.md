# Labcorp Design System — Figma Integration

> **Layer**: frontend (Angular)
> **Source**: derived from `.cursor/rules/shared/labcorp-ui-design-system.mdc` `## Figma Integration Guidelines` (in `ai-governance`)

**Figma file**: https://www.figma.com/design/yaQVpEFfD6ASpm0Pii5DXY/Labcorp-Bootstrap-v4

Token vocabulary for colors, spacing, and typography: [labcorp-frontend-design-tokens.md](../aidlc-shared/labcorp-frontend-design-tokens.md).

## Design tokens in Figma

- Color styles must match SCSS variable names (e.g. `primary-500`, `charcoal`)
- Include full 50–900 scales for each palette family
- Text styles must match heading/body scale from tokens
- Spacing tokens must align with `$spacing-*` / Bootstrap `$spacers`
- Name Figma tokens consistently with code — document mappings in component descriptions

## Component guidelines

- Components mirror `@labcorp/labcorp-ng-ui` structure (atoms / molecules / organisms)
- Include size variants: **sm**, **default**, **lg**
- Include state variants: default, hover, active, disabled, focus, loading, error, empty
- Use auto-layout for responsive-friendly components
- Match component names to Angular class names
- Document props and usage in Figma component descriptions

## Node IDs & MCP

Design Agent output should reference **Figma node IDs** from [labcorp-frontend-component-catalog.md](labcorp-frontend-component-catalog.md) so developers can pull design context via Figma MCP.

## Mockups

Rough mockups **must** name catalog components — no anonymous "button" or "input" placeholders.

## Hand-off to Developer

Each screen or component spec includes:

- Figma frame URL with `node-id`
- List of catalog components with variants and states
- Interaction notes (what happens on click, submit, error)
- Empty, loading, and error states explicitly designed
- UX acceptance criteria testable by Quality Agent
