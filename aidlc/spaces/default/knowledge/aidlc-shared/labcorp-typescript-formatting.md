# Labcorp TypeScript Formatting

> **Layer**: cross-cutting (applies to both frontend and backend agents)
> **Source**: derived from `.cursor/rules/shared/angular.mdc` and `.cursor/rules/shared/nestjs.mdc` (in `ai-governance`)

## Decorators

- Decorated properties are listed **before** regular properties in the class, with a newline between each decorated property.

```typescript
@Input()
required = true;

@Input()
title = "";

isLoading = false;
```

## Decorator Array Formatting

When decorators contain array properties, each array element must be on its own line for readability. Prepend `// prettier-ignore` above arrays to prevent auto-formatters from collapsing them.

```typescript
// prettier-ignore
@Component({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
```

## Control Flow Statements

Control flow keywords (`else`, `else if`, `catch`, `finally`) must appear on their own line — never on the same line as the closing brace of the preceding branch.

```typescript
if (a) {
  // ...
}
else if (b) {
  // ...
}
else {
  // ...
}

try {
  // ...
}
catch (e) {
  // ...
}
finally {
  // ...
}
```

## Return Statements

A newline must appear before any `return` statement that has preceding code in the same block.

```typescript
function compute(x: number): number {
  const doubled = x * 2;

  return doubled;
}
```

## Variable Declarations

There must be a newline between variable declarations and other code (non-declaration statements).

```typescript
const value = getValue();

processValue(value);
```

## Template Literal Interpolations

Template literal interpolations must include spaces inside the braces.

```typescript
const greeting = `Hello, ${ name }`;
export type TTaskFilter = `${ ETaskFilter }`;
```

Do **not** write `${name}` — the spaces are mandatory.
