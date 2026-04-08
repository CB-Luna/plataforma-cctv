# 09. Auditoria Control de Acceso

> Fecha de cierre: 2026-04-08
> Resultado binario: `Control de Acceso` NO existe hoy como modulo operativo real en este repo.

## Resumen ejecutivo

La auditoria de C6.4 confirma que `Control de Acceso` aparece hoy en el repo de cuatro maneras:

- como semantica de catalogo o servicio planeado,
- como familia contractual dentro de polizas,
- como datos seed relacionados con categorias de equipo,
- y como expectativa de producto en documentos.

No aparece como:

- rutas web reales,
- pantallas operativas equivalentes a CCTV,
- feature mobile propia,
- ni endpoints/API dedicados en backend.

La conclusion correcta no es "modulo parcial". La conclusion correcta es:

**dominio no construido, con semantica preliminar existente.**

## Alcance auditado

Se reviso evidencia en:

- `cctv_web/src/app/`
- `cctv_web/src/lib/`
- `cctv_web/src/components/`
- `cctv_mobile/lib/features/`
- `cctv_server/cmd/main.go`
- `cctv_server/internal/handlers/`
- `cctv_server/internal/database/migrations/`

## Matriz de evidencia

| Capa | Evidencia encontrada | Evidencia ausente | Estado |
|---|---|---|---|
| Web rutas | Ninguna ruta bajo `src/app` para `access_control`, lectores, credenciales, puertas o torniquetes | No hay `/access-control`, `/readers`, `/doors`, `/badges` ni equivalente | No existe modulo |
| Web dominio | `service-catalog.ts` lo declara como servicio `planned`; `contractual.ts` lo usa como familia contractual; `policy-dialog.tsx` permite marcar cobertura | No hay tablas, formularios, detalle, CRUD ni dashboard propio | Semantica solamente |
| Web UI relacionada | El editor de floor plans tiene tipo `door`, pero eso es una herramienta grafica de planos, no un dominio de control de acceso | No hay flujo operativo de puertas, credenciales o eventos | No cuenta como modulo |
| Mobile | `cctv_mobile/lib/features` solo tiene `auth`, `home` y `tickets` | No hay feature `access_control` o similar | No existe modulo |
| Backend rutas | `main.go` expone grupos `users`, `roles`, `settings`, `menu`, `tenants`, `storage`, `intelligence`, `clients`, `policies`, `sla`, `inventory`, `tickets`, `dashboard` | No hay grupo `/access-control` ni handlers equivalentes al bloque CCTV | No existe API operativa |
| Backend datos | Seeds de `000008_seed_initial_data.up.sql` incluyen `access_control`, `intercom`, `sensor_door`, `alarm_panel` como categorias/semantica de equipo | No hay endpoints ni handlers que conviertan esos seeds en dominio operable | Datos semilla solamente |
| Contrato producto | La web ya lo marca como planeado y no asignable en runtime | No hay criterio de menu ni permisos exclusivos de modulo porque no existe modulo | Planeado, no habilitable |

## Evidencia puntual

### Frontend web

- En `cctv_web/src/app/` no existe ninguna carpeta de dominio equivalente a CCTV para `Control de Acceso`.
- `cctv_web/src/lib/product/service-catalog.ts` clasifica `access_control` como `planned`, `assignable: false` y sin modulos visibles.
- `cctv_web/src/lib/contracts/contractual.ts` solo lo usa como etiqueta de cobertura contractual.
- `cctv_web/src/app/(dashboard)/policies/policy-dialog.tsx` permite marcar `access_control` dentro de `covered_services`, pero eso documenta cobertura, no construye el modulo.
- `cctv_web/src/lib/floor-plan/types.ts` y el editor de planos incluyen `door`, pero corresponde a geometria/plano, no a gestion operativa de accesos.

### Backend Go

- `cctv_server/cmd/main.go` no registra rutas ni grupos para `Control de Acceso`.
- `cctv_server/internal/handlers/` no contiene handlers equivalentes a lectores, puertas, credenciales, eventos o incidencias del dominio.
- `cctv_server/internal/database/migrations/000008_seed_initial_data.up.sql` solo siembra categorias como `access_control`, `intercom` y `sensor_door`.

### Mobile

- `cctv_mobile/lib/features/` solo contiene `auth`, `home` y `tickets`.
- No existe ninguna superficie mobile equivalente al dominio.

## Lo que SI puede afirmarse hoy

- El producto ya puede nombrar `Control de Acceso` como un dominio comercial planeado.
- Una poliza puede documentar cobertura contractual de ese dominio.
- El catalogo de servicios puede mostrarlo como "planeado" para evitar mezclarlo con CCTV.

## Lo que NO puede afirmarse hoy

- Que exista un modulo de `Control de Acceso` navegable.
- Que pueda habilitarse por tenant como si ya estuviera listo.
- Que existan APIs operativas para lectores, puertas, credenciales, eventos, incidencias o inventario del dominio.
- Que mobile o web tengan una superficie comparable a CCTV para ese servicio.

## Implicaciones para producto

1. `Control de Acceso` debe permanecer fuera del sidebar y del menu runtime operativo.
2. Puede seguir apareciendo en:
   - catalogo de servicios planeados,
   - coverage contractual de polizas,
   - roadmap de la siguiente etapa.
3. No debe seguir apareciendo como si bastara "activarlo" por tenant.

## Bloqueos reales

- Bloqueo backend:
  no existe contrato API del dominio.
- Bloqueo web:
  no existe superficie base para operacion, inventario, eventos ni mantenimiento.
- Bloqueo mobile:
  no existe feature propia.
- Bloqueo de producto:
  aun no esta cerrado el modelo de objetos del dominio.

## Modelo minimo sugerido para una etapa futura

Si `Control de Acceso` entra en la siguiente etapa real del producto, la construccion correcta deberia arrancar por este orden:

1. Modelo y contrato
   - definir entidades: sitio, panel, puerta, lector, credencial, persona, evento, incidente.
2. API base
   - listar/crear/editar inventario del dominio y consultar eventos.
3. Web operativa
   - modulo de inventario, detalle, incidencias y reportes basicos.
4. Integracion contractual
   - acoplar polizas/SLA al nuevo dominio cuando ya exista superficie real.

## Conclusion formal de C6.4

`Control de Acceso` hoy NO existe como modulo real en el producto.

Existe solamente como:

- lenguaje de producto,
- categoria seed,
- y etiqueta contractual.

La recomendacion correcta es mantenerlo fuera del runtime actual y tratarlo como dominio de la siguiente etapa, no como feature latente del sistema actual.
