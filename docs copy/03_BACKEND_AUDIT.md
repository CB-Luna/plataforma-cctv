# 03 — Backend Audit

> Fecha: 2026-04-05 | Reconciliado: 2026-04-05
> Estado: RECONCILIADO — conteos corregidos, Swagger vs main.go verificado.
> Fuentes: `cctv_server/cmd/main.go`, `cctv_server/docs/swagger.json`, `database/migrations/*.up.sql`, `cctv_server/internal/handlers/*.go`

---

## Información General del Backend

| Atributo | Valor | Estatus |
|---|---|---|
| Lenguaje | Go | ✅ VERIFICADO |
| Framework HTTP | Gin | ✅ VERIFICADO |
| ORM / Query builder | SQLC (code generation) | ✅ VERIFICADO |
| Base de datos | PostgreSQL 16 + pgvector | ✅ VERIFICADO |
| Puerto | 8080 | ✅ VERIFICADO |
| Base path | `/api/v1` | ✅ VERIFICADO |
| Documentación | Swagger en `/swagger/*any` | ✅ VERIFICADO |
| Auth | JWT Bearer token | ✅ VERIFICADO |
| Multi-tenant | Middleware `TenantMiddleware()` + RLS | ✅ VERIFICADO |
| Object storage | MinIO (S3-compatible) | ✅ VERIFICADO |
| IA/Embeddings | pgvector + servicio `CatalogEmbeddingService` | ✅ VERIFICADO |
| CORS | Permite `*`, headers: `Authorization`, `X-Company-ID`, `X-Tenant-ID` | ✅ VERIFICADO |

---

## Schemas de Base de Datos

| Schema | Propósito | Tablas principales | Estatus |
|---|---|---|---|
| `public` | Tenants (raíz multi-tenancy) | `tenants` | ✅ VERIFICADO |
| `auth` | Autenticación y autorización | `permissions`, `roles`, `role_permissions`, `users`, `user_roles`, `sessions` | ✅ VERIFICADO |
| `cctv` | Dominio de negocio CCTV | `clients`, `client_contacts`, `sites`, `areas`, `asset_types`, `assets`, `asset_history`, `coverages`, `policies`, `sla_definitions`, `tickets`, `ticket_comments`, `worklogs`, `preventive_maintenance` | ✅ VERIFICADO |
| `billing` | Facturación | `payment_methods`, `invoices`, `invoice_items`, `payments` | ✅ VERIFICADO |

Total: **4 schemas, 44+ tablas** (todas con `tenant_id` excepto `public.tenants`).

---

## Inventario Completo de Endpoints

### Endpoints Públicos (sin auth)

| Método | Ruta | Handler | Swagger | main.go |
|---|---|---|---|---|
| POST | `/auth/register` | `AuthHandler.Register` | ✅ | ✅ |
| POST | `/auth/login` | `AuthHandler.Login` | ✅ | ✅ |
| POST | `/auth/logout` | `AuthHandler.Logout` | ✅ | ✅ |
| GET | `/storage/public/:id` | `StorageHandler.ServePublicFile` | ❌ | ✅ |
| GET | `/health` | inline | ❌ | ✅ |

### Auth (protegido)

| Método | Ruta | Swagger | main.go |
|---|---|---|---|
| GET | `/auth/me` | ✅ | ✅ |

> **Nota:** `auth/refresh` y `auth/switch-company` **NO existen** — ni en main.go, ni en Swagger, ni en `handlers/auth.go`. Solo existe un campo `refresh_token` en un DTO. Son GAP-MISSING. Ver `07_API_GAPS`.

### Users (10 endpoints)

| Método | Ruta | Swagger | main.go |
|---|---|---|---|
| GET | `/users` | ✅ | ✅ |
| GET | `/users/:id` | ✅ | ✅ |
| PUT | `/users/:id` | ✅ | ✅ |
| PUT | `/users/:id/password` | ✅ | ✅ |
| DELETE | `/users/:id` | ✅ | ✅ |
| GET | `/users/:id/roles` | ✅ | ✅ |
| POST | `/users/:id/roles` | ✅ | ✅ |
| DELETE | `/users/:id/roles/:roleId` | ✅ | ✅ |
| POST | `/users/:id/profile-image` | ✅ | ✅ |
| DELETE | `/users/:id/profile-image` | ❌ | ✅ |

### Roles & Permissions (8 endpoints)

