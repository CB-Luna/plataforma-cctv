# 08 — Verification Matrix

> Fecha: 2026-04-05 (actualizado tras runtime verification)
> Estado: VERIFICADO RUNTIME — login, me, menu, settings, inventory, clients, tenants OK. GAP-04/05 confirmados.

---

## Objetivo

Tabla única de verdad con estado de verificación de cada elemento crítico del proyecto, cruzando múltiples fuentes de evidencia.

---

## Leyenda

| Estado | Significado |
|---|---|
| ✅ VERIFICADO | Confirmado en al menos una fuente primaria de código |
| ❌ GAP-MISSING | No existe en ninguna fuente. Es funcionalidad faltante. |
| ⚠️ INFERIDO | Asumido pero no confirmado contra código ni runtime |
| 🔲 PENDIENTE RUNTIME | Existe en código pero no probado contra servidor real |

---

## Auth & Sesiones

| Módulo | Endpoint / Campo | main.go | swagger.json | handler .go | migration .sql | Runtime test | Estado final | Impacto en fases | Decisión temporal |
|---|---|---|---|---|---|---|---|---|---|
| Login | `POST /auth/login` | ✅ L113 | ✅ | ✅ auth.go:Login | — | ✅ 200 (token+tenant) | ✅ VERIFICADO RUNTIME | Fase 1 | Campo `access_token` (no `token`) |
| Register | `POST /auth/register` | ✅ L113 | ✅ | ✅ auth.go:Register | — | — | ✅ VERIFICADO | Fase 1 | — |
| Logout | `POST /auth/logout` | ✅ L115 | ✅ | ✅ auth.go:Logout | — | — | ✅ VERIFICADO | Fase 1 | — |
| Me | `GET /auth/me` | ✅ L128 | ✅ | ✅ auth.go:Me | — | ✅ 200 | ✅ VERIFICADO RUNTIME | Fase 1 | — |
| Refresh token | `POST /auth/refresh` | ❌ | ❌ | ❌ | — | ✅ 404 confirmado | ❌ GAP-MISSING (GAP-04) | Fase 1 | Redirect a login en 401 |
| Switch company | `POST /auth/switch-company` | ❌ | ❌ | ❌ | — | ✅ 404 confirmado | ❌ GAP-MISSING (GAP-05) | Fase 1 | Logout + re-login |

---

## Menú Dinámico

| Módulo | Endpoint / Campo | main.go | swagger.json | handler .go | migration .sql | Runtime test | Estado final | Impacto en fases | Decisión temporal |
|---|---|---|---|---|---|---|---|---|---|
| Menú usuario | `GET /menu` | ✅ L178 | ✅ | ✅ menu_handler.go:GetMenu | — | ✅ 200 | ✅ VERIFICADO RUNTIME | Fase 1 | — |
| ⚠️ Ruta correcta | **Es `GET /menu`, NO `GET /menu/user`** | ✅ confirmado | — | — | — | — | ✅ CORREGIDO | Fase 1 | Corregido en 05_SIDEMENU |
| Menu CRUD | `/menu/items/*` + `/menu/templates/*` | ✅ 23 rutas | parcial | ✅ menu_handler.go | — | — | ✅ VERIFICADO | Fase 5 | — |

---

## Esquema de BD — Campos Disputados

| Módulo | Tabla.Campo | migration .sql | Tipo SQL | Estado previo | Estado final | Impacto en fases | Decisión |
|---|---|---|---|---|---|---|---|
| Mapa | `cctv.sites.latitude` | ✅ 000005 | `DECIMAL(10,8)` | ⚠️ INFERIDO (06_S06) / ✅ (02_NOM) | ✅ VERIFICADO | Fase 2 desbloqueada | Usar directamente |
| Mapa | `cctv.sites.longitude` | ✅ 000005 | `DECIMAL(11,8)` | ⚠️ INFERIDO (06_S06) / ✅ (02_NOM) | ✅ VERIFICADO | Fase 2 desbloqueada | Usar directamente |
| Floor plans | `cctv.areas.floor_number` | ✅ 000005 | `VARCHAR(20)` | ⚠️ INFERIDO (06_S07) / ✅ (02_NOM) | ✅ VERIFICADO | Fase 6 desbloqueada | Filtrar áreas por piso |

---

## Sites & Areas

