# Handoff Producto Visible - Estado Actual y Siguiente Paso

## Proposito

Este archivo existe para que otra IA herede el estado real del producto visible sin repetir errores de interpretacion.

## Estado real al momento de este handoff

### Lo que si existe

- Hay una base multi-tenant real en backend y frontend.
- Existe flujo de login y seleccion de empresa.
- Existe trabajo real en onboarding visible de empresas.
- Hay branding base por tenant.
- Hay modulos o servicios habilitados por tenant.
- Existe bootstrap de admin inicial.
- El runtime ya puede responder a servicios habilitados y mostrar modulos operativos o WIP.
- `Control de Acceso` y `Redes` ya no deben tratarse como dominios ausentes; se consideran modulos visibles en estado `WIP` cuando aplique.

### Lo que no debe considerarse resuelto

- El producto visible no esta arquitectonicamente limpio.
- `Dashboard global` aun no esta claramente separado del portal tenant.
- `Configuracion global` aun arrastra mezcla entre ownership global y tenant.
- `Portal tenant` aun no tiene una identidad visual totalmente separada del backoffice global.
- `Empresas o Clientes -> Sucursales -> Acceder a infraestructura` aun no esta construido como experiencia visible final.

## Error de interpretacion que ya no debe repetirse

No volver a asumir que un dominio queda fuera del producto visible solo porque aun no tenga backend completo.

Clasificacion correcta:

- `Operativo`: ya tiene rutas, datos y flujos utilizables
- `Parcial`: existe y sirve, pero su capacidad esta limitada
- `WIP`: existe en menu, rutas y pantallas, pero aun no esta cerrado funcionalmente
- `Futuro`: aun no existe ni visual ni funcionalmente

## Regla de validacion que no se puede romper

Siempre distinguir entre:

1. evidencia mockeada
2. evidencia de UI real
3. flujo real con backend actual

No presentar capturas mockeadas o specs con mocks como confirmacion de producto visible resuelto.

## Instancia correcta para validar

Antes de afirmar que un cambio visible existe:

1. revisar `cctv_web/package.json`
2. confirmar la URL real del frontend
3. verificar si se esta viendo una instancia vieja en `3010`

Al momento de este handoff, el frontend actual usa `3011` para `dev` y `start`.

## Fuente de verdad documental

Revisar primero:

- `docs/producto-visible/00_OBJETIVO.md`
- `docs/producto-visible/01_CHECKPOINT_CONFIGURACION_OPERABLE.md`
- `docs/producto-visible/02_EVIDENCIA_Y_FLUJO.md`
- `docs/producto-visible/03_ARQUITECTURA_VISUAL_GLOBAL_VS_TENANT.md`
- `docs/producto-visible/04_DASHBOARD_GLOBAL_OBJETIVO.md`
- `docs/producto-visible/05_CONFIGURACION_GLOBAL_OBJETIVO.md`
- `docs/producto-visible/06_PORTAL_TENANT_OBJETIVO.md`
- `docs/producto-visible/07_PROPUESTA_DE_REESTRUCTURA_DE_MENUS_Y_SHELLS.md`
- `docs/producto-visible/08_PLAN_DE_EJECUCION_PRODUCTO_VISIBLE.md`

## Lo que sigue

La siguiente direccion correcta no es backend ni hardening.

La siguiente direccion correcta es:

1. `Limpieza visual global`
2. `Limpieza de Configuracion global`
3. `Dashboard global`
4. `Portal tenant`
5. `Sucursales -> Acceder a infraestructura`

## Primer checkpoint recomendado

### Limpieza visual global

Objetivo:

- que `Admin Sistema` deje de sentirse dentro de una empresa por defecto
- que header, sidebar y breadcrumbs expresen plataforma global
- que la empresa seleccionada sea contexto secundario y no identidad dominante del shell

Pantallas que deben tocarse si o si:

- `Dashboard`
- `Header`
- `Sidebar`
- `Breadcrumbs`

## Segundo checkpoint recomendado

### Limpieza de Configuracion global

Objetivo:

- separar `Global` vs `Tenant` como scopes reales
- convertir `Empresas` en workspace central de onboarding
- sacar usuarios internos, roles internos, tema, IA y storage del plano global

Pantallas que deben tocarse:

- `Configuracion`
- `Empresas`
- `Servicios y paquetes`
- `Plantillas de menu`

## Regla de ownership

### Global

- Dashboard global
- Empresas
- Servicios y paquetes
- Plantillas de menu
- Monitoreo de onboarding

### Tenant

- Dashboard tenant
- Usuarios internos
- Roles internos
- Tema
- IA tenant
- Storage tenant
- Modulos operativos o WIP por empresa

### Preview

- Solo simulacion controlada dentro del backoffice
- Nunca reemplaza la shell global

## Regla final para la siguiente IA

No cierres un checkpoint visible si la UI real sigue viendose casi igual.

No digas que el producto esta resuelto si el usuario todavia siente mezcla entre:

- plataforma global
- empresa seleccionada
- preview tenant
- portal tenant real

La siguiente implementacion debe ser visible, verificable y defendible en runtime real.
