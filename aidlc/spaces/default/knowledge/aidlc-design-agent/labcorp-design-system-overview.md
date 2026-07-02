# Labcorp Bootstrap Design System — Overview

> **Layer**: frontend (Angular)
> **Source**: derived from `.cursor/rules/shared/labcorp-ui-design-system.mdc` (in `ai-governance`)

All Angular UI applications use the **Labcorp Bootstrap Design System (LDS)** — Angular 18+, Bootstrap 5, custom Labcorp theme, atomic design.

## Packages

| Package | Role |
|---|---|
| `@labcorp/labcorp-bootstrap` | SCSS tokens, Bootstrap theme overrides, global styles |
| `@labcorp/labcorp-ng-ui` | Angular component library (`lib/components/`) |

## Figma & documentation

- **Figma file**: https://www.figma.com/design/yaQVpEFfD6ASpm0Pii5DXY/Labcorp-Bootstrap-v4
- **Colors**: https://lcbs-dev.apps.ocpdtq.labcorp.com/documentation/content/colors
- **Typography**: https://lcbs-dev.apps.ocpdtq.labcorp.com/documentation/content/typography
- **Breakpoints**: https://lcbs-dev.apps.ocpdtq.labcorp.com/documentation/layout/breakpoints
- **Containers**: https://lcbs-dev.apps.ocpdtq.labcorp.com/documentation/layout/containers
- **Grid**: https://lcbs-dev.apps.ocpdtq.labcorp.com/documentation/layout/grid

## Stack

- **UI**: Angular 18+, standalone components
- **Styling**: Bootstrap 5 + SCSS
- **Icons**: Material Symbols (Rounded) — `<span class="material-symbols-rounded">icon_name</span>` (sizes: sm, default, lg)
- **Fonts**: Source Sans 3 / Source Sans Pro via Google Fonts

## Atomic design structure

Components in `@labcorp/labcorp-ng-ui/lib/components/` follow atomic design:

| Level | Examples | Design responsibility |
|---|---|---|
| **atoms/** | icon, label | Typography, icons, effects — map to Figma atoms |
| **molecules/** | button, badge, chip, spinner, form controls | Select from catalog; specify variant and state |
| **organisms/** | navbar, sidebar, footer | Compose molecules; define layout and breakpoints |

When specifying mockups or component specs, **name the catalog component** (e.g. `LcButton primary`, `LcNavbar`) rather than inventing one-off UI.

## Themes

| Theme | Status |
|---|---|
| Light | Default — all specs must work here first |
| Dark | Optional — separate token sets for bg/text/border |
| Condensed | Optional — reduced spacing scale |

Document theme-specific choices in component specs when they differ from light.

## Design principles

1. **Tokens over literals** — see [labcorp-frontend-design-tokens.md](../aidlc-shared/labcorp-frontend-design-tokens.md) for the full token vocabulary.
2. **Catalog first** — extend existing components before proposing new ones (new components require design-system team alignment).

## Agent hand-off

- **To Architect**: page-level information architecture, feature boundaries — not visual component selection.
- **To Developer**: component spec per [component-spec-template](https://github.com/awslabs/aidlc-workflows/blob/v2/core/knowledge/aidlc-design-agent/component-spec-template.md) with named LDS components, states, and responsive behavior.
