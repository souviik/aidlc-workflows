# Labcorp Frontend Notifications

> **Layer**: frontend (Angular)
> **Source**: derived from `.cursor/rules/shared/angular.mdc` `## Notifications` (in `ai-governance`)

## Use `ToastrService` (ngx-toastr)

All user-facing notifications go through `ngx-toastr`'s `ToastrService`. **Do not** use:

- `MatSnackBar` from Angular Material
- The browser's `alert()` / `confirm()` / `prompt()`
- Any custom toast or notification implementation

## Configuration

The application root imports `ToastrModule.forRoot()` with the project's `CustomToastComponent` and position `toast-bottom-right`:

```typescript
ToastrModule.forRoot({
  positionClass: "toast-bottom-right",
  toastComponent: CustomToastComponent,
})
```

This configuration is set once at the app root; do not re-configure per feature.

## API

Inject `ToastrService` and call the appropriate method:

```typescript
private readonly toastr = inject(ToastrService);

this.toastr.success("Saved");
this.toastr.error("Could not save. Try again.");
this.toastr.info("Your session will expire in 5 minutes.");
this.toastr.warning("This action cannot be undone.");
```

- `success()` — successful operations (save, delete, submit)
- `error()` — failures the user can do something about (retry, fix input)
- `info()` — neutral notifications (session expiry warnings, status changes)
- `warning()` — destructive or significant actions

## Save Operation Pattern

The canonical save-with-feedback pattern:

```typescript
save(): void {
  this.service.save(this.form.value).subscribe({
    next: () => {
      this.toastr.success("Saved");
      this.router.navigate([".."], { relativeTo: this.route });
    },
    error: () => {
      this.toastr.error("Could not save. Please try again.");
    },
  });
}
```

For destructive operations, show a confirmation UI (a modal component, not `confirm()`) before invoking the service call.

## Inline Errors vs Toast

- **Inline errors**: validation failures on individual form fields (use the form control's `errors` and a sibling error element).
- **Toast**: outcomes of completed actions (save success, delete success, network failure, server-side validation failure that does not map to a single field).

Do not show both for the same event. If a server response includes per-field errors, render them inline and skip the toast.

## Internationalization

Toast messages must reference the project's i18n key catalog, not be hardcoded strings, when the project ships in multiple locales:

```typescript
this.toastr.success(this.i18n.translate("toast.save.success"));
```

If the project is single-locale today, hardcoded English strings are acceptable but the developer flags them as "i18n later" in the unit's notes.