| Módulo | Endpoint / Campo | main.go | swagger.json | handler .go | migration .sql | Runtime test | Estado final | Impacto en fases | Decisión temporal |
|---|---|---|---|---|---|---|---|---|---|
| Sites listado | `GET /inventory/floor-plans/sites` | ✅ | ❌ | ✅ floor_plans.go | ✅ tabla existe | ✅ 200 | ✅ VERIFICADO RUNTIME | Fase 2 | Usar como fuente de sites |
| Sites CRUD | `GET/POST/PUT/DELETE /sites` | ❌ | ❌ | ❌ | ✅ tabla existe | — | ❌ GAP-MISSING (GAP-01) | Fase 2 | Lista readonly vía floor-plans. CRUD = placeholder. |
| Areas CRUD | `GET/POST/PUT/DELETE /areas` | ❌ | ❌ | ❌ | ✅ tabla existe | — | ❌ GAP-MISSING (GAP-02) | Fase 2 | Mock data / extraer de inventario |
| Sites coords | `latitude`, `longitude` | — | — | — | ✅ 000005 | — | ✅ VERIFICADO | Fase 2 mapa | Usar directamente |

---

## Inventario CCTV

| Módulo | Endpoint / Campo | main.go | swagger.json | handler .go | migration .sql | Runtime test | Estado final | Impacto en fases | Decisión temporal |
|---|---|---|---|---|---|---|---|---|---|
| NVR CRUD | `/inventory/nvrs/*` (8) | ✅ | ✅ | ✅ | ✅ | — | ✅ VERIFICADO | Fase 3 | — |
| Cameras CRUD | `/inventory/cameras/*` (6) | ✅ | ✅ | ✅ | ✅ | — | ✅ VERIFICADO | Fase 3 | — |
| Semantic search | `GET /inventory/models/search/semantic` | ✅ | ❌ | ✅ | — | — | ✅ VERIFICADO (sin Swagger) | Fase 3 | — |
| Import batches | `/inventory/import/*` (11) | ✅ | parcial | ✅ | — | — | ✅ VERIFICADO | Fase 3 | — |
| Floor plans | `/inventory/floor-plans/*` (3) | ✅ | ❌ | ✅ | — | 🔲 PENDIENTE | ✅ VERIFICADO (sin Swagger) | Fase 6 | — |
| Summary | `GET /inventory/summary` | ✅ | ✅ | ✅ | — | ✅ 200 | ✅ VERIFICADO RUNTIME | Fase 3 | — |

---

## Tickets & Operación

| Módulo | Endpoint / Campo | main.go | swagger.json | handler .go | migration .sql | Runtime test | Estado final | Impacto en fases | Decisión temporal |
|---|---|---|---|---|---|---|---|---|---|
| Tickets CRUD | `/tickets/*` (12) | ✅ | parcial | ✅ | ✅ | — | ✅ VERIFICADO | Fase 4 | — |
| Policies CRUD | `/policies/*` (7) | ✅ | ❌ | ✅ | ✅ | — | ✅ VERIFICADO (sin Swagger) | Fase 4 | — |
| SLA CRUD | `/sla/policies/*` (4) | ✅ | ❌ | ✅ | ✅ | — | ✅ VERIFICADO (sin Swagger) | Fase 4 | — |
| Clients | `/clients/*` (3) | ✅ | ✅ | ✅ | ✅ | ✅ 200 | ✅ VERIFICADO RUNTIME | Fase 2 | — |
| Mantenimiento | `/maintenance/*` | ❌ | ❌ | ❌ | ✅ tabla existe | — | ❌ GAP-MISSING (GAP-06) | Fase 4 | Omitir / placeholder |

---

## Admin & Sistema

| Módulo | Endpoint / Campo | main.go | swagger.json | handler .go | migration .sql | Runtime test | Estado final | Impacto en fases | Decisión temporal |
|---|---|---|---|---|---|---|---|---|---|
| Users CRUD | `/users/*` (10) | ✅ | ✅ | ✅ | ✅ | — | ✅ VERIFICADO | Fase 5 | — |
| Roles & Perms | `/roles/*` + `/permissions/*` (8) | ✅ | ✅ | ✅ | ✅ | — | ✅ VERIFICADO | Fase 5 | — |
| Settings | `GET /settings` + `PUT /settings` + `PUT /settings/theme` (3) | ✅ | ✅ | ✅ | — | ✅ 200 (`GET /settings` incluye colores) | ✅ VERIFICADO RUNTIME | Fase 1 (theme) | ⚠️ NO existe `GET /settings/theme` — usar `GET /settings` que retorna `primary_color`, `secondary_color`, `tertiary_color` |
| Storage | `/storage/*` (9) | ✅ | parcial | ✅ | — | — | ✅ VERIFICADO | Fase 5 | — |
| Intelligence | `/intelligence/*` (12) | ✅ | parcial | ✅ | — | — | ✅ VERIFICADO | Fase 5 | — |
| Tenants CRUD | `/tenants/*` (8) | ✅ | ✅ | ✅ | ✅ | ✅ 200 | ✅ VERIFICADO RUNTIME | Fase 2 | — |
| Dashboard | `/dashboard/*` (10) | ✅ | ✅ | ✅ | — | — | ✅ VERIFICADO | Fase 1-4 | — |
| Auditoría | `GET /audit-logs` | ❌ | ❌ | ❌ | ✅ tabla existe | — | ❌ GAP-MISSING (GAP-07) | Fase 5 | Placeholder |
| Config global | `GET /system/config` | ❌ | ❌ | ❌ | — | — | ❌ GAP-MISSING (GAP-09) | Fase 5 | Reusar /settings |

