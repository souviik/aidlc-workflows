# Labcorp Design System — Developer Usage

> **Layer**: frontend (Angular)
> **Source**: derived from `.cursor/rules/shared/labcorp-ui-design-system.mdc`, `.cursor/rules/shared/labcorp_design_system_tokens.mdc` (in `ai-governance`)

Token reference: [labcorp-frontend-design-tokens.md](../aidlc-shared/labcorp-frontend-design-tokens.md). Component selection comes from Design Agent specs — see [labcorp-frontend-component-catalog.md](../aidlc-design-agent/labcorp-frontend-component-catalog.md).

## Packages

```json
"@labcorp/labcorp-bootstrap": "<exact-version>",
"@labcorp/labcorp-ng-ui": "<exact-version>"
```

Pin exact versions — no `^` or `~`.

## Global styles

Import the theme in `client/src/styles/styles.scss`:

```scss
@import '@labcorp/labcorp-bootstrap/scss/labcorp-bootstrap';
```

SCSS source layout in the package:

- `_variables.scss` — design tokens
- `_fonts.scss` — font faces
- `_required.scss` — Bootstrap core
- Component partials: `_buttons.scss`, `_forms.scss`, `_navbar.scss`
- `mixins/`, `themes/` (light, dark, condensed), `helpers/`

## Using components

Import from `@labcorp/labcorp-ng-ui` following the atomic structure:

```
@labcorp/labcorp-ng-ui/lib/components/
├── atoms/
├── molecules/    # button, badge, chip, spinner, form controls, …
└── organisms/    # navbar, sidebar, footer, …
```

Rules:

1. **Use catalog components** — do not rebuild molecules that exist in `labcorp-ng-ui`.
2. **Bootstrap utilities first** — `class="btn btn-primary p-4 text-sm"` before custom SCSS.
3. **Semantic colors** — `$primary`, `$danger`, etc. — not brand names (`$azure`).
4. **Icons** — Material Symbols (Rounded): `<span class="material-symbols-rounded">icon_name</span>`.

## Component SCSS

Follow [labcorp-frontend-styling-conventions.md](labcorp-frontend-styling-conventions.md) plus:

- Import tokens from `@labcorp/labcorp-bootstrap` — never hardcode hex, spacing, font-size, radius, shadow, z-index, or duration literals.
- Prefer utility classes over component SCSS for one-off spacing/color.
- Max one level of SCSS nesting.
- `$enable-shadows` is false globally — apply `$shadow-*` explicitly when needed.

Run `npm run lint:styles` after every SCSS change.

## Themes

- **Light** is default — verify all new UI in light theme.
- **Dark** / **Condensed** — use theme SCSS and CSS custom properties; do not fork component styles per theme without an ADR.

## Assets

- Static assets: `client/src/assets/` (`images/`, `icons/`, `fonts/`, `videos/`)
- Kebab-case filenames; optimize before commit
- Template reference: `/assets/images/logo.png`
- Fonts and Material Symbols load via CDN / Google Fonts as configured in the app

## Notifications

User-facing feedback uses `ngx-toastr` `ToastrService` — see [labcorp-frontend-notifications.md](labcorp-frontend-notifications.md). Do not use LDS toast Figma components as custom implementations; wire through the app toast service.

## Figma → code workflow

When implementing from a Design Agent spec:

1. Read the Figma node URL from the spec.
2. Use Figma MCP / Code Connect mappings when available.
3. Map each spec'd component to the matching `labcorp-ng-ui` import.
4. If no mapping exists, stop and escalate — do not invent a one-off UI component.

## Verification

After implementation:

- [ ] `npm run lint:styles` passes
- [ ] No hardcoded design literals in component SCSS
- [ ] Catalog components used where spec'd
- [ ] Responsive behavior matches spec at sm/md/lg
- [ ] Snyk scan clean (per [labcorp-security-baseline.md](../aidlc-shared/labcorp-security-baseline.md))
