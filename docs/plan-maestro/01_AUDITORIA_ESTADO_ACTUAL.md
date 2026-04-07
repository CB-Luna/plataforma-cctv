# 01. Auditoría Estado Actual

> Fecha: 2026-04-07  
> Idioma de trabajo: español  
> Alcance principal: `cctv_web/` con contraste contra el contrato real de `cctv_server/`

## Metodología y fuentes auditadas

La auditoría se construyó sobre evidencia directa del repo:

- Estructura del monorepo y scripts raíz.
- Reglas del workspace en `.github/copilot-instructions.md` y `.github/instructions/cctv-project.instructions.md`.
- Rutas reales registradas en `cctv_server/cmd/main.go`.
- Migraciones y queries del backend.
- Páginas, stores, wrappers API y componentes de `cctv_web/src`.
- `npm test` y `npm run build` ejecutados el 2026-04-07.

### Limitación explícita

Las capturas mencionadas por el usuario no estaban disponibles como archivos adjuntos reutilizables dentro de esta auditoría. Para “evidencia UI” se usaron:

- labels, headings, diálogos y rutas presentes en el código,
- el resumen textual de pantallas aportado en la conversación,
- y los tests E2E existentes como señal secundaria de intención funcional.

## Estado general por capa

| Capa | Estado actual | Evidencia |
|---|---|---|
| `cctv_server/` | Backend amplio y utilizable como contrato fijo. No se modifica. | `cctv_server/cmd/main.go`, `cctv_server/internal/handlers/`, `cctv_server/docs/swagger.yaml` |
| `cctv_web/` | Base sólida, buildable, con amplia superficie funcional y varias incoherencias de producto/contrato. | `cctv_web/src/app/`, `cctv_web/src/lib/api/`, `cctv_web/src/stores/` |
| `cctv_mobile/` | Inicial. Tiene auth, home y tickets. No es foco de esta planeación. | `cctv_mobile/lib/features/` |
| Infraestructura | Monorepo real, scripts y Docker presentes. Hay drift documental en puertos. | `docker-compose.yml`, `scripts/*.ps1`, `cctv_web/Dockerfile` |

## Dependencias reales del frontend

La capa web sí está estructurada con stack consistente:

- Next.js 16 + React 19.
- Estado servidor con TanStack Query.
- Estado cliente con Zustand.
- HTTP con `ky`.
- UI con shadcn/ui + Tailwind.
- Tablas con `DataTable`.
- Exportación con `ExportButton`.
- Mapas con `react-leaflet`.
- Planos con `react-konva`.
- Topología con `@xyflow/react`.
- Pruebas unitarias con Vitest.
- E2E con Playwright.

## Estado de integración con backend

### Lo que sí quedó confirmado

- El frontend compila y las rutas existen.
- Los wrappers de API están centralizados.
- El backend real expone rutas para auth, users, roles, permissions, menu, tenants, storage, intelligence, clients, policies, SLA, inventory, import, tickets y dashboard.
- Existe base multi-tenant real con `public.tenants`.
- Existe soporte real de plantillas de menú por tenant.

### Lo que quedó desalineado

| Tema | Estado observado | Impacto |
|---|---|---|
| Puerto backend | Instrucciones del monorepo y Docker apuntan a `8088`, pero el cliente web cae por defecto a `8087`. | Riesgo de integración local y documentación contradictoria. |
| Cambio de empresa | Frontend guarda `tenant_id` y envía `X-Company-ID`; backend usa `tenant_id` del JWT. | El cambio de empresa no queda garantizado en runtime real. |
| Login multiempresa | Backend devuelve `companies` en login, pero frontend no las tipa ni consume. | El selector de empresa no queda sólidamente activado en el flujo actual. |
| `GET /auth/me` | En backend devuelve datos del tenant actual del token. | No sirve por sí solo para reconstruir universo multiempresa. |
| Edición de cámaras | Frontend llama `PUT /inventory/cameras/:id`. No está registrada en `main.go`. | Riesgo de 404 o flujo de edición falso. |
| Importación masiva | UI crea lotes sin archivo real parseado ni `data` útil. Backend requiere `column_mapping` y `data`. | Módulo visualmente prometido, pero operativamente incompleto. |
| Mapa | Frontend sintetiza coordenadas por ciudad o fallback. | El mapa es aproximado, no evidencia geolocalización real. |
| Selector de sucursal | Cambia store local, pero no controla queries del resto del sistema. | Contexto de sitio visible, pero no operativo. |

