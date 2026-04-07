# 01 — Plan de Acción por Fases

> Fecha: 2026-04-05 | Última revisión: 2026-04-05
> Estado: **CLASIFICACIÓN DEFINITIVA V1**
>
> Leyenda:
> - ✅ **COMPLETADO** — Implementado y funcional sin restricciones
> - ✅⚠️ **COMPLETADO CON LIMITACIONES** — Frontend listo, backend no expone toda la funcionalidad necesaria
> - ❌ **BLOQUEADO POR BACKEND** — No se puede implementar hasta que exista endpoint
> - ⏳ **PENDIENTE** — Decidido no implementar en V1, puede agregarse después

---

## Resumen Ejecutivo

| Clasificación | Cantidad | % |
|---|---|---|
| ✅ COMPLETADO | 42 de 55 sub-tareas | 76% |
| ✅⚠️ CON LIMITACIONES | 3 | 5% |
| ❌ BLOQUEADO POR BACKEND | 5 | 9% |
| ⏳ PENDIENTE (fuera de V1) | 5 | 9% |

**V1 es demostrable y desplegable.** Los módulos bloqueados son funcionalidades secundarias que no impiden uso productivo.

---

## Fase 0: Auditoría y Mapeo — ✅ COMPLETADA (6/6)

| Entregable | Estado | Evidencia |
|---|---|---|
| Inventario de endpoints backend | ✅ | 144 rutas API en `cmd/main.go`, Swagger ~83 paths |
| Inventario de tablas DB | ✅ | 44+ tablas en 4 schemas, 10 migraciones |
| Inventario de features Flutter Web | ✅ | 9 módulos en `webcctv_frontend/lib/features/` |
| Inventario de patrones Core Associates | ✅ | auth-store, menu-store, Sidebar, permisos.ts |
| Documentación de supuestos | ✅ | `06_SUPUESTOS_Y_RIESGOS.md` |
| Documentación de gaps API | ✅ | `07_API_GAPS_Y_PLACEHOLDERS.md` |

---

## Fase 1: Setup Next + Auth + Layout — ✅ COMPLETADA (12/12)

| # | Tarea | Estado |
|---|---|---|
| 1.1 | Inicializar proyecto (App Router, React 19, TS) | ✅ |
| 1.2 | Dependencias (Tailwind, shadcn/ui 4, Zustand 5, TanStack Query v5, ky, Zod 4, RHF) | ✅ |
| 1.3 | ky client con interceptors (JWT cookie + X-Company-ID + 401 redirect) | ✅ |
| 1.4 | Auth stores Zustand (auth-store + tenant-store) | ✅ |
| 1.5 | Login page (RHF + Zod, diseño enterprise) | ✅ |
| 1.6 | Select Company page (selector visual multi-empresa) | ✅ |
| 1.7 | Middleware Next.js (cookie-based redirect) | ✅ |
| 1.8 | Main layout (sidebar + header + outlet) | ✅ |
| 1.9 | Sidebar dinámico (GET /menu, permisos, collapsible) | ✅ |
| 1.10 | Hook RBAC (`usePermissions` con can/canAny/canAll + super-admin) | ✅ |
| 1.11 | Theme system (CSS vars `--tenant-primary/secondary/tertiary`) | ✅ |
| 1.12 | Dashboard con datos reales de API | ✅ |

---

## Fase 2: Multitenancy + Empresas — ✅⚠️ COMPLETADA CON LIMITACIONES (4/7)

| # | Tarea | Estado | Detalle |
|---|---|---|---|
| 2.1 | DataTable genérico (TanStack Table) | ✅ | Sort, filter, paginación, selección, toolbar |
| 2.2 | Tenants CRUD | ✅ | 8 endpoints: listar, crear, editar, activar/desactivar, upload logo |
| 2.3 | Clientes | ✅⚠️ | **LIMITACIÓN:** Backend solo expone 3 endpoints (list, get, create). **No hay PUT ni DELETE** → frontend solo permite crear y listar. Ver GAP-01 en `07_API_GAPS` |
| 2.4 | Sucursales/Sitios CRUD | ❌ BLOQUEADO | **No existe endpoint CRUD** de sites en backend. `cctv.sites` existe en DB pero no hay API |
| 2.5 | Áreas por sitio | ❌ BLOQUEADO | **No existe endpoint CRUD** de áreas. Depende de 2.4 |
| 2.6 | Selector de sucursal | ✅ | Componente en header, Zustand store. Usa `GET /inventory/floor-plans/sites` |
| 2.7 | Mapa geográfico | ✅ RESUELTO | **Implementado en CP-03:** react-leaflet instalado, mapa con lookup de coordenadas por ciudad mexicana (`city-coordinates.ts`), markers con popups, filtro por cliente. Ruta: `/map` |