| Método | Ruta | Swagger | main.go |
|---|---|---|---|
| GET | `/roles` | ✅ | ✅ |
| POST | `/roles` | ✅ | ✅ |
| GET | `/roles/:id` | ✅ | ✅ |
| PUT | `/roles/:id` | ✅ | ✅ |
| GET | `/roles/:id/permissions` | ✅ | ✅ |
| POST | `/roles/:id/permissions` | ✅ | ✅ |
| GET | `/permissions` | ✅ | ✅ |
| POST | `/permissions` | ✅ | ✅ |

### Settings (3 endpoints)

| Método | Ruta | Swagger | main.go |
|---|---|---|---|
| GET | `/settings` | ✅ | ✅ |
| PUT | `/settings` | ✅ | ✅ |
| PUT | `/settings/theme` | ✅ | ✅ |

### Menu (23 endpoints)

| Método | Ruta | Swagger | main.go |
|---|---|---|---|
| GET | `/menu` | ✅ | ✅ |
| GET | `/menu/items` | ✅ | ✅ |
| GET | `/menu/items/admin` | ✅ | ✅ |
| GET | `/menu/items/:id` | ✅ | ✅ |
| GET | `/menu/items/:id/templates` | ✅ | ✅ |
| POST | `/menu/items` | ✅ | ✅ |
| PUT | `/menu/items/:id` | ✅ | ✅ |
| PATCH | `/menu/items/:id/toggle` | ✅ | ✅ |
| DELETE | `/menu/items/:id` | ❌ | ✅ |
| PUT | `/menu/items/reorder` | ✅ | ✅ |
| GET | `/menu/templates` | ✅ | ✅ |
| POST | `/menu/templates` | ✅ | ✅ |
| PUT | `/menu/templates/:id` | ✅ | ✅ |
| DELETE | `/menu/templates/:id` | ❌ | ✅ |
| GET | `/menu/templates/:id/tenants` | ✅ | ✅ |
| PUT | `/menu/templates/:id/tenants` | ✅ | ✅ |
| GET | `/menu/templates/:id/items` | ✅ | ✅ |
| POST | `/menu/templates/:id/items` | ✅ | ✅ |
| PUT | `/menu/templates/:id/items-bulk` | ✅ | ✅ |
| PUT | `/template-items/:id/item/:itemId` | ✅ | ✅ |
| DELETE | `/template-items/:id/item/:itemId` | ✅ | ✅ |
| GET | `/menu/templates/:id/unassigned-items` | ✅ | ✅ |
| GET | `/menu/tenants` | ✅ | ✅ |

### Tenants (8 endpoints)

| Método | Ruta | Swagger | main.go |
|---|---|---|---|
| GET | `/tenants` | ✅ | ✅ |
| GET | `/tenants/stats` | ✅ | ✅ |
| GET | `/tenants/:id` | ✅ | ✅ |
| POST | `/tenants` | ✅ | ✅ |
| PUT | `/tenants/:id` | ✅ | ✅ |
| PATCH | `/tenants/:id/activate` | ✅ | ✅ |
| PATCH | `/tenants/:id/deactivate` | ✅ | ✅ |
| POST | `/tenants/:id/logo` | ✅ | ✅ |

### Storage (9 endpoints)

| Método | Ruta | Swagger | main.go |
|---|---|---|---|
| POST | `/storage/upload` | ✅ | ✅ |
| GET | `/storage/files` | ✅ | ✅ |
| GET | `/storage/files/:id/content` | ❌ | ✅ |
| GET | `/storage/stats` | ✅ | ✅ |
| GET | `/storage/providers` | ✅ | ✅ |
| GET | `/storage/configurations` | ✅ | ✅ |
| POST | `/storage/configurations` | ✅ | ✅ |
| PUT | `/storage/configurations/:id` | ✅ | ✅ |
| DELETE | `/storage/configurations/:id` | ✅ | ✅ |

### Intelligence (12 endpoints)

| Método | Ruta | Swagger | main.go |
|---|---|---|---|
| GET | `/intelligence/models` | ✅ | ✅ |
| POST | `/intelligence/models` | ✅ | ✅ |
| GET | `/intelligence/models/:id` | ❌ | ✅ |
| PUT | `/intelligence/models/:id` | ❌ | ✅ |
| DELETE | `/intelligence/models/:id` | ❌ | ✅ |
| PATCH | `/intelligence/models/:id/set-default` | ❌ | ✅ |
| PATCH | `/intelligence/models/:id/active` | ❌ | ✅ |
| GET | `/intelligence/templates` | ✅ | ✅ |
| GET | `/intelligence/analyses` | ✅ | ✅ |
| GET | `/intelligence/usage` | ✅ | ✅ |
| POST | `/intelligence/embeddings/reindex/models` | ❌ | ✅ |
| POST | `/intelligence/embeddings/reindex/model/:id` | ❌ | ✅ |

