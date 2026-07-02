# Labcorp Frontend Class Organization

> **Layer**: frontend (Angular)
> **Source**: derived from `.cursor/rules/shared/angular.mdc` `## Class Organization` (in `ai-governance`)

## Member Order

Members of every Angular class (component, directive, service, pipe) are organized in this exact order:

1. **Decorated properties** (`@ViewChild`, `@Input` if still used, `@Output` if still used, etc.) — grouped by access modifier, alphabetized within each group
2. **Regular properties** — grouped by access modifier (public → protected → private), alphabetized within each group
3. **Constructor**
4. **Lifecycle methods** — in Angular's lifecycle order (see below)
5. **Public methods** — alphabetized
6. **Protected methods** — alphabetized
7. **Private methods** — alphabetized

## Access Modifier Rules

- **Omit `public`** — rely on the implicit default access level. Never write `public foo()`.
- **Use `protected`** for members accessed by subclasses.
- **Use `private`** for everything not accessed in the template and not part of the subclass contract.
- **Template-accessed members** stay default-public (no modifier). The Angular template can only read default-public members; marking them `private` breaks compilation.
- **Lifecycle hooks** stay default-public regardless of whether the template references them.

## Alphabetization

Properties and methods are alphabetized within each access modifier group, except when programmatic order is required (e.g., one property initializer depends on another declared above it).

```typescript
export class ExampleComponent {
  // Decorated, default-public, alphabetized
  readonly disabled = input(false);
  readonly title = input.required<string>();

  // Decorated, private, alphabetized
  @ViewChild("scroller")
  private scroller!: ElementRef;

  // Regular, default-public, alphabetized
  readonly errorMessage = signal<string | null>(null);
  readonly isLoading = signal(false);

  // Regular, private, alphabetized
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  constructor() {
    // ...
  }

  ngOnInit(): void {
    // ...
  }

  ngOnDestroy(): void {
    // ...
  }

  // Default-public methods, alphabetized
  reset(): void { /* ... */ }
  submit(): void { /* ... */ }

  // Private methods, alphabetized
  private mapError(): IApplicationError { /* ... */ }
  private validate(): boolean { /* ... */ }
}
```

## Lifecycle Method Placement

Lifecycle methods sit directly after the constructor, **before** all other methods, in Angular's lifecycle order:

1. `ngOnChanges`
2. `ngOnInit`
3. `ngDoCheck`
4. `ngAfterContentInit`
5. `ngAfterContentChecked`
6. `ngAfterViewInit`
7. `ngAfterViewChecked`
8. `ngOnDestroy`

Only include the hooks the class actually needs. Do not stub unused hooks.

## Constructor Parameters

Constructor parameters are `private readonly` by default. Drop `readonly` only when the field must be reassigned. Drop `private` only when the field must be accessed outside the class (rare; usually a smell).

```typescript
constructor(
  private readonly http: HttpClient,
  private readonly router: Router,
) {}
```

In new code prefer `inject()` (see `labcorp-frontend-code-generation.md`) so the constructor stays empty.
