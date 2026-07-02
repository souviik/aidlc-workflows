# Labcorp Frontend Styling Conventions

> **Layer**: frontend (Angular)
> **Source**: derived from `.cursor/rules/shared/angular.mdc` `## CSS Conventions` (in `ai-governance`)

## Global Styles

Global styles live in `client/src/styles/` and are imported through the project's root style entry (`styles.scss` or equivalent).

## Alphabetized Selectors

Selectors within a block are written **alphabetically**. The ordering rule applies to both top-level and nested rules.

```scss
.button {
  background: var(--color-primary);
  border: 1px solid var(--color-border);
  color: var(--color-on-primary);
  font-weight: 600;
  padding: 0.5rem 1rem;
}
```

## Variables and Tokens

- Prefer CSS custom properties (`var(--color-primary)`) over SCSS variables for runtime-themable values.
- SCSS variables are acceptable for static design tokens (spacing scale, breakpoints).
- Never hardcode color hexes, font sizes, or spacing values in component styles. Use the Labcorp Design System token vocabulary in [labcorp-frontend-design-tokens.md](../aidlc-shared/labcorp-frontend-design-tokens.md) and the usage rules in [labcorp-frontend-design-system-usage.md](labcorp-frontend-design-system-usage.md).