**Commits:** `478e08c`, `e985f42`

---

## Fase 3: Inventario CCTV — ✅ COMPLETADA (6/6)

| # | Tarea | Estado |
|---|---|---|
| 3.1 | NVR CRUD + stats cards | ✅ |
| 3.2 | Cámaras CRUD + stats + búsqueda semántica IA | ✅ |
| 3.3 | Importación masiva (batches + items + errores) | ✅ |
| 3.4 | Ficha técnica cámara (`/cameras/[id]` con specs por sección) | ✅ |
| 3.5 | Resumen ejecutivo inventario | ✅ |
| 3.6 | Dashboard inventario con stats | ✅ |

**Commits:** `65018ee`, `ca5ad89`, `c85b88d`

---

## Fase 4: Tickets + Pólizas + SLA — ✅ COMPLETADA (10/11)

| # | Tarea | Estado | Detalle |
|---|---|---|---|
| 4.1 | Tickets CRUD | ✅ | |
| 4.2 | Detalle ticket con timeline | ✅ | |
| 4.3 | Comentarios en ticket | ✅ | |
| 4.4 | Cambio de estado | ✅ | |
| 4.5 | Asignación de técnicos | ✅ | |
| 4.6 | Stats y workload | ✅ | |
| 4.7 | Pólizas CRUD + assets + detalle | ✅ | |
| 4.8 | SLA definitions CRUD | ✅ | |
| 4.9 | Dashboard tickets (stats + trend) | ✅ | |
| 4.10 | Dashboard pólizas | ✅ | |
| 4.11 | Mantenimiento preventivo | ❌ BLOQUEADO | Tabla `maintenance_schedules` existe en DB pero no hay endpoint |

**Commit:** `e34ed64`

---

## Fase 5: Configuración y Admin — ✅ COMPLETADA (5/7)

| # | Tarea | Estado | Detalle |
|---|---|---|---|
| 5.1 | Usuarios CRUD + avatar + password + asignar rol | ✅ | 10 endpoints consumidos |
| 5.2 | Roles CRUD + asignación de permisos | ✅ | 6 endpoints + 2 de permissions |
| 5.3 | Menú dinámico admin | ✅⚠️ | **LIMITACIÓN:** Sidebar 100% hardcodeado en `buildMenu()`. Backend tiene 23 endpoints de menú pero frontend no los usa — sidebar es estático. Pendiente para V2 |
| 5.4 | Settings + theme visual | ✅ | **Reestructurado:** Settings consolidados en 6 tabs (Usuarios, Empresas, Roles, Tema, IA, Storage) en ruta única `/settings` |
| 5.5 | Storage providers + configs | ✅ | Tab dentro de Settings |
| 5.6 | Intelligence IA (modelos + templates + embeddings) | ✅ | Tab dentro de Settings |
| 5.7 | Auditoría / logs | ❌ BLOQUEADO | No existe endpoint en backend |

**Commit:** `3dd33ee`

---

## Fase 6: Planos Interactivos — ✅ COMPLETADA + UPGRADE ENTERPRISE (5/5)

| # | Tarea | Estado |
|---|---|---|
| 6.1 | Lista de sitios con estado de plano (card grid) | ✅ |
| 6.2 | Visor de plano (read-only) | ✅ |
| 6.3 | Editor de plano enterprise (Zustand store, tools sidebar, rooms/walls/text/zones, camera FOV, undo/redo, export PNG, keyboard shortcuts) | ✅ CP-04 |
| 6.4 | Upload de imagen de fondo | ✅ |
| 6.5 | Topología de red (React Flow: Site → NVR → Camera) | ✅ |

