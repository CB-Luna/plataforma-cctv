# Sistema Camaras CCTV - Instrucciones del Workspace

Responde siempre en **espanol**. Los comentarios en codigo tambien deben estar en **espanol**.

## Arquitectura general

Monorepo con tres capas:

| Carpeta | Stack | Estado |
| --- | --- | --- |
| `cctv_server/` | Go 1.24, Gin, sqlc, pgx, MinIO | Contrato fijo, no modificar |
| `cctv_web/` | Next.js, React 19, Tailwind 4, shadcn/ui | Producto visible en evolucion |
| `cctv_mobile/` | Flutter, BLoC, Clean Architecture | Inicial |

## Regla critica: backend inmutable

El backend Go es un contrato fijo.

- **Nunca modificar `cctv_server/`**.
- Si un endpoint no existe, documentarlo como GAP.
- No inventar endpoints.
- No vender como resuelto un flujo que depende de backend inexistente.

Los GAPs de negocio y de API deben tratarse con honestidad en frontend y documentacion.

## Puertos y entorno

Puertos historicos del monorepo:

| Servicio | Puerto |
| --- | --- |
| Backend API | `8088` |
| Frontend historico | `3010` |
| PostgreSQL | `5438` |
| pgAdmin | `5058` |
| MinIO | `9010` |

### Regla importante sobre frontend

El frontend actual de `cctv_web/` usa:

- `npm run dev` -> `http://localhost:3011`
- `npm run start` -> `http://localhost:3011`

No asumir que `3010` es la instancia correcta del repo. Antes de validar una pantalla visible:

1. revisar `cctv_web/package.json`
2. confirmar la URL real levantada
3. distinguir si se esta viendo una instancia vieja, dockerizada o reenviada

## Validacion: siempre distinguir tres niveles

Toda futura IA debe separar claramente:

1. **Evidencia mockeada**
2. **Evidencia de UI real**
3. **Flujo real con backend actual**

### Regla de aceptacion

No presentar evidencia mockeada como si probara producto resuelto.

Un checkpoint de producto visible solo se considera cerrado si la experiencia se puede verificar en la instancia real correcta del repo y el flujo corresponde al backend actual.

## Fuente de verdad actual para producto visible

Antes de proponer cambios en UX, shell, dashboard, configuracion o portal tenant, revisar:

- `docs/producto-visible/00_OBJETIVO.md`
- `docs/producto-visible/01_CHECKPOINT_CONFIGURACION_OPERABLE.md`
- `docs/producto-visible/02_EVIDENCIA_Y_FLUJO.md`
- `docs/producto-visible/03_ARQUITECTURA_VISUAL_GLOBAL_VS_TENANT.md`
- `docs/producto-visible/04_DASHBOARD_GLOBAL_OBJETIVO.md`
- `docs/producto-visible/05_CONFIGURACION_GLOBAL_OBJETIVO.md`
- `docs/producto-visible/06_PORTAL_TENANT_OBJETIVO.md`
- `docs/producto-visible/07_PROPUESTA_DE_REESTRUCTURA_DE_MENUS_Y_SHELLS.md`
- `docs/producto-visible/08_PLAN_DE_EJECUCION_PRODUCTO_VISIBLE.md`

Tambien revisar:

- `.github/instructions/cctv-project.instructions.md`
- `.github/instructions/visible-product-handoff.md`

## Estado real del producto visible

Hay avances reales en:

- onboarding de empresas
- branding base
- modulos habilitados por tenant
- bootstrap de admin inicial
- runtime por tenant

Pero **no debe considerarse resuelto** el producto visible mientras siga existiendo mezcla entre:

- backoffice global
- workspace de empresa
- preview tenant
- portal tenant real

### Regla de UX actual

No aceptar una shell hibrida ambigua como estado por defecto.

Debe quedar clarisimo:

- cuando el usuario esta en plataforma global
- cuando esta preparando una empresa
- cuando esta viendo un preview
- cuando esta dentro del portal tenant real

## Direccion de producto visible

La siguiente direccion correcta del producto es:

1. limpiar visualmente el shell global
2. reestructurar `Configuracion` por ownership
3. construir un `Dashboard global` real
4. separar un `Portal tenant` real
5. despues evolucionar a `Empresas o Clientes -> Sucursales -> Acceder a infraestructura`

## Build y tests

```powershell
# Frontend
cd cctv_web
npm install
npm run dev
npm run build
npm test
npm run test:e2e

# Backend solo lectura
cd cctv_server
go build ./...
```

## Convenciones del frontend

- HTTP con `ky` via `src/lib/api/client.ts`
- Estado servidor con TanStack Query
- Estado cliente con Zustand
- Formularios con React Hook Form + Zod
- UI con shadcn/ui sobre Tailwind 4
- Reutilizar componentes existentes antes de crear otros nuevos
- No usar `fetch` directo ni `axios`
- No llamar HTTP desde componentes si existe wrapper en `src/lib/api/`

## Regla final para futuras IAs

No comunicar "fase completada" o "producto resuelto" si:

- la UI real sigue viendose igual
- el flujo visible no se percibe distinto
- la evidencia solo existe en specs mockeados
- o el backend actual no soporta lo prometido

Primero claridad visible y ownership correcto. Despues implementacion.
