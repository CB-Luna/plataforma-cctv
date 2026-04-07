# 04 — Module Mapping

> Fecha: 2026-04-05
> Estado: VERIFICADO contra código fuente de ambos proyectos.

---

## Objetivo

Definir explícitamente qué se rescata de cada proyecto base, qué se descarta y por qué.

---

## De `symticketscctv` (Legado CCTV)

### ✅ SE RESCATA

| Elemento | Qué se toma | Evidencia (archivo fuente) | Cómo se usa en symticketscctv-next |
|---|---|---|---|
| **Backend Go completo** | 107 endpoints, 15+ módulos, JWT, multi-tenant, MinIO, pgvector | `cctv_server/cmd/main.go` (388 líneas) | Se consume tal cual via REST. NO se modifica. |
| **Esquema de BD** | 4 schemas, 44+ tablas con RLS | `database/migrations/*.up.sql` (10 archivos) | Referencia para tipos TS y validaciones Zod |
| **Swagger / DTOs** | 88 definiciones tipadas | `cctv_server/docs/swagger.json` | Base para generar tipos TypeScript |
| **Contrato API auth** | Login retorna JWT + companies[]. Auth/me retorna user + roles + permissions | `handlers/auth.go` | Implementar auth-store + interceptor ky |
| **Multi-tenant via header** | `X-Company-ID` / `X-Tenant-ID` enviado en cada request | `cmd/main.go` línea ~84 (CORS config) | Interceptor ky inyecta header desde tenant-store |
| **Floor plans backend** | 3 endpoints funcionales: list sites, get plan, save plan | `handlers/inventory_floor_plans.go` | Consumir directamente en Fase 6 |
| **IA/Embeddings** | Búsqueda semántica de modelos de cámara, reindex | `intelligence/` + endpoints | Integrar en inventario búsqueda semántica |
| **Dominio de negocio** | Tickets con SLA, pólizas con coberturas, inventario con importación masiva | Migraciones 004-009 + handlers | Modelar las vistas CRUD respetando las entidades |
| **SQLC queries** | Contratos de consulta tipados | `database/queries/*.sql` (4 archivos: companies, company_users, equipment, tickets) | Referencia para entender qué retorna cada endpoint |
| **Documentación funcional** | Análisis de proyecto, arquitectura multi-tenant, plan de migración, propuestas | `documentation/` (30+ archivos .md + PDFs) | Contexto de negocio para diseño de UI |

### ❌ NO SE RESCATA

| Elemento | Por qué |
|---|---|
| `webcctv-next/` | Carpeta vacía. No hay código. |
| `webcctv_frontend/` (Flutter Web) | Solo como **referencia funcional** de features implementados. No se porta código Dart. |
| `lib/main.dart` (app Flutter móvil) | Fuera del alcance. Es la app móvil. |
| Archivos Docker del legado | Se crearán propios para el nuevo proyecto. |
| `.env.local.example` del legado | Se creará uno propio con las variables necesarias. |

### 📋 SE USA COMO REFERENCIA (sin portar código)

| Elemento | Qué se consulta | Archivo(s) |
|---|---|---|
| Feature map Flutter Web | 9 módulos: auth, configuration, dashboard, inventory, policies, storage, tenants, tickets, ai_models | `webcctv_frontend/lib/features/` |
| Módulos core Flutter | ApiClient (Dio), AuthGuard, TenantProvider, ThemeProvider, GoRouter config | `webcctv_frontend/lib/core/` |
| Layout Flutter | MainLayout con sidebar + header | `webcctv_frontend/lib/layout/main_layout.dart` |
| Rutas Flutter | 22 rutas documentadas con estado (✅/⚠️/🚧) | `documentation/MIGRACION_NEXTJS.md` sección 2.3 |
| Excel de inventario | Datos de referencia para importación masiva | `Inventario skyworks.xlsx` |
| PDFs de especificación | Póliza CCTV, Portal de Pólizas, Entregables | `documentation/*.pdf` |

---

## De `core-associates` (Referencia UX/Admin)

### ✅ SE RESCATA (Patrones, no código directo)