---

## Conteo Total Reconciliado

| Métrica | Valor anterior | Valor corregido | Fuente |
|---|---|---|---|
| Rutas HTTP en main.go | "87" (01_PLAN) / "~107" (03_AUDIT) | **146** (144 API + health + swagger) | `grep .GET\|.POST\|.PUT\|.DELETE\|.PATCH en main.go` |
| Endpoints menu | "17" (03_AUDIT header) | **23** | Conteo de filas en tabla de 03_AUDIT |
| Endpoints storage (protegido) | "8" (03_AUDIT header) | **9** | Conteo de filas |
| Endpoints intelligence | "11" (03_AUDIT header) | **12** | Conteo de filas |
| Endpoints import | "9" (03_AUDIT header) | **11** | Conteo de filas |
| Endpoints tickets | "10" (03_AUDIT header) | **12** | Conteo de filas |
| auth/refresh en Swagger | "Sí" (03_AUDIT, 06_S10, 07_GAP04) | **No** | `grep refresh swagger.json` → solo campo DTO |
| auth/switch-company en Swagger | "Sí" (03_AUDIT, 06_S10, 07_GAP05) | **No** | `grep switch swagger.json` → 0 paths |
| sites.latitude/longitude | "INFERIDO" (06_S06) | **VERIFICADO** en migración 000005 | `DECIMAL(10,8)` / `DECIMAL(11,8)` |
| areas.floor_number | "INFERIDO" (06_S07) | **VERIFICADO** en migración 000005 | `VARCHAR(20)` |
| Menú usuario endpoint | `GET /menu/user` (05, 06_S05) | `GET /menu` | main.go L178 |

---

## Resumen de Gaps Activos (post-reconciliación)

| GAP | Tipo | Módulo | Bloquea | Prioridad |
|---|---|---|---|---|
| GAP-01 | MISSING | Sites CRUD | Fase 2 parcial | 🔴 Alta |
| GAP-02 | MISSING | Areas CRUD | Fase 2 parcial | 🟡 Media |
| ~~GAP-03~~ | ~~RESUELTO~~ | ~~Sites coords~~ | — | ✅ Cerrado |
| GAP-04 | MISSING | auth/refresh | Fase 1 (UX de sesión) | 🔴 Alta |
| GAP-05 | MISSING | auth/switch-company | Fase 1 (multi-empresa) | 🟡 Media |
| GAP-06 | MISSING | Mantenimiento preventivo | Fase 4 parcial | 🟢 Baja |
| GAP-07 | MISSING | Auditoría/logs | Fase 5 parcial | 🟢 Baja |
| GAP-08 | N/A (client-side) | Topología | Fase 6 | 🟢 Baja |
| GAP-09 | MISSING | Config global sistema | Fase 5 parcial | 🟢 Baja |
| GAP-10 | FUERA ALCANCE | Billing | — | ⚪ |

---

## Ítems Pendientes de Runtime Test

Los siguientes endpoints están verificados en código pero deben probarse contra el servidor real antes de construir su módulo frontend:

1. `POST /auth/login` → Fase 1
2. `GET /auth/me` → Fase 1
3. `GET /menu` → Fase 1
4. `GET /settings/theme` → Fase 1
5. `GET /inventory/summary` → Fase 3
6. `GET /inventory/floor-plans/sites` → Fase 2
7. `GET /inventory/floor-plans/site/:siteId` → Fase 6
8. `GET /clients` → Fase 2
9. `GET /tenants` → Fase 2
10. `POST /auth/refresh` → Confirmar 404 (GAP-04)
11. `POST /auth/switch-company` → Confirmar 404 (GAP-05)

> Ver `scripts/verify-api.ps1` para la batería de pruebas automatizada.