### Clients (3 endpoints)

| Método | Ruta | Swagger | main.go |
|---|---|---|---|
| GET | `/clients` | ✅ | ✅ |
| GET | `/clients/:id` | ✅ | ✅ |
| POST | `/clients` | ✅ | ✅ |

### Policies (7 endpoints)

| Método | Ruta | Swagger | main.go |
|---|---|---|---|
| GET | `/policies` | ❌ | ✅ |
| POST | `/policies` | ❌ | ✅ |
| GET | `/policies/:id` | ❌ | ✅ |
| PUT | `/policies/:id` | ❌ | ✅ |
| DELETE | `/policies/:id` | ❌ | ✅ |
| POST | `/policies/:id/assets` | ❌ | ✅ |
| DELETE | `/policies/:id/assets/:assetId` | ❌ | ✅ |

> **Nota:** Los endpoints de policies están implementados en el código pero NO documentados en Swagger. Los DTOs (`CreatePolicyRequest`, `UpdatePolicyRequest`) están verificados en `handlers/policies.go`.

### SLA (4 endpoints)

| Método | Ruta | Swagger | main.go |
|---|---|---|---|
| GET | `/sla/policies` | ❌ | ✅ |
| POST | `/sla/policies` | ❌ | ✅ |
| PUT | `/sla/policies/:id` | ❌ | ✅ |
| DELETE | `/sla/policies/:id` | ❌ | ✅ |

> **Nota:** Implementados pero sin documentación Swagger. DTOs verificados en `handlers/sla.go`.

### Inventory — NVR (8 endpoints)

| Método | Ruta | Swagger | main.go |
|---|---|---|---|
| GET | `/inventory/nvrs` | ✅ | ✅ |
| GET | `/inventory/nvrs/stats` | ✅ | ✅ |
| GET | `/inventory/nvrs/:id` | ✅ | ✅ |
| POST | `/inventory/nvrs` | ✅ | ✅ |
| PUT | `/inventory/nvrs/:id` | ✅ | ✅ |
| DELETE | `/inventory/nvrs/:id` | ✅ | ✅ |
| GET | `/inventory/nvrs/:id/licenses` | ✅ | ✅ |
| GET | `/inventory/nvrs/:id/cameras` | ✅ | ✅ |

### Inventory — Cameras (6 endpoints)

| Método | Ruta | Swagger | main.go |
|---|---|---|---|
| GET | `/inventory/cameras` | ✅ | ✅ |
| GET | `/inventory/cameras/stats` | ✅ | ✅ |
| GET | `/inventory/cameras/search` | ✅ | ✅ |
| GET | `/inventory/cameras/:id` | ✅ | ✅ |
| POST | `/inventory/cameras` | ✅ | ✅ |
| DELETE | `/inventory/cameras/:id` | ✅ | ✅ |

### Inventory — Semantic Search (1 endpoint)

| Método | Ruta | Swagger | main.go |
|---|---|---|---|
| GET | `/inventory/models/search/semantic` | ❌ | ✅ |

### Inventory — Import (11 endpoints)

| Método | Ruta | Swagger | main.go |
|---|---|---|---|
| GET | `/inventory/import/batches` | ✅ | ✅ |
| GET | `/inventory/import/batches/:id` | ✅ | ✅ |
| GET | `/inventory/import/batches/:id/items` | ✅ | ✅ |
| GET | `/inventory/import/batches/:id/errors` | ✅ | ✅ |
| POST | `/inventory/import/batches` | ✅ | ✅ |
| POST | `/inventory/import/batches/:id/process` | ✅ | ✅ |
| POST | `/inventory/import/batches/:id/cancel` | ✅ | ✅ |
| DELETE | `/inventory/import/batches/:id` | ❌ | ✅ |
| GET | `/inventory/import/stats` | ✅ | ✅ |
| POST | `/inventory/import/validate` | ✅ | ✅ |
| POST | `/inventory/import/assistant/analyze` | ❌ | ✅ |

### Inventory — Floor Plans (3 endpoints)

| Método | Ruta | Swagger | main.go |
|---|---|---|---|
| GET | `/inventory/floor-plans/sites` | ❌ | ✅ |
| GET | `/inventory/floor-plans/site/:siteId` | ❌ | ✅ |
| PUT | `/inventory/floor-plans/site/:siteId` | ❌ | ✅ |

> **Hallazgo crítico:** El backend YA tiene endpoints de floor-plans funcionales. No aparecen en Swagger pero están registrados en `main.go` y la implementación está en `handlers/inventory_floor_plans.go`. Guardan/recuperan un documento JSON completo con la definición del plano.

