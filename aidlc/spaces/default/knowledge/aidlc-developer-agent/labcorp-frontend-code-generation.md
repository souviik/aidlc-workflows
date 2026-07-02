# Labcorp Frontend Code Generation

> **Layer**: frontend (Angular)
> **Source**: derived from `.cursor/rules/shared/angular.mdc` `## Components`, `## Services`, `## Signals` (in `ai-governance`)

When generating Angular code, follow these rules in addition to the framework's own code-generation guides.

## Components

- **Selector prefix**: use the project's selector prefix (typically `app-`); confirm by reading the project's `angular.json` or `.eslintrc.json`.
- **File pair**: each component is a `.component.ts` + `.component.html` + `.component.scss`. Avoid inline templates and inline styles unless the template is fewer than 5 lines.

### Component shape

```typescript
import { ChangeDetectionStrategy, Component, input, output, signal } from "@angular/core";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [/* dependencies */],
  selector: "app-feature-thing",
  standalone: true,
  styleUrl: "./feature-thing.component.scss",
  templateUrl: "./feature-thing.component.html",
})
export class FeatureThingComponent {
  // Inputs (decorated, alphabetized)
  readonly disabled = input(false);
  readonly title = input.required<string>();

  // Outputs (decorated, alphabetized)
  readonly clicked = output<void>();

  // Regular properties (private, alphabetized)
  private readonly state = signal<TState>("idle");
}
```

Note the `@Component` decorator property order is alphabetical (see `labcorp-frontend-template-conventions.md`).

## Forbidden in Generated Code

- `ngClass` for ≤2 classes — use `[class.name]="condition"`; reserve `ngClass` for 3+ classes
- `MatSnackBar`, `alert()`, `confirm()`, custom notification implementations — use `ToastrService` (see `labcorp-frontend-notifications.md`)
- `console.log`, `console.debug`, etc. in shipped code — strip before completing the unit
- Mutating `@Input()` object/array references in place — always replace immutably
- `track item` (object reference) in `@for` — track by `item.id` or a similar primitive

## Mandated in Generated Code

- `private readonly` for all constructor-injected services (when constructor DI is used instead of `inject()`)
- Observable property names end with `$`
- Snyk scan after generation; loop until clean (see [labcorp-security-baseline.md](../aidlc-shared/labcorp-security-baseline.md))
- Path aliases for cross-feature imports (no `../../../`)