## Inventario de módulos

### Tabla maestra por módulo

| Módulo | Estado actual | Evidencia en repo | Evidencia en UI | Dependencias | Completitud estimada | Observaciones |
|---|---|---|---|---|---|---|
| Login | Implementado con desalineación multiempresa | `src/app/login/page.tsx`, `src/lib/api/auth.ts` | Pantalla rica, demo presets, error handling | `/auth/login`, `/auth/me` | 70% | La UI está sólida, pero el flujo multiempresa no queda bien resuelto. |
| Selección de empresa | Parcial | `src/app/select-company/page.tsx`, `src/stores/tenant-store.ts` | Ruta y cards existen | `companies` del store | 40% | Depende de un flujo que hoy no se alimenta correctamente desde login. |
| Dashboard | Implementado | `src/app/(dashboard)/dashboard/page.tsx` | KPIs, charts, SLA, tickets | `/dashboard/*`, stats de cámaras y NVR | 85% | Buen nivel de cierre visual y de datos. |
| Sidebar / navegación | Implementado con hardcode | `src/components/layout/sidebar.tsx` | Navegación amplia y consistente | `GET /menu`, auth store | 70% | El backend define menú dinámico real, pero el sidebar usa items hardcodeados y solo aprovecha permisos. |
| Inventario resumen | Implementado | `src/app/(dashboard)/inventory/page.tsx` | Dashboard de inventario | `/inventory/summary`, `/dashboard/inventory/stats` | 85% | Tiene banners de error y comportamiento controlado. |
| Cámaras listado | Implementado con GAP de edición | `src/app/(dashboard)/cameras/page.tsx`, `src/lib/api/cameras.ts` | Tabla, stats, búsqueda, export | `/inventory/cameras`, `/inventory/cameras/stats`, `/inventory/cameras/search` | 75% | Crear, listar y eliminar sí; editar no queda respaldado por la ruta registrada. |
| Ficha técnica cámara | Implementado | `src/app/(dashboard)/cameras/[id]/page.tsx` | Vista de detalle con secciones | `/inventory/cameras/:id` | 85% | Buena lectura de detalle. |
| Fichas técnicas / modelos | Implementado derivado | `src/app/(dashboard)/camera-models/page.tsx` | Catálogo agrupado por modelo | `/inventory/cameras` | 80% | Deriva modelos desde cámaras desplegadas, no desde catálogo maestro independiente. |
| NVR | Implementado | `src/app/(dashboard)/nvrs/page.tsx`, `src/lib/api/nvrs.ts` | Tabla, stats, export, diálogo | `/inventory/nvrs`, `/inventory/nvrs/stats` | 85% | Buen cierre para CRUD y resumen. |
| Planos | Implementado con persistencia parcial | `src/app/(dashboard)/floor-plans/*`, `src/components/floor-plan-editor/*` | Lista, editor, topología | `/inventory/floor-plans/*`, cámaras, NVR | 70% | El editor existe, pero la serialización pierde semántica de varios elementos al guardar. |
| Mapa | Visual + dependiente de workaround | `src/app/(dashboard)/map/page.tsx`, `src/components/map/branch-map.tsx` | Mapa funcional | `listSites()` | 45% | Usa coordenadas inferidas, no lat/lng reales del backend. |
| Importación masiva | Parcial fuerte | `src/app/(dashboard)/imports/*`, `src/lib/api/imports.ts` | Tabla, detalle y diálogo | `/inventory/import/*` | 50% | El diálogo no sube archivo ni prepara datos reales para el backend. |
| Tickets | Implementado con UX cruda | `src/app/(dashboard)/tickets/*`, `src/lib/api/tickets.ts` | Tabla, stats, detalle, timeline, comentarios | `/tickets/*` | 75% | Flujo amplio, pero creación/asignación usa UUIDs manuales en UI. |
| Clientes | Implementado con limitación conocida | `src/app/(dashboard)/clients/*`, `src/lib/api/clients.ts` | Tabla y alta | `/clients` | 65% | No hay edición ni eliminación porque el backend no las expone. |
| Pólizas | Implementado con UX cruda | `src/app/(dashboard)/policies/*`, `src/lib/api/policies.ts` | Tabla, detalle, assets | `/policies/*` | 75% | Funciona, pero asociación de activos usa UUIDs manuales. |
| SLA | Implementado | `src/app/(dashboard)/sla/*`, `src/lib/api/sla.ts` | Tabla y diálogo | `/sla/policies` | 80% | Bien resuelto para CRUD básico. |
| CAPEX / garantías | Implementado derivado | `src/app/(dashboard)/capex/page.tsx` | Vista analítica de garantías | cámaras + NVR | 65% | No es módulo con entidad propia; deriva datos de inventario existente. |
| Usuarios | Implementado dentro de Configuración | `src/app/(dashboard)/settings/tabs/users-tab.tsx` | Tab funcional; `/users` redirige | `/users`, `/roles` | 75% | Opera dentro de `/settings`; no tiene alta de usuario nueva. |
| Empresas / tenants | Implementado dentro de Configuración | `src/app/(dashboard)/settings/tabs/tenants-tab.tsx` | Tab funcional; `/tenants` redirige | `/tenants/*` | 80% | Alta, edición y activación funcionan. No hay UI para logo. |
| Roles y permisos | Parcial | `src/app/(dashboard)/settings/tabs/roles-tab.tsx`, `src/lib/api/roles.ts` | Tab funcional; `/roles` redirige | `/roles`, `/permissions` | 70% | Crear/editar/asignar permisos sí; eliminar rol no está soportado. |
| Tema | Implementado parcial | `src/app/(dashboard)/settings/tabs/general-tab.tsx` | Tab funcional y preview | `/settings`, `/settings/theme` | 70% | Ajusta colores; no cubre toda configuración general. |
| IA | Implementado | `src/app/(dashboard)/settings/tabs/intelligence-tab.tsx` | Tab funcional | `/intelligence/*` | 80% | Buen alcance administrativo. |
| Storage | Implementado | `src/app/(dashboard)/settings/tabs/storage-tab.tsx` | Tab funcional | `/storage/*` | 80% | Buen CRUD de configuraciones. |
| Menú dinámico por tenant | Backend real, frontend solo lectura parcial | `cctv_server/internal/handlers/menu_handler.go`, `src/components/layout/sidebar.tsx` | No hay UI de administración de menú | `/menu/*` | 35% en frontend | Backend expone un módulo amplio; el frontend solo consume lectura de menú y ni siquiera usa toda la estructura dinámica. |
| Selector de sucursal | Visual, no operativo | `src/components/layout/site-selector.tsx`, `src/stores/site-store.ts` | Visible en header | `/inventory/floor-plans/sites` | 25% | No gobierna queries de tickets, cámaras, pólizas ni dashboard. |

