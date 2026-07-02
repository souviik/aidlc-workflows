# Labcorp Frontend API Contracts

> **Layer**: frontend (Angular side of the client/server boundary)
> **Source**: derived from `.cursor/rules/shared/angular.mdc` `## Services` (in `ai-governance`)

This file covers the architect's responsibilities for HTTP contracts **as the frontend consumes them**. The backend authoring side (controller, DTO, validation) is covered in [labcorp-backend-nestjs.md](../aidlc-shared/labcorp-backend-nestjs.md). For language-agnostic REST/GraphQL contract shape, see the placeholder `api-design-guide.md`.

## Interfaces & Naming

- Response interfaces live in the feature's `interfaces/` directory, e.g. `client/src/app/features/orders/interfaces/IOrder.ts`.
- Request payloads use a separate `I{Verb}{Entity}Request` interface (e.g., `ICreateOrderRequest`).
- The **backend DTO is the source of truth**; the frontend interface mirrors it. The architect verifies alignment at design time.

## Error Mapping

The architect specifies which features need bespoke error mapping vs which rely on a shared `errorMapper` service.

## Pagination

Paginated endpoints use the prescribed `IPaginatedResponse<T>` envelope:

```typescript
// interfaces/IPaginatedResponse.ts
export interface IPaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
```

## Hand-Off Checklist

Before code generation, the architect verifies:

- [ ] Every consumed endpoint has a corresponding service method signature
- [ ] Request and response interfaces are named and listed for the developer to create
- [ ] Error mapping strategy is explicit (shared mapper vs feature-specific)
- [ ] Pagination shape, if any, is documented
- [ ] Auth requirements (tokens, headers, interceptors) are noted
