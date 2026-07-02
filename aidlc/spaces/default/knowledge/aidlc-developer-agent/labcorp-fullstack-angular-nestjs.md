# Full-Stack Guide: Angular + NestJS

Worked reference for a LabCorp web application: **Angular** SPA with the **Labcorp Design System** (`@labcorp/labcorp-bootstrap`, `@labcorp/labcorp-ng-ui`), backed by a **NestJS** REST API. Use when `tech-stack-decisions.md` or `project.md` → `## Tech Stack` specifies Angular + NestJS.

This file is stack-specific only: full-stack topology, the Angular ↔ NestJS contract seam, and a worked Orders feature. **Angular code conventions, NestJS code conventions, design-system rules, and the brownfield scan** all live in dedicated modular files — see [See also](#see-also).

For the .NET variant, see [labcorp-fullstack-angular-dotnet.md](labcorp-fullstack-angular-dotnet.md). For stack catalogs, see [labcorp-frontend-stacks.md](labcorp-frontend-stacks.md) and [labcorp-backend-stacks.md](labcorp-backend-stacks.md).

---

## Stack at a Glance

| Layer | Technology | Role |
|-------|------------|------|
| UI framework | Angular (TypeScript), standalone + OnPush | SPA routing, components, forms, HTTP client |
| UI styling | `@labcorp/labcorp-bootstrap` | LabCorp Bootstrap theme, tokens, utilities |
| UI components | `@labcorp/labcorp-ng-ui` | Atoms, molecules, organisms — prefer catalog over custom |
| Notifications | `ngx-toastr` (`ToastrService`) | User-facing success/error/info/warning |
| API | NestJS (TypeScript) | REST endpoints, validation, auth, business logic |
| Data | TypeORM / Prisma / Knex (project choice) | Relational persistence and migrations |
| Contract | DTOs (server-authored) | Angular `I{Name}` interfaces mirror NestJS DTO shapes |

**Default versions:** Pin **exact** versions for `@labcorp/*` and `@nestjs/*` packages — no `^` or `~`. Align Angular and Node LTS to org standards — `[TBD — Platform/EA]`.

---

## Solution Layout

```
<repo-root>/
├── client/                            # Angular — all UI code here only
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/
│   │   │   ├── shared/
│   │   │   └── features/              # one folder per feature (lazy-loaded)
│   │   ├── assets/
│   │   └── styles/styles.scss
│   ├── angular.json
│   └── package.json
├── server/                            # NestJS — all API code here only
│   ├── src/
│   │   ├── main.ts                    # bootstrap, global pipes/filters/middleware
│   │   ├── app.module.ts
│   │   └── {feature}/                 # one folder per bounded context
│   │       ├── {feature}.module.ts
│   │       ├── controllers/
│   │       ├── services/
│   │       ├── repositories/
│   │       ├── dto/
│   │       ├── interfaces/
│   │       ├── types/
│   │       ├── enums/
│   │       └── constants/
│   ├── test/
│   └── package.json
└── package.json                       # (optional) workspace root for tooling
```

**Rules:**

- Never write Angular under `server/` or NestJS under `client/`.
- A unit of work spans both layers: `client/src/app/features/{name}/` plus matching `server/src/{name}/`.
- Co-design HTTP contracts: Angular services consume what NestJS controllers expose. The **backend DTO is the source of truth**.
- Do not add a third `shared/` workspace without an ADR.
- Every feature ships with its own routing module and loads via `loadChildren`.

Full topology rationale: [labcorp-monorepo-layout.md](../aidlc-shared/labcorp-monorepo-layout.md).

For NestJS architecture, module shape, controller/service/repository patterns, bootstrap, and the canonical error envelope: [labcorp-backend-nestjs.md](../aidlc-shared/labcorp-backend-nestjs.md).

---

## Front-to-Back Integration

| Concern | `client/` | `server/` |
|---------|-----------|-----------|
| Error envelope | `catchError` → typed `IApplicationError` | Global exception filter — see [labcorp-backend-nestjs.md](../aidlc-shared/labcorp-backend-nestjs.md#error-handling-architecture) |
| Action feedback | `ToastrService` | N/A |
| API contract | `I{Name}` interfaces in `client/src/app/features/{name}/interfaces/` | `Create{Entity}Dto`, `{Entity}ResponseDto` in `server/src/{feature}/dto/` |

**Local dev:**

```bash
cd server && npm run start:dev    # Terminal 1 — Nest watch on :3000
cd client && ng serve              # Terminal 2 — Angular dev server on :4200
```

`client/proxy.conf.json` proxies `/api` to `http://localhost:3000`:

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}
```

---

## Worked Example: Orders Feature (Angular)

This example shows the Angular side of one feature unit. The Angular code follows [labcorp-frontend-code-generation.md](labcorp-frontend-code-generation.md); the matching NestJS feature follows [labcorp-backend-nestjs.md](../aidlc-shared/labcorp-backend-nestjs.md).

**Interface** mirroring the server DTO — `client/src/app/features/orders/interfaces/IOrder.ts`:

```typescript
export interface IOrder {
  createdAt: string;
  customerId: string;
  id: string;
  notes: string;
  status: TOrderStatus;
}
```

**Service** — `client/src/app/features/orders/services/order.service.ts`:

```typescript
@Injectable({ providedIn: "root" })
export class OrderService {
  private readonly api = inject(ApiConfigService);
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${ this.api.baseUrl }/api/orders`;

  getOrders(): Observable<IOrder[]> {
    return this.http.get<IOrder[]>(this.baseUrl).pipe(
      catchError((error: HttpErrorResponse) =>
        throwError(() => this.mapError(error)),
      ),
    );
  }

  private mapError(error: HttpErrorResponse): IApplicationError {
    return {
      message: error.error?.message ?? "An unexpected error occurred",
      status: error.status,
    };
  }
}
```

**Component** — `client/src/app/features/orders/components/order-list/order-list.component.ts`:

```typescript
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { RouterLink } from "@angular/router";
import { ToastrService } from "ngx-toastr";

import { IOrder } from "../../interfaces/IOrder";
import { OrderService } from "../../services/order.service";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink],
  selector: "app-order-list",
  standalone: true,
  styleUrl: "./order-list.component.scss",
  templateUrl: "./order-list.component.html",
})
export class OrderListComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly toastr = inject(ToastrService);

  readonly hasOrders = computed(() => this.orders().length > 0);
  readonly isLoading = signal(true);
  readonly orders = signal<IOrder[]>([]);

  ngOnInit(): void {
    this.loadOrders();
  }

  private loadOrders(): void {
    this.isLoading.set(true);

    this.orderService.getOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastr.error("Could not load orders. Please try again.");
      },
    });
  }
}
```

**Template** — `client/src/app/features/orders/components/order-list/order-list.component.html`:

```html
<div class="container-fluid py-4">
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h1 class="h3 mb-0">Orders</h1>
    <a class="btn btn-primary" routerLink="new">New order</a>
  </div>

  @if (isLoading()) {
    <div class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading</span>
      </div>
    </div>
  }
  @else if (!hasOrders()) {
    <p class="text-muted">No orders found.</p>
  }
  @else {
    <div class="table-responsive">
      <table class="table table-striped table-hover align-middle">
        <thead class="table-light">
          <tr>
            <th scope="col">Order ID</th>
            <th scope="col">Status</th>
            <th scope="col">Created</th>
            <th scope="col"></th>
          </tr>
        </thead>
        <tbody>
          @for (order of orders(); track order.id) {
            <tr>
              <td>{{ order.id }}</td>
              <td><span class="badge text-bg-secondary">{{ order.status }}</span></td>
              <td>{{ order.createdAt | date:'medium' }}</td>
              <td class="text-end">
                <a class="btn btn-sm btn-outline-primary" [routerLink]="[order.id]">View</a>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  }
</div>
```

---

## Security Checklist

- [ ] JWT from org IdP; tokens not in `localStorage` unless approved
- [ ] PHI masked in logs
- [ ] Snyk clean on both `client/` and `server/`

See [labcorp-security-standards.md](../aidlc-devsecops-agent/labcorp-security-standards.md) and [labcorp-hipaa-technical-safeguards.md](../aidlc-compliance-agent/labcorp-hipaa-technical-safeguards.md).

---

## When to Use This Guide

**Use when:** Angular + NestJS, Labcorp Design System, `client/` + `server/` monorepo with both workspaces in TypeScript.

**Prefer a different pattern when:** Angular + .NET ([labcorp-fullstack-angular-dotnet.md](labcorp-fullstack-angular-dotnet.md)), React ([labcorp-frontend-stacks.md](labcorp-frontend-stacks.md)), or server-rendered Razor was selected.

---

## See Also

- [labcorp-frontend-code-generation.md](labcorp-frontend-code-generation.md) — Angular standalone, OnPush, signals, `inject()`
- [labcorp-frontend-design-system-usage.md](labcorp-frontend-design-system-usage.md) — LDS packages and tokens
- [labcorp-backend-nestjs.md](../aidlc-shared/labcorp-backend-nestjs.md) — NestJS module shape, controllers, services, bootstrap, error envelope
- [labcorp-monorepo-layout.md](../aidlc-shared/labcorp-monorepo-layout.md) — workspace topology, lazy loading
- [labcorp-package-management.md](../aidlc-shared/labcorp-package-management.md) — exact versions only
- [labcorp-fullstack-angular-dotnet.md](labcorp-fullstack-angular-dotnet.md) — .NET variant
