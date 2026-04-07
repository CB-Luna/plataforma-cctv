# 00. Resumen Ejecutivo

> Fecha de auditoría: 2026-04-07  
> Alcance: monorepo `sistema-camaras-mono` con foco operativo en `cctv_web/`  
> Restricción crítica: `cctv_server/` se trata como contrato fijo y no forma parte del alcance de cambios

## Qué es hoy el sistema

El repo contiene un monorepo real con:

- `cctv_server/`: backend Go con rutas, migraciones y contrato API existentes.
- `cctv_web/`: frontend Next.js 16 con App Router, React Query, Zustand, `ky`, Tailwind y shadcn/ui.
- `cctv_mobile/`: app Flutter en estado inicial.
- `docker/` y `scripts/`: infraestructura y utilitarios de levantamiento.

Hoy el sistema ya no está en fase de maqueta. El frontend web compila y tiene superficie funcional amplia, pero el producto todavía no está completamente consolidado a nivel de modelo operativo enterprise, experiencia multi-tenant y alineación exacta con el contrato backend.

## Qué ya está avanzado

En `cctv_web/` hay evidencia clara de avance real en:

- Autenticación, layout de dashboard y navegación principal.
- Dashboard ejecutivo y dashboard de inventario.
- Inventario CCTV: cámaras, NVR, fichas técnicas, importaciones, planos, topología y CAPEX/garantías.
- Operación: tickets, clientes, pólizas y SLA.
- Configuración: usuarios, empresas, roles y permisos, tema, IA y storage.
- Pruebas unitarias: `44` tests pasando.
- Build de producción: `next build` exitoso el 2026-04-07.

## Qué tipo de producto está intentando ser

La dirección natural del repo es una plataforma enterprise multi-tenant para operación CCTV con dos planos de trabajo:

- Plano global/backoffice: gobierno de tenants, branding, permisos, plantillas de menú, storage, IA y administración transversal.
- Plano tenant/operativo: inventario, tickets, pólizas, SLA, planos, cobertura y operación por cliente/sitio.

El backend confirma una base real para esa visión:

- `public.tenants` existe desde la migración `000001_create_tenants.up.sql`.
- `auth.menu_templates` y `auth.tenant_menu_assignments` existen desde `000020_menu_templates.up.sql`.
- Hay rutas reales de menú, roles, permisos, tenants, storage, IA, tickets, pólizas, SLA e inventario.

## Problema central a resolver para continuar

El problema central ya no es “hacer más pantallas”, sino cerrar el modelo operativo y alinear la UX con el contrato real.

La auditoría detectó cinco tensiones principales:

1. La experiencia multi-tenant está sobreprometida en frontend frente al comportamiento real del backend.
2. Existen módulos visualmente completos cuyo flujo operativo aún depende de IDs manuales, datos aproximados o supuestos no cerrados.
3. Hay desalineaciones concretas frontend-backend.
4. Hay desalineaciones concretas entre documentación previa, scripts, puertos y runtime actual del monorepo.
5. Faltan decisiones de producto sobre jerarquía tenant-cliente-sitio, scopes, menú dinámico y servicios habilitados.

## Hallazgos ejecutivos más importantes

### 1. Multi-tenant real en backend, pero flujo web todavía inconsistente

- El backend soporta login con `tenant_id` opcional y devuelve `companies` en `POST /auth/login`.
- El frontend tipa `login()` sin `companies` y luego depende de `GET /auth/me`.
- `GET /auth/me` devuelve la empresa del tenant actual del JWT, no el universo multiempresa.
- El header del frontend cambia `tenant_id` en `localStorage` y envía `X-Company-ID`, pero el backend toma el tenant efectivo desde el JWT, no desde ese header.

Resultado: la UI ya habla de multiempresa, pero el cambio de empresa no está sólidamente resuelto en el flujo real.

### 2. Hay módulos funcionales, pero varios siguen con UX de integración cruda

Ejemplos:

- Tickets y pólizas piden UUIDs manuales para cliente, sitio, técnico o activos.
- El selector de sucursal cambia estado local pero no gobierna las queries del resto de módulos.
- El mapa usa coordenadas inferidas por ciudad o fallback sintético, no geodatos reales del backend.
- La importación masiva crea lotes, pero el diálogo actual no sube archivo ni genera `data`/`column_mapping` útil.

### 3. Existen discrepancias de contrato que ya deben tratarse como GAPs de planificación

Ejemplos confirmados:

- `PUT /inventory/cameras/:id` existe en el wrapper frontend, pero no está registrado en `cctv_server/cmd/main.go`.
- No existen `POST /auth/refresh` ni `POST /auth/switch-company`.
- No existe CRUD de sitios.
- No existen endpoints de mantenimiento preventivo ni auditoría.

### 4. El repo compila, pero no todo lo que compila está listo para operación enterprise

Evidencia objetiva de la auditoría:

- `npm test`: `44` pruebas pasando.
- `npm run build`: build exitoso.
- No se ejecutó Playwright porque requiere entorno web+backend levantado y datos compatibles.

Eso confirma una base sana de frontend, pero no invalida los vacíos de producto, integración y contexto.

## Resumen ejecutivo del plan

La recomendación es avanzar por fases, no por pantallas.

### Prioridad inmediata

Primero debe cerrarse el núcleo de contexto operativo:

- modelo tenant-cliente-sitio,
- login y cambio de empresa,
- scopes y permisos reales,
- criterio de qué módulos son core V1,
- y qué capacidades deben degradarse explícitamente cuando el backend no las soporta.

### Después

Una vez cerrado ese núcleo:

- se aterriza la UX de maestros operativos,
- luego se estabiliza el CCTV core,
- después operación contractual y SLA,
- y al final backoffice avanzado, calidad, QA y handoff.

## Recomendación ejecutiva

La primera fase real de ejecución no debe ser “seguir construyendo módulos”, sino:

**consolidar el contexto multi-tenant, scopes, selectors operativos y reglas de contrato que hoy están implícitas o desalineadas.**

Sin esa fase, cualquier avance adicional corre el riesgo de:

- reforzar flujos falsamente multi-tenant,
- multiplicar deuda de formularios basados en UUID,
- y seguir mezclando backoffice global con portal tenant sin una frontera clara.
