# Labcorp Design System — Design Tokens

> **Layer**: frontend (Angular) — loaded by Design, Developer, and Architect agents
> **Source**: derived from `.cursor/rules/shared/labcorp_design_system_tokens.mdc` (in `ai-governance`)

The canonical token *vocabulary* lives in `design/tokens.json`. Compiled tokens — Sass variables, maps, and Bootstrap overrides — ship in the vendored **`@labcorp/labcorp-bootstrap`** package and are pulled into the app through `client/src/styles/styles.scss` (`@import '@labcorp/labcorp-bootstrap/scss/labcorp-bootstrap'`).

Prefer a Bootstrap/LDS utility class; reach for a `$token` only inside a custom SCSS partial. **Never** hard-code colors, spacing, font sizes, or shadows — `npm run lint:styles` fails the build on literals that already have a token.

Live reference: `/styleguide` route in the running app.

## Workflow

1. Need a color, spacing step, type size, radius, or shadow? Find the matching `$token` or utility class below.
2. Use the utility class first (e.g. `class="bg-primary p-4 text-sm"`); reach for the `$token` only inside a genuine custom SCSS partial.
3. Run `npm run lint:styles` — it fails on any literal that already has a `$token`.

## Color

### Palettes (stops `50`–`900`; base = `500`)

| Palette | Base | Notes |
|---|---|---|
| `$primary-*` | `#3a5ce9` (azure) | Bootstrap `primary`. Brand action color. |
| `$secondary-*` | `#2998e3` (cerulean) | Bootstrap `secondary`. |
| `$success-*` | `#0d820d` | Bootstrap `success`. |
| `$danger-*` | `#c5203c` | Bootstrap `danger`. |
| `$warning-*` | `#f5bc0f` | Bootstrap `warning`. |
| `$info-*` | `#6c2fac` (lavender) | Bootstrap `info`. |
| `$gray-*` | `#918f8f` | Neutral ramp. `$gray-100` = light, `$gray-900` = dark. |
| `$navy-*` | `#1a2188` | Header/footer navy strip. |
| `$orange-*` | `#e36816` | Accent. |
| `$turquoise-*` | `#4cd5f7` | Accent. |
| `$salmon-*` | `#f7758c` | Accent. |
| `$seafoam-*` | `#b4f6f5` | Accent. |

`$charcoal` has tint stops (`$charcoal-25`, `$charcoal-50`, `$charcoal-65`, `$charcoal-75`) plus base `#231f20`. Use for body text and headings.

Each palette is also a Sass map (`$primary-palette`, `$gray-palette`, …) — use with `map.get()` when you need a stop programmatically.

### Semantic aliases

| Token | Resolves to | Use for |
|---|---|---|
| `$primary` / `$secondary` / `$success` / `$danger` / `$warning` / `$info` | the `-500` stop | Buttons, alerts, badges, focus states. |
| `$light` / `$dark` | `$gray-100` / `$gray-900` | Bootstrap light/dark theme slots. |
| `$body` | `#231f20` (`$charcoal`) | Default text color. |
| `$body-bg` | `#ffffff` | Page background. |
| `$link` / `$link-hover` | `$primary` / `$primary-700` | Anchors. |
| `$border` | `$gray-200` | Card/input borders, dividers. |
| `$muted` | `$gray-600` | Secondary/help text. |
| `$focus-ring` | `$primary-300` | Focus outlines. |

`$theme-colors` drives Bootstrap utilities (`.bg-primary`, `.text-danger`, `.btn-navy`, `.border-orange`, etc.).

## Spacing

Base unit: `1rem` = `16px`.

| Token | Value | Typical use |
|---|---|---|
| `$spacing-0` | `0` | Reset. |
| `$spacing-1` | `0.25rem` (4px) | Icon gap, fine inset. |
| `$spacing-2` | `0.5rem` (8px) | Tight chip/badge padding. |
| `$spacing-3` | `0.75rem` (12px) | Form field row gaps. |
| `$spacing-4` | `1rem` (16px) | Default gutter, card padding. |
| `$spacing-5` | `1.5rem` (24px) | Section padding (small). |
| `$spacing-6` | `2rem` (32px) | Card-to-card vertical gap. |
| `$spacing-7` | `3rem` (48px) | Section padding (default). |
| `$spacing-8` | `4rem` (64px) | Section padding (large). |
| `$spacing-9`–`$spacing-14` | up to `32rem` | Hero vertical rhythm, large regions. |

Bootstrap utilities follow the same scale — `class="p-4 mt-7 gap-5"` resolves through `$spacers` (0…14).

## Typography

- **Sans-serif**: `$font-family-sans-serif` — `'Source Sans 3', 'Source Sans Pro', system-ui, …`
- **Monospace**: `$font-family-monospace` — use `<code>` / `.font-monospace`
- **Weights**: 200, 300, 400, 600, 700, 900
- **Sizes**: `$font-size-xs` through `$font-size-3xl` (0.75rem–2.25rem)

| When you want… | Use |
|---|---|
| Page title | `<h1>` or `.h1` — 2.25rem semibold |
| Section title | `<h2>` — 1.875rem semibold |
| Card title | `<h3>` — 1.5rem regular |
| Body copy | plain `<p>` |
| Captions | `.text-sm` / `<small>` |
| Fine print | `.text-xs` |

## Radius, shadows, motion, z-index

| Category | Tokens |
|---|---|
| Radius | `$radius-sm` (0.25rem), `$radius-md` (0.5rem), `$radius-lg` (1rem), `$radius-pill` (50rem), `$radius-circle` (50%) |
| Shadows | `$shadow-sm`, `$shadow-md`, `$shadow-default`, `$shadow-lg` — apply explicitly; `$enable-shadows` is `false` globally |
| Motion | `$duration-fast` 120ms, `$duration-base` 200ms, `$duration-slow` 320ms; `$easing-standard`, `$easing-emphasized` |
| Z-index | `$zindex-dropdown` 1000 … `$zindex-toast` 1090 — never use literal layer numbers |

## Breakpoints & containers

`$grid-breakpoints`: `xs 0`, `sm 576px`, `md 768px`, `lg 992px`, `xl 1200px`, `xxl 1400px`.

`$container-max-widths`: `sm 540`, `md 720`, `lg 960`, `xl 1140`, `xxl 1320`.

Prefer Bootstrap responsive utilities and the `[lds-container]` directive over hand-rolled containers.

## SCSS checklist

- No literal hex, rem/px spacing, font-size, border-radius, shadow, z-index, or duration when a `$token` exists.
- Genuinely new tokens are a design-system change in `@labcorp/labcorp-bootstrap`; record vocabulary in `design/tokens.json`.
- For CSS `var()` fallbacks: `font-size: var(--my-app-size, #{$font-size-md});`
- One-off exceptions: `// lds-tokens-allow` on the line (code-review red flag).

## Automated check

`npm run lint:styles` (`scripts/lint-styles.mjs`) scans `client/src/**/*.scss` and flags literals matching existing tokens. Also invoked from `scripts/post-merge.sh`.
