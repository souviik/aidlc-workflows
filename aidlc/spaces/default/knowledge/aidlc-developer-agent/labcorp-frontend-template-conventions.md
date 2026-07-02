# Labcorp Frontend Template Conventions

> **Layer**: frontend (Angular)
> **Source**: derived from `.cursor/rules/shared/angular.mdc` `## Template Conventions`, `## Avoid ngClass`, `## Unnecessary Getters` (in `ai-governance`)

## Branch Placement

`@else if` and `@else` must appear on their **own line**, never on the same line as the closing `}` of the preceding branch.

```html
<!-- correct -->
@if (a) {
  ...
}
@else if (b) {
  ...
}
@else {
  ...
}

<!-- incorrect -->
@if (a) {
  ...
} @else if (b) {
  ...
} @else {
  ...
}
```

## Interpolation Spacing

Always include spaces inside interpolation braces:

```html
{{ value }}
{{ user.name }}
```

Never `{{value}}`.

## Attribute Ordering

Within each element, attributes are ordered alphabetically within these groups, in this order:

1. **Naked properties** (required, autofocus, disabled, readonly, etc.) — alphabetized
2. **HTML attributes** — `type` first for `<input>`, others alphabetized
3. **Angular directives** (`*ngIf` legacy, `ngClass`, etc.) — alphabetized — see deprecation note below
4. **Property bindings** `[property]` — alphabetized
5. **Event bindings** `(event)` — alphabetized
6. **Two-way bindings** `[(ngModel)]` — alphabetized

```html
<input
  autofocus
  disabled
  required
  type="text"
  id="username"
  name="username"
  [class.invalid]="hasError()"
  [value]="username()"
  (blur)="onBlur()"
  (input)="onInput($event)"
  [(ngModel)]="form.username"
/>
```

> Group 3 (structural directives) should be empty in new code — control flow has replaced them. The slot exists only for editing legacy templates.
