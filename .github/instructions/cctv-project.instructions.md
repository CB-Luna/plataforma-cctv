---
description: "Usar al trabajar en cualquier parte del monorepo sistema-camaras-mono. Define reglas del backend inmutable, frontend Next.js, arquitectura de roles del sistema, criterio de validacion real vs mock, y direccion actual del producto visible."
applyTo: "**"
---
# SyMTickets CCTV — Instrucciones del Monorepo (Plataforma Multi-Tenant)

## Lenguaje

Responde siempre en **espanol**. Los comentarios en codigo tambien deben estar en **espanol**.

---

## Concepto central del producto

**SyMTickets CCTV no es un sistema de camaras. Es una plataforma multi-tenant configurable que construye sistemas CCTV personalizados por empresa.**

```
[ ADMIN DEL SISTEMA ]         — Nivel 1: Gobierna la plataforma completa
        ↓
[ EMPRESAS (TENANTS) ]        — Nivel 2: Cada empresa es un sistema armado
        ↓
[ SUCURSALES ]                — Nivel 3: Operacion diaria de campo
        ↓
[ INFRAESTRUCTURA CCTV ]     — Nivel 4: Camaras, NVRs, planos
```

Cada empresa nace a partir de una combinacion de:
- identidad visual (tema)
- capacidades habilitadas (modulos y packs)
- estructura de acceso (roles + permisos)
- servicios funcionales por rol

---

## Arquitectura de roles — CRITICO

### Rol: Admin del Sistema (Platform Admin / Super Admin)

- Es usuario **global**, no pertenece a ninguna empresa
- Opera la plataforma como producto, no como cliente
- NO debe ver datos de una empresa por defecto al iniciar sesion
- Su contexto de inicio es SIEMPRE: **Modo Plataforma** (global)
- Puede entrar a revisar cualquier empresa, pero solo bajo seleccion explicita

**Responsabilidades del Admin del Sistema:**
1. Crear / editar / activar / suspender empresas
2. Definir modulos, packs, temas reutilizables
3. Crear roles globales y plantillas de roles para empresas
4. Configurar permisos base y servicios por rol
5. Supervisar metricas globales del producto
6. Acceder a cualquier tenant en modo inspeccion

**NO hace:**
- Operar camaras del dia a dia
- Pertenecer a una sucursal
- Ver datos de empresa sin seleccionarla explicitamente

### Rol: Admin de Empresa (Tenant Admin)

- Pertenece estrictamente a su empresa
- Ve y administra solo su empresa
- Puede crear usuarios internos, roles internos, sucursales
- No puede ver otras empresas ni alterar configuracion global
- Al iniciar sesion entra directamente al **Portal Tenant** de su empresa

### Regla de separacion de contextos — NUNCA mezclar

La UI debe dejar siempre claro en cual contexto esta el usuario:

| Contexto | Quien lo ve | Que muestra |
|---|---|---|
| Plataforma global | Admin del Sistema | Metricas globales, lista de empresas, configuracion de plataforma |
| Workspace de empresa | Admin del Sistema inspeccionando un tenant | Datos de ESA empresa, switch visible de regreso |
| Portal Tenant real | Admin Empresa / usuarios tenant | Shell de esa empresa, modulos habilitados, datos propios |

Si en algun componente se mezclan estos tres contextos sin distincion clara, es un bug de arquitectura y debe corregirse.

---

## Estructura del monorepo

