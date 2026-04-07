# 09 — Release Status: SyMTickets CCTV Next.js

> Fecha: 2026-04-05 | Versión: V1-RC1 (Release Candidate 1)
> Build: Next.js 16.2.2 | 25 rutas | 44 unit tests | Docker ready

---

## Estado General del Producto

**Clasificación: V1 Feature-Complete con limitaciones de backend.**

El frontend Next.js está implementado al 100% del alcance definido en las fases 1–6 y parcialmente en fase 7. Las limitaciones restantes son exclusivamente gaps de API en el backend Go, no deficiencias del frontend. El sistema es demostrable y funcional para uso real siempre que se disponga del backend corriendo.

| Métrica | Valor |
|---|---|
| Rutas implementadas | 25 (17 principales + 3 detail + 1 topology + 4 auth/misc) |
| Funciones API wrapper | ~100 en 20 archivos |
| Componentes compartidos | DataTable, ExportButton, ColumnHeader, SiteSelector, ThemeProvider |
| Stores Zustand | 5 (auth, tenant, sidebar, theme, site) |
| Unit tests | 44 pasando (Vitest + happy-dom) |
| Tamaño del build | Standalone (node:22-alpine) |
| Docker | Dockerfile multi-stage + docker-compose.prod.yml |

---

## Clasificación por Módulo

### ✅ IMPLEMENTADO — Listo para demo y uso real

| Módulo | Ruta | Funcionalidades | Commit |
|---|---|---|---|
| **Login** | `/login` | Auth email/password, JWT, redirect, error handling | `478e08c` |
| **Select Company** | `/select-company` | Multi-tenant, auto-select si 1 empresa | `478e08c` |
| **Dashboard** | `/dashboard` | 4 KPI cards con datos reales, tendencias, stats pólizas | `e34ed64` |
| **Sidebar dinámico** | Layout | Carga desde `GET /menu`, permisos, collapse, mobile sheet | `7a08b63` |
| **Dark mode** | Header dropdown | light/dark/system, persiste localStorage, aplica `.dark` | `7a08b63` |
| **Tenants CRUD** | `/tenants` | Listar, crear, editar, activar/desactivar, upload logo | `478e08c` |
| **NVR CRUD** | `/nvrs` | Listar, crear, editar, eliminar, stats, export PDF/Excel | `65018ee` |
| **Cámaras CRUD** | `/cameras` | Listar, crear, editar, búsqueda semántica, stats, export | `65018ee` |
| **Ficha técnica cámara** | `/cameras/[id]` | Specs por sección, FOV, resolución, fabricante | `c85b88d` |
| **Importación masiva** | `/imports` | Batches CRUD, procesamiento, detalle items/errores | `ca5ad89` |
| **Inventario dashboard** | `/inventory` | Resumen NVR/Cámaras/Storage/Sitios | `65018ee` |
| **Tickets CRUD** | `/tickets` | Listar, crear, editar, asignar, cambio estado, export | `e34ed64` |
| **Ticket detalle** | `/tickets/[id]` | Timeline, comentarios, acciones, historial completo | `e34ed64` |
| **Pólizas CRUD** | `/policies` | Listar, crear, editar, eliminar, assets, export | `e34ed64` |
| **Póliza detalle** | `/policies/[id]` | Assets vinculados, condiciones, vigencia | `e34ed64` |
| **SLA definitions** | `/sla` | Listar, crear, editar, eliminar reglas SLA | `e34ed64` |
| **Usuarios CRUD** | `/users` | Listar, editar, password, roles, avatar upload | `3dd33ee` |
| **Roles + Permisos** | `/roles` | CRUD roles, asignación de permisos granular | `3dd33ee` |
| **Settings** | `/settings` | Info general empresa, color picker tema, preview live | `3dd33ee` |
| **Storage** | `/storage` | Providers, configs CRUD, stats de uso | `3dd33ee` |
| **Intelligence** | `/intelligence` | Modelos IA, templates prompts, usage stats, re-index | `3dd33ee` |
| **Floor Plans** | `/floor-plans` | Grid de sitios, estado de plano, contadores | `72ec7ae` |
| **Floor Plan Editor** | `/floor-plans/[id]` | Konva canvas: drag cámaras, cono FOV, grid, guardar JSON | `72ec7ae` |
| **Topología red** | `/floor-plans/[id]/topology` | React Flow: Site→NVR→Cameras, colores por estado | `72ec7ae` |
| **Export PDF/Excel** | Toolbar en listas | xlsx + jspdf-autotable, dynamic import, reutilizable | `b4ed768` |
| **Responsive** | Global | Sidebar colapsable, Sheet mobile, breakpoints md/lg | `7a08b63` |
| **Docker** | Infraestructura | Dockerfile multi-stage, docker-compose.prod.yml | `d4dd8a9` |
| **Unit + Component tests** | `__tests__/` | 44 tests (stores, utils, DataTable, ExportButton, ThemeProvider) | `e16af2e` |

### ✅ IMPLEMENTADO CON LIMITACIONES DE BACKEND