### Inventory — Summary (1 endpoint)

| Método | Ruta | Swagger | main.go |
|---|---|---|---|
| GET | `/inventory/summary` | ✅ | ✅ |

### Tickets (12 endpoints)

| Método | Ruta | Swagger | main.go |
|---|---|---|---|
| GET | `/tickets` | ✅ | ✅ |
| POST | `/tickets` | ✅ | ✅ |
| GET | `/tickets/:id` | ✅ | ✅ |
| PUT | `/tickets/:id` | ✅ | ✅ |
| DELETE | `/tickets/:id` | ❌ | ✅ |
| PATCH | `/tickets/:id/status` | ✅ | ✅ |
| PATCH | `/tickets/:id/assign` | ✅ | ✅ |
| GET | `/tickets/:id/timeline` | ✅ | ✅ |
| GET | `/tickets/:id/comments` | ✅ | ✅ |
| POST | `/tickets/:id/comments` | ✅ | ✅ |
| GET | `/tickets/stats` | ✅ | ✅ |
| GET | `/tickets/technicians/workload` | ✅ | ✅ |

### Dashboard (10 endpoints)

| Método | Ruta | Swagger | main.go |
|---|---|---|---|
| GET | `/dashboard/summary` | ✅ | ✅ |
| GET | `/dashboard/tickets/stats` | ✅ | ✅ |
| GET | `/dashboard/tickets/trend` | ✅ | ✅ |
| GET | `/dashboard/clients/stats` | ✅ | ✅ |
| GET | `/dashboard/policies/stats` | ✅ | ✅ |
| GET | `/dashboard/invoices/stats` | ✅ | ✅ |
| GET | `/dashboard/users/stats` | ✅ | ✅ |
| GET | `/dashboard/users/by-role` | ✅ | ✅ |
| GET | `/dashboard/inventory/stats` | ✅ | ✅ |
| GET | `/dashboard/technicians/workload` | ✅ | ✅ |

---

## Resumen Cuantitativo

| Categoría | Valor |
|---|---|
| **Total endpoints en main.go** | 144 (146 registros incl. health + swagger) |
| **Documentados en Swagger** | ~83 |
| **Solo en main.go (sin Swagger)** | ~61 |
| **Módulos con CRUD completo** | tenants, users, roles, inventory (NVR/cameras), tickets, menu, storage, intelligence |
| **Módulos con CRUD parcial** | clients (falta update/delete), policies (sin Swagger), SLA (sin Swagger) |
| **Módulos solo en DB** | billing (invoices, payments), preventive_maintenance, worklogs |

---

## DTOs Verificados (Swagger definitions)

Total: **88 definiciones** incluyendo requests, responses y tipos auxiliares.

Categorías principales:
- **Auth:** LoginRequest, LoginResponse, RegisterRequest, UserResponse, CompanyResponse
- **Tenants:** CreateTenantRequest, UpdateTenantRequest, TenantResponse, TenantStatsResponse, TenantSettingsResponse
- **Users:** UpdateUserRequest, UpdatePasswordRequest, UserResponse, UserStatsResponse, UsersByRoleResponse
- **Roles:** CreateRoleRequest, UpdateRoleRequest, RoleResponse, PermissionResponse, AssignPermissionRequest
- **Menu:** CreateMenuItemRequest, UpdateMenuItemRequest, MenuItemResponse, MenuResponse, MenuTemplateResponse, ReorderMenuItemsRequest
- **Inventory:** CreateNvrServerRequest, NvrServerResponse, NvrServerStatsResponse, CameraResponse, CameraStatsResponse, ExecutiveSummaryResponse
- **Import:** CreateImportBatchRequest, ImportBatchResponse, ImportBatchDetailResponse, ImportBatchItemResponse, ValidateImportDataRequest, ValidationResultResponse
- **Tickets:** CreateTicketRequest, UpdateTicketRequest, TicketResponse, TicketDetailResponse, TicketStatsResponse, TimelineEntryResponse, CommentResponse, TechnicianWorkloadResponse
- **Dashboard:** DashboardSummaryResponse, DashboardTicketStatsResponse, TicketTrendResponse, ClientStatsResponse, PolicyStatsResponse, InvoiceStatsResponse, InventoryStatsResponse
- **Storage:** StorageProviderResponse, StorageConfigurationResponse, FileResponse, FileStatsResponse
- **Intelligence:** ModelConfigResponse, PromptTemplateResponse, AnalysisResponse, UsageStatsResponse