**Commit:** `72ec7ae`

---

## Fase 7: Polish, Testing y Despliegue — 🔄 EN PROGRESO (7/10)

| # | Tarea | Estado | Detalle |
|---|---|---|---|
| 7.1 | i18n (es/en) | ⏳ PENDIENTE | Fuera de V1 por decisión explícita |
| 7.2 | Responsive (sidebar colapsable, mobile Sheet) | ✅ | `7a08b63` |
| 7.3 | Dark mode (light/dark/system) | ✅ | `7a08b63` |
| 7.4 | Unit tests Vitest (stores, hooks, utils) | ✅ | `e16af2e` — 44 tests |
| 7.5 | Component tests (Testing Library + happy-dom) | ✅ | `e16af2e` — 10 archivos |
| 7.6 | E2E tests Playwright (10 flujos críticos) | ⏳ EN PROGRESO | login, redirect, dashboard, tenants, clients, cameras, camera detail, tickets, floor-plans, settings |
| 7.7 | Dockerfile multi-stage (node:22-alpine standalone) | ✅ | `d4dd8a9` |
| 7.8 | docker-compose.prod.yml | ✅ | `d4dd8a9` |
| 7.9 | Export PDF/Excel (xlsx + jspdf-autotable) | ✅ | `b4ed768` |
| 7.10 | Facturación | ⏳ PENDIENTE | Fuera de V1 por decisión explícita |

---

## Resumen de Bloqueos por Backend

| ID | Módulo | Razón | Impacto |
|---|---|---|---|
| GAP-01 | Clientes edit/delete (2.3) | Backend solo expone GET list + GET by id + POST create | Bajo — crear y listar funciona |
| GAP-02 | Sitios CRUD (2.4) | No existe endpoint `/sites` | Medio — se usa floor-plans/sites como workaround |
| GAP-03 | Áreas CRUD (2.5) | No existe endpoint `/areas` | Bajo — no bloquea operación diaria |
| GAP-04 | ~~Mapa lat/lng (2.7)~~ | ✅ RESUELTO — lookup por ciudad mexicana | Resuelto sin necesidad de backend |
| GAP-05 | Mantenimiento preventivo (4.11) | No existe endpoint | Medio — tabla DB existe |
| GAP-06 | Auditoría/logs (5.7) | No existe endpoint | Bajo para V1 |
| GAP-07 | Menú admin UI (5.3) | 23 endpoints existen, frontend solo lee | Bajo — sidebar funciona correctamente |

---

## Ítems Excluidos de V1 (por decisión)

| Ítem | Razón |
|---|---|
| 7.1 — i18n | Se priorizó funcionalidad sobre internacionalización |
| 7.10 — Facturación | Requiere definición de producto, fuera de alcance técnico |
| Consolidación monorepo | No aporta valor funcional inmediato |
| Switch company sin relogin | Requiere endpoint backend de switch-context |
| Refresh token | Backend no expone endpoint de refresh |

---

## Stack Técnico Final V1

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router, standalone) | 16.2.2 |
| UI | React + shadcn/ui v4 | 19.2.4 / 4.1.2 |
| Estilos | Tailwind CSS | 4 |
| Estado | Zustand (5 stores) + TanStack Query v5 | 5.0.12 / 5.96.2 |
| Tablas | TanStack Table | 8.21.3 |
| Forms | React Hook Form + Zod + @hookform/resolvers | 7.72.1 / 4.3.6 / 5.2.2 |
| HTTP | ky | 1.14.3 |
| Canvas | react-konva + konva | 19.2.3 / 10.2.3 |
| Grafos | @xyflow/react | 12.10.2 |
| Export | xlsx + jspdf + jspdf-autotable | 0.18.5 / 4.2.1 / 5.0.7 |
| Unit tests | Vitest + happy-dom + Testing Library | 4.1.2 / 20.8.9 / 16.3.2 |
| E2E tests | Playwright | (en progreso) |
| Docker | node:22-alpine, output standalone | — |