## Módulos existentes

Se consideran existentes porque tienen ruta, wrapper o tab funcional y usan datos reales:

- Login.
- Dashboard.
- Inventario.
- Cámaras.
- Ficha técnica de cámara.
- Fichas técnicas por modelo.
- NVR.
- Floor plans.
- Topología.
- Tickets.
- Clientes.
- Pólizas.
- SLA.
- CAPEX/garantías.
- Configuración: usuarios, empresas, roles, tema, IA y storage.

## Módulos parcialmente implementados

- Selección de empresa.
- Cambio de empresa desde header.
- Selector de sucursal.
- Mapa.
- Importación masiva.
- Planos con persistencia completa.
- Menú dinámico por tenant en frontend.
- Roles con ciclo completo de vida.

## Módulos visuales pero incompletos o engañosos

| Módulo / flujo | Qué aparenta | Qué existe realmente |
|---|---|---|
| Cambio de empresa | Parece un switch-company inline en header | Solo cambia store/localStorage; backend no usa `X-Company-ID` para el tenant efectivo |
| Select-company | Parece listo para usuarios multiempresa | El flujo actual del frontend depende de `me.companies`, pero `GET /auth/me` devuelve el tenant actual |
| Importación por archivo | Parece aceptar CSV/Excel | Hoy el diálogo solo captura el nombre del archivo y manda `data: []` |
| Mapa geográfico | Parece ubicación real de sucursales | Las coordenadas se infieren por ciudad o fallback fijo |
| Contexto de sucursal | Parece filtrar el sistema completo | Solo cambia UI local; no gobierna las queries |
| Edición de cámara | Parece CRUD completo | El backend auditado no registra `PUT /inventory/cameras/:id` |