| Elemento | Qué se toma | Archivo fuente | Cómo se adapta |
|---|---|---|---|
| **Patrón de login** | JWT + refresh token + localStorage + redirect | `src/stores/auth-store.ts` | Adaptar a dominio CCTV: login → select company → dashboard. Usar httpOnly cookies en lugar de localStorage para tokens (mejora de seguridad). |
| **API client con auto-refresh** | Singleton fetch, interceptor 401 → refresh, clearAuth on fail | `src/lib/api-client.ts` | Reescribir con `ky` en lugar de `fetch`. Agregar inyección de `X-Company-ID`. |
| **Shell layout** | Sidebar + Header + Content con guards por ruta | `src/app/(dashboard)/layout.tsx` | Mismo patrón App Router. Adaptar guards a permisos CCTV. |
| **Sidebar dinámico** | Carga desde API `/menu`, renderiza por tipo (link/sección/separador), active state con pathname | `src/components/layout/Sidebar.tsx` | Mismo patrón. Cambiar nomenclatura (Core Associates → SymTickets). Agregar selector de sucursal. |
| **Menu store** | Zustand store que fetchea items y cachea | `src/stores/menu-store.ts` | Copiar patrón 1:1, apuntar a API CCTV `/menu`. |
| **RBAC dinámico** | Hook `usePermisos()` con `puede('modulo:accion')`, súper-admin bypass, soporte formato legacy | `src/lib/permisos.ts` | Adaptar a nomenclatura CCTV. Quitar lógica de "abogado", "proveedor", "operador". |
| **Theming por tenant** | CSS variables (`--sidebar-bg`, `--primary-400`, etc.), tema del servidor vía API, bridge localStorage → CSS | `src/stores/auth-store.ts` (loadTema), `Sidebar.tsx` (inline styles) | Mismo sistema de CSS variables. Cargar tema desde `/settings/theme` (API CCTV). |
| **Skeleton loaders** | Patrón de loading con pulso para sidebar items | `Sidebar.tsx` líneas 55-60 | Reutilizar patrón visual. |
| **Icon mapping** | Función `getIcon()` que mapea nombre string → componente Lucide | `src/lib/icon-map.ts` | Mismo patrón para items de menú dinámico. |

### ❌ NO SE RESCATA

| Elemento | Por qué |
|---|---|
| **Dominio legal** | Abogados, casos legales, asociados — no aplica a CCTV |
| **CRM Push / Chat Widget** | `CrmPushSync.tsx`, `ChatWidget` — específico de Core Associates |
| **Módulos de negocio** | Promociones, cupones, proveedores, documentos CRM |
| **Nomenclatura CRM** | "asociados", "abogado", "proveedor", "operador" en permisos |
| **API types CRM** | El tipo `User` incluye `proveedorId`, `rolNombre` específico |
| **Backend NestJS** | Core Associates usa NestJS + Prisma. No aplica. |

---

## Tabla de Equivalencia: Flutter Web → Next.js

| Módulo Flutter (`webcctv_frontend`) | Módulo Next.js (`symticketscctv-next`) | Fuente del patrón UX |
|---|---|---|
| `features/auth/` (BLoC + TokenManager) | `(auth)/login/`, stores/auth-store | Core Associates |
| `features/tenants/` | `system/tenants/` | Core Associates (CRUD admin) |
| `features/dashboard/` (fl_chart) | `(dashboard)/dashboard/` (Recharts) | Nuevo, inspirado en Flutter |
| `features/inventory/` | `(dashboard)/inventory/*` | Nuevo, con DataTable TanStack |
| `features/tickets/` | `(dashboard)/tickets/*` | Nuevo, con timeline y SLA visual |
| `features/policies/` (stub) | `(dashboard)/policies/` | Nuevo, implementación completa |
| `features/configuration/` | `(dashboard)/admin/*` | Core Associates (tabs, forms) |
| `features/storage/` | `(dashboard)/admin/storage/` | Core Associates |
| `features/ai_models/` | `(dashboard)/admin/ai-models/` | Core Associates |
| `core/theme/` (8 presets) | Theme system CSS variables | Core Associates |
| `core/router/` (GoRouter) | App Router (Next.js built-in) | N/A |
| `core/network/` (Dio + interceptors) | `lib/api/client.ts` (ky) | Core Associates |
| `core/providers/TenantProvider` | `stores/tenant-store` | Core Associates |
| `core/providers/MenuProvider` | `stores/menu-store` | Core Associates |
| `layout/main_layout.dart` | `(dashboard)/layout.tsx` | Core Associates |
| *No existía* | `infrastructure/floor-plans/` (react-konva) | Nuevo |
| *No existía* | `maps/` (react-leaflet) | Nuevo |
| *No existía* | `infrastructure/topology/` (React Flow) | Nuevo |

---

## Resumen

```
symticketscctv-next = 
    Backend de symticketscctv (100% tal cual)
  + Dominio de negocio de symticketscctv (entidades, flujos, reglas)
  + Patrones UX/admin de core-associates (login, shell, RBAC, theming, menú)
  + Módulos nuevos (mapas, planos, topología)
  + Stack moderno (Next.js 15, React 19, shadcn/ui, TanStack)
```