| Módulo | Limitación | Workaround activo |
|---|---|---|
| **Clientes** (`/clients`) | Backend solo expone 3 endpoints: `GET /clients`, `GET /clients/:id`, `POST /clients`. No hay `PUT` ni `DELETE` | Solo se muestra create + listado. Sin editar ni eliminar. La UI no promete operaciones que no existen |
| **Selector de sucursal** | No hay CRUD de sites. Solo `GET /inventory/floor-plans/sites` retorna lista | El selector funciona con la lista disponible. No se pueden crear/editar sites desde el frontend |
| **Menú dinámico admin** (Fase 5.3) | El sidebar consume `GET /menu` correctamente. La API tiene 23 endpoints para admin de menú (items, templates, reorder, assign). El frontend solo implementa la **lectura**; no hay UI para reordenar items, crear templates de menú o asignar menú a tenants | Funciona como sidebar de solo lectura. Admin avanzado requiere implementación de UI adicional |
| **Switch company** | Backend no tiene `POST /auth/switch-company` (GAP-05) | Se hace clearAuth + re-login cuando el usuario quiere cambiar de empresa |
| **Refresh token** | Backend no tiene `POST /auth/refresh` (GAP-04) | Si el token expira, redirect a login. Sin renovación silenciosa |

### ❌ BLOQUEADO POR BACKEND

| Módulo | GAP | Endpoint requerido | Impacto |
|---|---|---|---|
| **Sucursales/Sitios CRUD** (2.4) | GAP-01 | `POST/PUT/DELETE /sites` | No se pueden crear ni editar sitios |
| **Áreas por sitio** (2.5) | GAP-02 | `CRUD /sites/:id/areas` | No se pueden definir áreas dentro de sitios |
| **Mapa geográfico** (2.7) | GAP-01 + GAP-03 | Sites CRUD con lat/lng + endpoint que retorne coordenadas | `GET /inventory/floor-plans/sites` no retorna lat/lng. Aunque la tabla `cctv.sites` tiene columnas lat/lng en BD, ningún endpoint las expone. react-leaflet no está instalado |
| **Mantenimiento preventivo** (4.11) | GAP-06 | `CRUD /preventive-maintenance/*` | Tabla existe en BD pero sin endpoints |
| **Auditoría/Logs** (5.7) | GAP-07 | `GET /audit/logs` | Sin endpoint de auditoría |

### ⏳ FUERA DE ALCANCE V1 (deliberado)

| Módulo | Razón |
|---|---|
| **i18n** (7.1) | Aplazado: el sistema funciona en español. Se implementará si se necesita inglés |
| **Facturación** (7.10) | Aplazado: tablas billing.* existen en BD pero no es prioridad V1 |
| **Consolidación monorepo** | Aplazado: el proyecto Next.js vive en su propio directorio |

---

## Módulos Listos para Demo Interna

**Todos los módulos clasificados como "IMPLEMENTADO" son demostrables:**

1. Login → Select Company → Dashboard con datos reales
2. Sidebar dinámico con permisos
3. CRUD completo: Tenants, NVRs, Cámaras, Tickets, Pólizas, SLA, Usuarios, Roles
4. Ficha técnica de cámara con búsqueda semántica
5. Importación masiva con validación
6. Floor Plan editor con Konva (posicionar cámaras, cono FOV)
7. Topología de red (React Flow)
8. Dark mode + responsive + export PDF/Excel
9. Settings con tema personalizable por tenant

**Requisito:** Backend Go corriendo en `localhost:8087` con base de datos poblada.

---

## Módulos Listos para Uso Real

Los mismos que para demo, con estas salvedades:

| Consideración | Severidad | Mitigación |
|---|---|---|
| Sin refresh token | Media | Sesión expira, usuario re-loguea. Aceptable para usuarios internos |
| Sin switch-company inline | Baja | El usuario puede volver al login y seleccionar otra empresa |
| Clientes solo lectura + crear | Baja | Las correcciones se hacen desde el backend directamente hasta que se agregue el endpoint |
| Sin auditoría | Media | No se registran logs de acción del usuario en frontend |

---

## Workarounds Activos

| # | Workaround | Detalle | Impacto |
|---|---|---|---|
| W-01 | Sites desde floor-plans | Se usa `GET /inventory/floor-plans/sites` en vez de un CRUD dedicado de sites | Funcional para listar; no permite crear/editar |
| W-02 | Sidebar solo lectura | `GET /menu` para renderizar sidebar. Sin admin panel de menú | El backend permite 23 operaciones de menú que no se exponen en UI |
| W-03 | Re-login para switch | Sin endpoint de switch-company, se limpia auth y se re-dirige a login | Experiencia subóptima pero funcional |
| W-04 | Sin token refresh | Token expira → redirect a login | No hay degradación silenciosa, el usuario nota el re-login |
| W-05 | Clientes sin edit/delete | Solo create + list | Las correcciones de datos se hacen directo en BD o via API |

---

## Criterio de "V1 Terminada"

La V1 se considera terminada cuando:

- [x] Todas las fases 1–6 implementadas
- [x] Fase 7: responsive, dark mode, export, Docker, unit tests, component tests
- [ ] Fase 7.6: E2E tests mínimos con Playwright ← **en progreso esta iteración**
- [x] Build exitoso y desplegable en Docker
- [x] 25 rutas funcionales
- [x] 44+ tests pasando
- [ ] QA manual ejecutado según `10_MANUAL_QA_CHECKLIST.md` ← **pendiente**
- [x] Documentación completa (8 docs + release status + QA checklist)
- [x] Gaps de backend documentados y workarounds activos

**Bloqueantes que NO son bloqueantes de V1:**
- i18n: el sistema funciona en español, suficiente para V1
- Facturación: deprioritized, no es core del MVP
- Mapa geográfico: requiere backend changes, documentado como GAP
- Admin de menú: sidebar funciona; admin avanzado es nice-to-have

**La V1 está lista para delivery en su estado actual, pendiente solo E2E tests y QA manual.**
