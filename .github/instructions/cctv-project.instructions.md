---
description: "Usar al trabajar en cualquier parte del monorepo sistema-camaras-mono. Define reglas del backend inmutable, frontend Next.js, criterio de validacion real vs mock, y direccion actual del producto visible."
---
# Sistema Camaras - Instrucciones del Monorepo

## Lenguaje

Responde siempre en **espanol**. Los comentarios en codigo tambien deben estar en **espanol**.

## Estructura del monorepo

```text
sistema-camaras-mono/
|-- cctv_server/   - Backend Go 1.24
|-- cctv_web/      - Frontend Next.js
|-- cctv_mobile/   - App Flutter
|-- docker/        - Contenedores auxiliares
|-- scripts/       - Scripts PowerShell y shell
`-- docs/          - Documentacion unificada
```

## Puertos

Puertos historicos del repositorio:

| Servicio | Puerto |
| --- | --- |
| Backend API | `8088` |
| Frontend historico | `3010` |
| PostgreSQL | `5438` |
| pgAdmin | `5058` |
| MinIO | `9010` |

### Frontend actual

El frontend actual de `cctv_web/` corre con:

- `npm run dev` en `http://localhost:3011`
- `npm run start` en `http://localhost:3011`

No asumir `3010` como referencia confiable. Antes de validar UI visible, revisar `cctv_web/package.json` y confirmar la URL real del runtime.

## `cctv_server` - Backend Go

- **NUNCA modificar** `cctv_server/`.
- Tratar el backend como contrato fijo.
- Si un endpoint no existe, marcarlo como GAP.
- No inventar endpoints ni soluciones de backend.

### GAPs conocidos relevantes

| GAP | Endpoint faltante | Consecuencia |
| --- | --- | --- |
| GAP-01 | `POST/PUT/DELETE /sites` | No existe CRUD completo de sitios |
| GAP-03 | Sites sin lat/lng expuesto de forma cerrada | Mapa y sucursales quedan parciales |
| GAP-04 | `POST /auth/refresh` | No hay refresh silencioso |
| GAP-05 | `POST /auth/switch-company` | Cambio de empresa real no existe; requiere clearAuth + re-login |
| GAP-06 | `CRUD /preventive-maintenance/*` | Dominio no operativo aun |
| GAP-07 | `GET /audit/logs` | Auditoria no disponible |

## `cctv_web` - Frontend Next.js

### Stack

- Next.js App Router
- `ky` para HTTP
- TanStack Query para estado servidor
- Zustand para estado cliente
- React Hook Form + Zod para formularios
- shadcn/ui + Tailwind 4 para UI
- Vitest para unit tests
- Playwright para E2E

### Reglas de frontend

- Todos los wrappers HTTP van en `src/lib/api/`.
- El cliente base es `src/lib/api/client.ts`.
- Nunca usar `fetch` directo ni `axios`.
- No hacer llamadas HTTP en componentes si ya existe wrapper.
- Reutilizar componentes compartidos antes de crear variantes nuevas.

## `cctv_mobile` - Flutter

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

Reglas:

- BLoC para estado
- DI centralizada en `core/di/`
- red centralizada en `core/network/`

## Estado actual del producto visible

El repo tiene avances reales en:

- empresas y onboarding
- branding base por tenant
- servicios o modulos habilitados
- bootstrap de admin inicial
- runtime por tenant

Pero todavia **no debe considerarse resuelto** el producto visible.

### Problema dominante actual

La UI sigue mezclando demasiado:

- backoffice global
- workspace de empresa
- preview tenant
- portal tenant real

### Regla nueva de producto visible

No aceptar una shell hibrida ambigua como estado por defecto.

La interfaz debe dejar clarisimo:

1. cuando el usuario esta en plataforma global
2. cuando esta preparando una empresa
3. cuando esta viendo un preview
4. cuando esta dentro del portal tenant real

## Documentacion obligatoria antes de tocar UX visible

Toda IA que vaya a tocar `Dashboard`, `Configuracion`, `Empresas`, `Header`, `Sidebar` o `Portal tenant` debe revisar primero:

- `docs/producto-visible/03_ARQUITECTURA_VISUAL_GLOBAL_VS_TENANT.md`
- `docs/producto-visible/04_DASHBOARD_GLOBAL_OBJETIVO.md`
- `docs/producto-visible/05_CONFIGURACION_GLOBAL_OBJETIVO.md`
- `docs/producto-visible/06_PORTAL_TENANT_OBJETIVO.md`
- `docs/producto-visible/07_PROPUESTA_DE_REESTRUCTURA_DE_MENUS_Y_SHELLS.md`
- `docs/producto-visible/08_PLAN_DE_EJECUCION_PRODUCTO_VISIBLE.md`
- `.github/instructions/visible-product-handoff.md`

## Regla de validacion

Toda futura entrega debe distinguir entre:

1. evidencia mockeada
2. evidencia de UI real
3. flujo real con backend actual

### Regla de aceptacion

No presentar evidencia mockeada como si confirmara producto real resuelto.

Un checkpoint de producto visible solo se considera valido si:

- el cambio se percibe en la instancia real correcta
- la UI visible cambia de forma clara
- el ownership queda mas limpio
- y el backend actual realmente soporta lo que se afirma

## Direccion correcta de implementacion visible

Orden recomendado:

1. limpieza visual global
2. limpieza de `Configuracion` por ownership
3. `Dashboard global` real
4. `Portal tenant` real
5. `Empresas o Clientes -> Sucursales -> Acceder a infraestructura`

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

## Regla final

Si una futura IA encuentra una discrepancia entre:

- codigo interno
- docs antiguas
- specs mockeados
- y runtime real

debe priorizar:

1. runtime real
2. contrato backend real
3. docs recientes de `docs/producto-visible/`

Nunca cerrar una fase visible solo porque existe codigo o documentacion.