## Qué sí existe en código vs qué solo parece existir en UI

### Sí existe en código y contrato

- CRUD amplio de NVR.
- CRUD de tickets.
- CRUD de pólizas y SLA.
- Gestión de roles, permisos, usuarios, tenants, storage e IA.
- Menú y plantillas de menú en backend.
- Persistencia de floor plans por sitio.

### Existe en código frontend, pero no queda respaldado por el contrato real auditado

- Edición de cámaras.
- Cambio de empresa vía header con `X-Company-ID`.
- Select-company como flujo robusto de multiempresa.

### Existe visualmente, pero hoy funciona como aproximación o placeholder operativo

- Mapa geográfico.
- Importación basada en archivo.
- Selector de sucursal como filtro transversal.
- Search trigger y notificaciones en header.

## Hallazgos técnicos puntuales

### 1. El contrato multiempresa está incompleto en frontend

- `POST /auth/login` devuelve `companies` y acepta `tenant_id` opcional.
- `cctv_web/src/types/api.ts` tipa `LoginResponse` sin `companies`.
- `cctv_web/src/app/login/page.tsx` ignora `companies` de login y depende de `getMe()`.
- `GET /auth/me` devuelve el tenant actual del JWT, no la lista multiempresa.

### 2. El cambio de empresa actual no está alineado al backend real

- El frontend persiste `tenant_id` y manda `X-Company-ID`.
- El backend obtiene el tenant efectivo desde el JWT mediante `middleware.GetTenantID(c)`.
- `TenantMiddleware` solo valida que exista `tenant_id` en token.

Conclusión: el switch actual es, como mínimo, engañoso.

### 3. El selector de sucursal no gobierna el resto del sistema

- `useSiteStore` solo es usado por `SiteSelector`.
- No se encontraron queries de cámaras, tickets, pólizas o dashboard que lean `currentSite`.

### 4. El menú dinámico está subutilizado

- El backend expone un dominio amplio de menú, plantillas e asignaciones por tenant.
- El frontend arma el sidebar con secciones hardcodeadas y usa `GET /menu` solo como apoyo de permisos.

### 5. La importación masiva está a mitad de camino

- El backend requiere `column_mapping` y `data`.
- El diálogo actual no parsea CSV/Excel ni sube archivo al backend.
- El batch puede crearse, pero no con contenido útil desde la UI actual.

### 6. Hay drift documental interno

- `verify-api.ps1` sigue apuntando a `http://localhost:8080`.
- `playwright.config.ts` usa baseURL `http://localhost:3000`.
- La guía del monorepo fija frontend `3010` y backend `8088`.

## Validaciones ejecutadas en esta auditoría

| Validación | Resultado | Fecha |
|---|---|---|
| `npm test` en `cctv_web` | `44` pruebas pasando | 2026-04-07 |
| `npm run build` en `cctv_web` | build exitoso, `25` rutas generadas | 2026-04-07 |
| Playwright | No ejecutado | 2026-04-07 |

## Conclusión de auditoría

El estado actual del repo es:

- suficientemente sólido para planificar ejecución real por fases,
- suficientemente avanzado para evitar más “pantallas por intuición”,
- y suficientemente inconsistente en multi-tenant, contract drift y UX operativa como para que la siguiente fase no deba ser de expansión, sino de consolidación estructural.
