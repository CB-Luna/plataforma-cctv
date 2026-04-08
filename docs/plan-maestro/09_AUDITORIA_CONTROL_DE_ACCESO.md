# 09. Auditoria Control de Acceso

> Fecha de actualizacion: 2026-04-08
> Resultado corregido: `Control de Acceso` SI existe hoy como modulo visible del producto, pero en estado `scaffold/WIP`; NO existe todavia como modulo operativo cerrado.

## Resumen ejecutivo

La auditoria corregida deja esta clasificacion:

- `Control de Acceso` ya no debe tratarse como dominio invisible o ausente del producto.
- Ya existe como superficie real en web:
  - side menu,
  - rutas reales,
  - pantallas navegables,
  - contexto tenant,
  - y estado explicito de trabajo en progreso.
- Sigue sin existir como dominio operativo completo porque el backend fijo no expone APIs especificas del modulo ni CRUD funcional del dominio.

La conclusion correcta ya no es "no existe". La conclusion correcta es:

**modulo scaffold/WIP visible en runtime, sin backend ni operacion cerrada.**

## Alcance auditado

Se reviso evidencia en:

- `cctv_web/src/app/`
- `cctv_web/src/components/`
- `cctv_web/src/lib/`
- `cctv_mobile/lib/features/`
- `cctv_server/cmd/main.go`
- `cctv_server/internal/handlers/`
- `cctv_server/internal/database/migrations/`

## Matriz de evidencia corregida

| Capa | Evidencia encontrada | Evidencia faltante | Estado real |
|---|---|---|---|
| Web rutas | Existen `/access-control`, `/access-control/inventory`, `/access-control/technical-sheets`, `/access-control/maintenance`, `/access-control/incidents`, `/access-control/reports` | No hay CRUD ni detalle operativo con data real | Scaffold/WIP visible |
| Web runtime | `sidebar.tsx` ya muestra el dominio cuando el tenant tiene `enabled_services` con `access_control`; `layout.tsx` lo gobierna por servicio + rol base + estado del modulo | No existe fuente unica de runtime desde `menu_templates` | Visible en runtime controlado |
| Web UI | Existe shell reusable WIP con contexto tenant, badges de estado y navegacion entre subsecciones | No hay tablas, formularios, KPIs reales ni workflow de operacion | WIP navegable |
| Web producto | `service-catalog.ts` lo declara asignable, visible en runtime y con estado `wip`; `policy-dialog.tsx` y `contractual.ts` lo reconocen como familia contractual | No existe dominio operativo equivalente a CCTV | Producto visible, operacion incompleta |
| Mobile | No existe feature mobile propia | No hay superficie mobile del dominio | Ausente en mobile |
| Backend rutas | `main.go` sigue sin exponer grupo `/access-control` ni endpoints equivalentes | No hay inventario, eventos, credenciales, puertas, lectores ni incidencias del dominio | Bloqueo backend fuerte |
| Backend datos | Seeds de categorias/equipos incluyen `access_control`, `intercom`, `sensor_door`, `alarm_panel` | No hay handlers que conviertan esas semillas en modulo operable | Semantica y datos base |

## Evidencia puntual

### Frontend web

- `cctv_web/src/lib/product/service-catalog.ts` ya clasifica `access_control` como servicio asignable en estado `wip`.
- `cctv_web/src/components/layout/sidebar.tsx` ya renderiza una seccion `Control de Acceso` cuando el tenant tiene ese servicio habilitado.
- `cctv_web/src/app/(dashboard)/access-control/` ya contiene rutas reales y navegables del dominio.
- `cctv_web/src/components/product/module-scaffold-shell.tsx` deja explicito el estado WIP y evita venderlo como CRUD terminado.
- `cctv_web/src/app/(dashboard)/policies/policy-dialog.tsx` ya separa cobertura contractual del estado operativo del modulo.

### Backend Go

- `cctv_server/cmd/main.go` sigue sin registrar rutas ni grupos para `Control de Acceso`.
- `cctv_server/internal/handlers/` sigue sin contener handlers del dominio.
- `cctv_server/internal/database/migrations/000008_seed_initial_data.up.sql` sigue mostrando que el dominio ya tiene semantica y tipos de equipo relevantes.

### Mobile

- `cctv_mobile/lib/features/` sigue sin incluir una feature propia de `Control de Acceso`.

## Lo que SI puede afirmarse hoy

- Existe un modulo real visible de `Control de Acceso` dentro del producto web.
- Ese modulo ya puede habilitarse por tenant via `enabled_services`.
- El tenant puede verlo en el side menu y navegarlo.
- El modulo comunica con honestidad que sigue en construccion.
- La cobertura contractual del dominio puede convivir con esta superficie visible sin confundirse con operacion cerrada.

## Lo que NO puede afirmarse hoy

- Que exista un CRUD operativo de puertas, lectores, controladoras, credenciales o eventos.
- Que existan APIs del dominio en el backend fijo.
- Que el modulo ya tenga permisos backend propios y gobierno fino por item.
- Que mobile o backend ya esten al nivel del scaffold web.

## Implicaciones para producto

1. `Control de Acceso` ya debe contarse como modulo visible legitimo del producto.
2. Su estado correcto es `WIP`, no `operativo`.
3. Debe aparecer cuando el tenant lo tenga habilitado y desaparecer cuando no.
4. No debe usarse para fingir cobertura operativa que el backend todavia no respalda.

## Bloqueos reales

- Bloqueo backend:
  no existe contrato API especifico del dominio.
- Bloqueo funcional:
  no hay inventario, eventos, incidencias ni mantenimiento con datos reales.
- Bloqueo mobile:
  no existe superficie equivalente.
- Bloqueo RBAC:
  no hay permisos dedicados del dominio; la visibilidad actual usa servicio habilitado y permisos base de descubrimiento.

## Siguiente paso correcto del dominio

Si `Control de Acceso` sigue siendo objetivo del producto, el avance correcto ya no es "hacerlo visible"; eso ya se hizo. Lo correcto ahora es cerrar por etapas:

1. Modelo del dominio
   - puerta, lector, panel/controladora, credencial, persona, evento, incidente.
2. Contrato backend
   - listar, crear, editar y consultar entidades base.
3. UI operativa
   - reemplazar scaffolds WIP por tablas, formularios, detalle y estados reales.
4. Integracion contractual
   - conectar polizas/SLA/cobertura con el dominio ya operativo.

## Conclusion formal

`Control de Acceso` hoy existe de forma legitima en el producto, pero **como modulo scaffold/WIP visible**.

No debe volver a desaparecer del runtime por no tener backend completo, pero tampoco debe venderse como modulo terminado hasta que cierre:

- contrato,
- datos,
- flujos,
- y permisos del dominio.