```text
sistema-camaras-mono/
|-- cctv_server/   - Backend Go 1.24 (INMUTABLE)
|-- cctv_web/      - Frontend Next.js (producto visible en evolucion)
|-- cctv_mobile/   - App Flutter (inicial)
|-- docker/        - Contenedores auxiliares
|-- scripts/       - Scripts PowerShell y shell
`-- docs/          - Documentacion unificada del monorepo
```

---

## Puertos

| Servicio | Puerto |
|---|---|
| Backend API | `8088` |
| Frontend dev (standalone) | `3011` |
| Frontend Docker historico | `3010` |
| PostgreSQL | `5438` |
| pgAdmin | `5058` |
| MinIO | `9010` |

**Regla:** Antes de validar una pantalla real, revisar `cctv_web/package.json` y confirmar la URL levantada. No asumir `3010`.

---

## `cctv_server` — Backend Go (INMUTABLE)

- **NUNCA modificar `cctv_server/`**
- Tratar el backend como contrato fijo
- Si un endpoint no existe, documentarlo como GAP
- No inventar endpoints ni fingir que un flujo funciona si depende de backend inexistente

### GAPs conocidos

| GAP | Endpoint faltante | Consecuencia en frontend |
|---|---|---|
| GAP-01 | `POST/PUT/DELETE /sites` | CRUD de sucursales no operable |
| GAP-03 | Lat/lng de sites no expuesto | Mapa con posicion sintetica solamente |
| GAP-04 | `POST /auth/refresh` | Sin refresh silencioso; 401 redirige a login |
| GAP-05 | `POST /auth/switch-company` | Cambio de empresa requiere clearAuth + re-login |
| GAP-06 | `CRUD /preventive-maintenance/*` | Modulo mantenimiento preventivo no operativo |
| GAP-07 | `GET /audit/logs` | Auditoria global no disponible |
| GAP-08 | Upload de avatar / logo de usuario | Imagen de perfil no persiste en backend |
| GAP-09 | `/inventory/summary` devuelve 500 sin tenant activo | Admin sistema ve errores en Inventario e Imports |
| GAP-10 | `POST/PUT/DELETE /sites` (alias GAP-01) | Empresas no pueden crear/editar/eliminar sus sucursales |

---

## `cctv_web` — Frontend Next.js

### Stack tecnico

- Next.js App Router (`output: "standalone"`, puerto 3011)
- `ky` para HTTP (nunca `fetch` directo ni `axios`)
- TanStack Query para estado servidor
- Zustand para estado cliente
- React Hook Form + Zod para formularios
- shadcn/ui + Tailwind 4 para UI
- Fuente actual: Inter (Google Fonts via `next/font/google`)
- Vitest para unit tests
- Playwright para E2E

### Reglas de frontend

- Todos los wrappers HTTP van en `src/lib/api/`
- El cliente base es `src/lib/api/client.ts`
- Nunca llamar HTTP desde componentes si ya existe wrapper
- Reutilizar componentes compartidos antes de crear variantes nuevas
- No agregar notas de desarrollo o comentarios de fase visible al usuario final en la UI
- No mostrar texto glitchado (acentos rotos como `T??cnico`, `Mar??a`) — usar UTF-8 sin BOM en todos los archivos

### Patrones de contexto en componentes

- Usar `usePermissions()` para saber el rol
- Usar `useTenantStore()` para saber si hay empresa activa
- Si el usuario es Admin del Sistema (`isSystemAdmin` o perfil sin empresa), la UI debe adaptarse y NO mostrar datos de ningun tenant por defecto
- Si un endpoint devuelve 500 porque no hay contexto de tenant, el componente debe manejar ese caso mostrando un estado vacio o un mensaje claro, no un error crudo

---

## `cctv_mobile` — Flutter

Arquitectura obligatoria por feature:

```text
lib/
|-- core/
`-- features/
    `-- <feature>/
        |-- data/
        |-- domain/
        `-- presentation/
```

Reglas: BLoC para estado, DI centralizada en `core/di/`, red en `core/network/`.

---

## Estado real del producto visible (abril 2026)

### Que funciona
- Onboarding de empresas (creacion + admin inicial)
- Branding base por tenant (tema visual)
- Modulos habilitados por tenant
- Bootstrap de admin inicial con rol y credenciales
- Runtime por tenant (rutas protegidas por servicios)
- Dialogo de empresa: identidad, servicios, onboarding

### Bugs conocidos activos

| ID | Pantalla | Problema |
|---|---|---|
| BUG-01 | Dashboard (Admin Sistema) | Muestra bloque "Operacion del tenant: Empresa X" cuando no corresponde |
| BUG-02 | Dashboard | Tiene "Accesos rapidos" que el Admin Sistema no necesita |
| BUG-03 | Sidebar (Admin Sistema) | Tiene accesos directos redundantes a tabs de Configuracion (Empresas, Servicios y Paquetes, Plantilla menu) |
| BUG-04 | Inventario + Imports | 500 errors al ver como Admin Sistema (endpoint sin tenant activo) |
| BUG-05 | Imports + Map | Notas de desarrollo visibles al usuario final |
| BUG-06 | CAPEX | Sin paginacion, garantia siempre "Sin info", estado solo punto gris, sin filtro por empresa/sucursal |
| BUG-07 | Creacion de usuario | No permite foto de perfil |
| BUG-08 | Varios | Texto con acentos rotos (T??cnico, Mar??a) |
| BUG-09 | Sidebar (Portal Tenant) | Logo de empresa no se muestra aunque se haya asignado |
| BUG-10 | Global | Fuente muy parecida a Times New Roman, no enterprise |
| BUG-11 | Configuracion → Roles (Portal Tenant) | Roles de sistema (super_admin, tenant_admin) visibles para empresas — no deben serlo |
| BUG-12 | Global | Temas asignados a empresas/usuarios no se aplican visualmente — variables CSS no se inyectan |
| BUG-13 | Dropdowns de empresa | Empresas creadas realmente desde la UI no aparecen en selectores (solo aparecen seeds/hardcoded) |
| BUG-14 | Configuracion → Storage (Admin Sistema) | Texto dice "para este tenant" cuando el Admin Sistema no es un tenant |
| BUG-15 | /cameras, /nvrs | El Admin del Sistema puede agregar equipos sin seleccionar empresa ni sucursal |
| BUG-16 | Portal Tenant | Empresas no pueden crear sucursales (GAP-01 backend + falta UI) |
| BUG-17 | /map, /cameras, /nvrs, /tickets | Pantallas de operacion no estan encapsuladas por tenant — muestran datos de todas las empresas |

---

## Documentacion de producto visible

Antes de tocar `Dashboard`, `Configuracion`, `Empresas`, `Header`, `Sidebar` o `Portal Tenant`:

- `docs/producto-visible/03_ARQUITECTURA_VISUAL_GLOBAL_VS_TENANT.md`
- `docs/producto-visible/04_DASHBOARD_GLOBAL_OBJETIVO.md`
- `docs/producto-visible/05_CONFIGURACION_GLOBAL_OBJETIVO.md`
- `docs/producto-visible/06_PORTAL_TENANT_OBJETIVO.md`
- `docs/producto-visible/07_PROPUESTA_DE_REESTRUCTURA_DE_MENUS_Y_SHELLS.md`
- `docs/producto-visible/08_PLAN_DE_EJECUCION_PRODUCTO_VISIBLE.md`
- `.github/instructions/visible-product-handoff.md`
- `.github/PLAN_DE_ACCION.md` — plan de accion activo por fases

---

## Regla de validacion

Toda entrega debe distinguir entre:

1. **Evidencia mockeada** — datos hardcodeados o mocks de test
2. **Evidencia de UI real** — pantalla levantada con datos reales
3. **Flujo real con backend** — endpoint real respondiendo con datos reales

Un checkpoint solo se cierra si la experiencia es verificable en la instancia real del repo y el flujo corresponde al backend actual.

---

## Direccion de implementacion (orden recomendado)

1. Higiene global (font, encoding, notas de desarrollo visibles)
2. Shell del Admin del Sistema — separacion limpia de contexto
3. Dashboard Global real para Admin del Sistema
4. Modulo Inventario + Imports — manejo correcto de contexto sin tenant
5. Modulos de operacion (CAPEX, Tickets, Clientes)
6. Imagen de perfil de usuario
7. Portal Tenant — logo, nombre, identidad visual
8. Mejoras enterprise generales

---

## Scripts y levantamiento

```powershell
.\scripts\up.ps1
.\scripts\down.ps1

cd cctv_web
npm install
npm run dev
npm run build
npm test
npm run test:e2e
```

---

## Regla final

Si una IA encuentra discrepancia entre codigo, docs antiguas, specs mockeados y runtime real, priorizar:

1. Runtime real
2. Contrato backend real
3. Docs recientes de `docs/producto-visible/` y `.github/PLAN_DE_ACCION.md`

cada vez que finalices lo ultimo que harás será ejecutar G:\TRABAJO\FLUTTER\sistema camaras\sistema-camaras-mono\scripts\docker-reset-frontend.ps1 para limpiar cache y levantar la instancia real sin interferencias de datos anteriores o mocks.

**Nunca cerrar una fase solo porque existe codigo o documentacion. Solo si la experiencia visible en runtime lo confirma.**
