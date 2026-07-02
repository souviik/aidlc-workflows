# Labcorp Backend — NestJS Best Practices

> **Layer**: backend (NestJS server under `server/`)
> **Source**: derived from `.cursor/rules/shared/nestjs.mdc` and NestJS sections of `.cursor/rules/shared/angular-nest-monorepo.mdc` (in `ai-governance`)
> **Audience**: both architect-agent and developer-agent

This file is the consolidated backend knowledge layer for NestJS work in Angular + NestJS monorepos. Cross-cutting TypeScript rules (naming, formatting, package versions, security scanning) live in the other `aidlc-shared/labcorp-*.md` files and apply here too.

## Workspace Root

All backend code lives under `server/`. Do not generate NestJS artifacts under `client/`.

```
server/
├── src/
│   ├── main.ts                 # bootstrap, global pipes/filters/middleware
│   ├── app.module.ts           # root module
│   └── {feature}/              # one folder per bounded context / feature
│       ├── {feature}.module.ts
│       ├── controllers/
│       ├── services/
│       ├── repositories/       # data access only
│       ├── dto/
│       ├── interfaces/
│       ├── types/
│       ├── enums/
│       └── constants/
├── test/
└── package.json
```

---

## Architect Guidance

### Feature Module Boundaries

- One NestJS feature module per bounded context, at `server/src/{feature}/`.
- A feature module owns its controllers, services, repositories, and DTOs. It does not export internal repositories — only services the rest of the app needs.
- Use `@Global()` sparingly. Reserve it for truly app-wide infrastructure (config, logging, database connection module).
- Cross-feature communication goes through injected services or domain events — never by importing another feature's repository directly.

### REST API Design

Follow RESTful conventions:

| Intent | Method | Route example | Status |
|--------|--------|---------------|--------|
| List | `GET` | `/orders` | `200` |
| Get one | `GET` | `/orders/:id` | `200` / `404` |
| Create | `POST` | `/orders` | `201` |
| Replace | `PUT` | `/orders/:id` | `200` / `404` |
| Partial update | `PATCH` | `/orders/:id` | `200` / `404` |
| Delete | `DELETE` | `/orders/:id` | `204` / `404` |

- Route segments are kebab-case plural nouns (`/order-items`, not `/orderItems`).
- Nest controllers use `@Controller('orders')` at the feature level; method decorators carry the verb.
- Version the API when breaking changes ship (`/api/v1/orders`). Centralize the prefix in a config constant — do not hardcode per controller.

### DTOs and Validation (Contract Authoring Side)

The backend DTO is the **source of truth** for request/response shapes consumed by the Angular client.

Every inbound request body and query payload is validated through a DTO class with `class-validator` decorators:

```typescript
import { IsNotEmpty, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateOrderDto {
  @IsNotEmpty()
  @IsUUID()
  customerId!: string;

  @IsString()
  @MaxLength(500)
  notes!: string;
}
```

Rules:

- One DTO class per file in `dto/`.
- Request DTOs: `Create{Entity}Dto`, `Update{Entity}Dto`, `{Entity}QueryDto`.
- Response DTOs (when shape differs from domain model): `{Entity}ResponseDto`.
- Enable `ValidationPipe` globally in `main.ts` with `whitelist: true`, `forbidNonWhitelisted: true`, and `transform: true`.
- Never accept raw `any` or unvalidated plain objects in controller method signatures.

### Error Handling Architecture

- Use NestJS built-in HTTP exceptions (`NotFoundException`, `BadRequestException`, `ConflictException`, etc.) in services and controllers.
- Implement a **global exception filter** that normalizes all errors into a consistent JSON envelope for the Angular client:

```typescript
{
  "statusCode": 404,
  "message": "Order not found",
  "error": "Not Found",
  "timestamp": "2026-06-23T12:00:00.000Z",
  "path": "/api/v1/orders/abc"
}
```

- Never leak stack traces, SQL errors, or internal field names in production responses.
- Map domain/business rule violations to `4xx`; unexpected failures to `500` with a generic message and a correlation ID for logging.

### Security NFRs

- **Helmet** middleware is registered in `main.ts` on every bootstrap.
- **CORS** is configured explicitly — no wildcard origin in production.
- Auth guards (`@UseGuards()`) are applied at the controller or route level; document which routes are public vs protected in the feature design.
- Disable unused HTTP methods — do not expose `@All()` when only `GET` and `POST` are needed.
- Secrets come from environment variables or a config service — never from source files.

### Repository Pattern

- Database queries live in `repositories/`. Business logic lives in `services/`.
- Services call repositories; controllers call services. Controllers never call repositories directly.
- One repository per aggregate root (or per table when the domain is CRUD-heavy).
- Repositories return domain interfaces (`IOrder`), not ORM entity instances, at the service boundary when practical.

### Units of Work

When decomposing backend work:

- A unit typically covers one feature module slice: controller endpoint(s) + service method(s) + repository method(s) + DTO(s) + tests.
- Database migrations are their own unit when schema changes are involved.
- Do not split a single REST endpoint across two units.

---

## Developer Guidance

### Imports

Order imports in three groups, separated by blank lines:

1. `@nestjs/*` modules
2. Third-party libraries
3. Application modules (relative or path-alias imports)

### Class Organization

