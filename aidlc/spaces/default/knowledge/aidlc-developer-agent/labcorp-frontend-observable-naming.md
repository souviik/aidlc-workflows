# Labcorp Frontend Observable Naming

> **Layer**: frontend (Angular)
> **Source**: derived from `.cursor/rules/shared/angular.mdc` `## Observable Naming` (in `ai-governance`)

## Local Variables

The `$` suffix mandate applies to local variables holding observable references, not only to class properties:

```typescript
const filtered$ = items$.pipe(filter((i) => i.active));
```

## Subjects

When exposing a `Subject` (or `BehaviorSubject`) publicly, the public side is `.asObservable()` and uses the `$` suffix. The private subject keeps the `$` suffix as well, but is prefixed with an underscore to distinguish private from public:

```typescript
private readonly _state$ = new BehaviorSubject<TState>("idle");
readonly state$ = this._state$.asObservable();
```

(Or, more cleanly in new code, replace the public observable with a signal exposed via `toSignal(this._state$)`.)

## Signals Do Not Get `$`

Signals are not observables. They use plain names without the suffix:

```typescript
readonly count = signal(0);
readonly items = signal<IItem[]>([]);
readonly doubled = computed(() => this.count() * 2);
```

When converting an observable to a signal with `toSignal()`, the resulting signal **drops** the suffix:

```typescript
private readonly state$ = this.service.state$;
readonly state = toSignal(this.state$);
```