NestJS classes (controllers, services, repositories, providers) follow this member order:

1. Decorator properties (`@Inject`, custom param decorators on fields — rare)
2. Regular properties
3. Constructor
4. Public methods (alphabetized)
5. Protected methods (alphabetized)
6. Private methods (alphabetized)

Constructor parameters are `private readonly` by default. Class members are `private` by default; use `protected` only for subclass extension.

There are no Angular-style lifecycle hooks in NestJS — do not invent `onInit`-style patterns unless implementing a Nest lifecycle interface (`OnModuleInit`, etc.) explicitly.

### Module Shape

```typescript
import { Module } from "@nestjs/common";

import { OrdersController } from "./controllers/orders.controller";
import { OrdersRepository } from "./repositories/orders.repository";
import { OrdersService } from "./services/orders.service";

@Module({
  controllers: [
    OrdersController,
  ],
  exports: [
    OrdersService,
  ],
  imports: [],
  providers: [
    OrdersService,
    OrdersRepository,
  ],
})
export class OrdersModule {}
```

### Controller Shape

```typescript
import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { CreateOrderDto } from "../dto/create-order.dto";
import { OrderResponseDto } from "../dto/order-response.dto";
import { OrdersService } from "../services/orders.service";

@Controller("orders")
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
  ) {}

  @Get()
  async findAll(): Promise<OrderResponseDto[]> {
    return this.ordersService.findAll();
  }

  @Get(":id")
  async findOne(@Param("id") id: string): Promise<OrderResponseDto> {
    return this.ordersService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateOrderDto): Promise<OrderResponseDto> {
    return this.ordersService.create(dto);
  }
}
```

### Service Shape

```typescript
import { Injectable, NotFoundException } from "@nestjs/common";

import { CreateOrderDto } from "../dto/create-order.dto";
import { IOrder } from "../interfaces/IOrder";
import { OrdersRepository } from "../repositories/orders.repository";

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
  ) {}

  async create(dto: CreateOrderDto): Promise<IOrder> {
    return this.ordersRepository.create(dto);
  }

  async findOne(id: string): Promise<IOrder> {
    const order = await this.ordersRepository.findById(id);

    if (!order) {
      throw new NotFoundException(`Order ${ id } not found`);
    }

    return order;
  }
}
```

### Bootstrap (`main.ts`) Checklist

Every NestJS bootstrap must wire:

```typescript
app.useGlobalPipes(new ValidationPipe({
  forbidNonWhitelisted: true,
  transform: true,
  whitelist: true,
}));
app.useGlobalFilters(new GlobalExceptionFilter());
app.use(helmet());
```

Adjust CORS, versioning prefix, and Swagger (if adopted) per project ADR.

### Dependency Injection

- Prefer constructor-based DI (NestJS default).
- Inject interfaces/tokens when swapping implementations in tests (`@Inject(ORDERS_REPOSITORY)`).
- Do not use property injection (`@Inject()` on fields) except for circular-dependency workarounds — document those with a comment.

### Testing

- Unit-test services with mocked repositories.
- Integration-test controllers with `supertest` against a test module; assert status codes, response body shape, and validation failures.
- Every new endpoint gets at least: happy path, `404` (when applicable), and validation failure (`400`) tests.
- Use `HttpClientTestingModule` patterns on the Angular side; on the NestJS side use the Nest testing utilities (`Test.createTestingModule`).

### Reverse Engineering Scan (Backend)

When scanning `server/` during Reverse Engineering, extract:

- Feature modules under `server/src/{feature}/` and their imports/exports
- Controllers: routes, HTTP methods, guards, DTOs used
- Services: dependencies injected, public method signatures
- Repositories: query methods, ORM/query-builder usage
- Global bootstrap: ValidationPipe config, exception filters, Helmet, CORS
- DTO coverage: endpoints accepting unvalidated plain types (deviation)
- `package.json` exact-version compliance
- Missing Helmet or global ValidationPipe (deviation)

---

## Forbidden

- Raw `any` in controller method signatures or service public APIs
- Business logic in controllers (orchestration only — delegate to services)
- Database queries in services (delegate to repositories)
- Controllers calling repositories directly
- `@Global()` on feature modules
- `@All()` decorators when specific verbs suffice
- Stack traces or SQL error text in HTTP responses
- Hardcoded secrets, connection strings, or API keys in source
- `^` or `~` in `server/package.json` dependencies
- `console.log` / `console.*` in shipped code — use the project's logger

## Mandated

- Feature modules at `server/src/{feature}/` with clear single responsibility
- DTOs with `class-validator` on every inbound request body and query object
- Global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true`
- Global exception filter for consistent error envelopes
- Helmet middleware on every bootstrap
- Repository pattern: queries in repositories, business rules in services
- `private readonly` constructor parameters
- `I{Name}` / `T{Name}` naming with one declaration per file and barrel exports
- Snyk scan after every code generation; loop until clean (see `labcorp-security-baseline.md`)
- Exact npm versions in `server/package.json`

## Relationship to Frontend

- Backend DTO/response shapes are the contract source; Angular interfaces in `client/` mirror them.
- Error envelope from the global exception filter is what the Angular `catchError` mapper expects — keep field names stable.
- A feature unit spanning client and server should list both the NestJS module changes and the Angular feature changes in the same delivery plan.
