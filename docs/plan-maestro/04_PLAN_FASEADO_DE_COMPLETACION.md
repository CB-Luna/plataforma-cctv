# 04. Plan Faseado de Completacion

> Criterio rector: primero consolidar contexto, contrato y operacion real; despues ampliar o pulir superficies.

## Vista general

| Fase | Nombre | Resultado principal |
|---|---|---|
| F0 | Alineacion y decisiones de producto | Modelo aprobado y backlog congelado por nucleo |
| F1 | Consolidacion multi-tenant y scopes | Contexto de empresa confiable y no enganoso |
| F2 | Maestros operativos y UX de contexto | Cliente-sitio-activo operables sin UUIDs manuales |
| F3 | Cierre CCTV core | Inventario, importacion, planos y mapa en estado defendible |
| F4 | Operacion contractual | Tickets, polizas y SLA coherentes con cobertura real |
| F5 | Backoffice enterprise | Configuracion, roles, tenants, storage e IA con frontera clara |
| F6 | Calidad, hardening y handoff | QA, e2e, documentacion y criterios de release cerrados |

## Estado de ejecucion

| Fase | Estado | Fecha | Evidencia |
|---|---|---|---|
| F0 | Completada | 2026-04-07 | Paquete `docs/plan-maestro/` aprobado y decisiones de producto cerradas |
| F1 | Completada | 2026-04-07 | Flujo login/select-company/contexto activo implementado en `cctv_web`, switch enganoso retirado, guards minimos aplicados, `npm test`, `npm run build` y smoke Playwright verdes |
| F2 | Completada | 2026-04-07 | Formularios de tickets y polizas ya no dependen de UUID manual para contexto principal, aliases administrativos apuntan a la tab correcta de `/settings`, contexto de sitio aplica en tickets/polizas/inventario, `npm test`, `npm run build` y Playwright Fase 2 verdes |
| F3 | Completada | 2026-04-07 | Camaras y NVR alineados al contrato manual real, importacion con parseo+mapeo+validacion, floor plans sin perdida de semantica y mapa degradado con precision aproximada, `npm test`, `npm run build` y Playwright Fase 3 verdes |
| F4 | Pendiente | - | Requiere cierre contractual de polizas y SLA |
| F5 | Pendiente | - | Requiere consolidacion de backoffice enterprise |
| F6 | Pendiente | - | Requiere hardening final, QA ampliado y handoff |

## Fase 0. Alineacion y decisiones de producto

### Objetivo

Congelar vocabulario, alcance y decisiones criticas antes de tocar logica funcional.

### Alcance

- Aprobar el paquete `docs/plan-maestro/`.
- Confirmar modelo tenant-cliente-sitio.
- Confirmar estrategia de login y cambio de empresa.
- Confirmar que entra en V1 operativa.
- Confirmar que capacidades se degradan explicitamente por GAP backend.

### Fuera de alcance

- Cambios de codigo.
- Cambios de backend.

### Criterio de salida

Existe confirmacion explicita del modelo objetivo y de la Fase 1 como siguiente ejecucion.

## Fase 1. Consolidacion multi-tenant y scopes

### Objetivo

Hacer confiable el contexto de empresa y eliminar comportamientos que aparentan un cambio de contexto no respaldado por el contrato real.

### Estado del checkpoint

Completado el 2026-04-07.

### Resultado materializado

- `LoginResponse` ya se alinea al payload real con `companies`.
- El login multiempresa usa seleccion explicita de empresa antes de emitir el contexto final de trabajo.
- Se elimino la dependencia funcional de `X-Company-ID` y el selector enganoso de empresa en header.
- El tenant activo queda persistido como snapshot local y se rehidrata desde `/auth/me`.
- La navegacion fija de Fase 1 respeta permisos por ruta.
- Se agregaron guards minimos por pagina y acciones principales en tickets, clientes y configuracion.

### Validacion ejecutada

- `npm test` en `cctv_web`: OK.
- `npm run build` en `cctv_web`: OK.
- Playwright smoke Fase 1 en `http://localhost:3010`: OK sobre login, auth redirect, dashboard y settings.

### Criterio de salida

No existen mas switches de empresa visuales sin sustento de contrato.

## Fase 2. Maestros operativos y UX de contexto

### Objetivo

Convertir cliente, sitio y activos en contexto operativo usable, sin formularios basados en UUIDs manuales.

### Estado del checkpoint

Completado el 2026-04-07.

### Resultado materializado

- `site-store` ahora rehidrata y reconcilia el sitio activo contra datos reales del tenant.
- Tickets ya usan selectores de cliente, sitio, poliza y tecnico en lugar de IDs manuales.
- Polizas ya usan selectores de cliente, sitio y activos cubiertos navegables.
- Inventario ahora recalcula KPIs por sitio activo cuando existe contexto operativo seleccionado.
- `/users`, `/roles`, `/tenants`, `/storage` e `/intelligence` ya redirigen a la tab correcta de `/settings`.
- `TabLayout` y `/settings` ya soportan deep link por query string para navegacion administrativa coherente.

### Degradaciones honestas aplicadas

- El cruce cliente-sitio se resuelve por nombre comercial mientras la API de sitios no entregue `client_id`.
- La asociacion de activos cubiertos por `equipment_id` generico se retiro de la UI operativa porque no existe catalogo navegable real en backend.
- Las polizas sin `site_id` siguen visibles aun con sitio activo para no ocultar cobertura a nivel cliente.

### Alcance

- Reemplazar UUIDs manuales por selectores y relaciones navegables donde ya existan endpoints.
- Conectar el contexto de sitio a filtros y queries donde si aplica.
- Normalizar tablas, busquedas, estados vacios y errores en modulos operativos.

### Fuera de alcance

- Crear CRUD de sitios.
- Nuevos endpoints de busqueda inexistentes.

### Validacion ejecutada

- `npm test` en `cctv_web`: OK.
- `npm run build` en `cctv_web`: OK.
- Playwright Fase 2 en `http://localhost:3020`: OK sobre tickets, polizas, aliases administrativos y estabilidad del inventario.

### Criterio de salida

La operacion basica ya no depende de conocimiento tecnico de IDs para usuarios funcionales.

## Fase 3. Cierre CCTV core

### Objetivo

Dejar el bloque CCTV en estado operable y honesto respecto a sus limitaciones reales.

### Estado del checkpoint

Completado el 2026-04-07.

### Resultado materializado

- `camaras` ahora aplica contexto de sitio en tabla, KPIs y exportacion; el alta manual se acota a los campos que el backend realmente persiste y la edicion se retira porque no existe `PUT /inventory/cameras/{id}`.
- `nvrs` ahora aplica contexto de sitio, expone columna de sucursal y separa con claridad la alta manual base de la edicion parcial que el contrato si soporta.
- `imports` ya parsea CSV/XLSX en frontend, expone el mapeo de columnas, usa el analisis del backend cuando esta disponible y crea batches con `column_mapping` y `data` reales.
- `floor-plans` ahora guarda una proyeccion legacy para compatibilidad y, ademas, una version enriquecida del documento editor para no perder habitaciones, zonas, puertas o poligonos.
- `map` ahora comunica explicitamente que la georreferencia es aproximada por ciudad y se alinea al sitio activo cuando existe contexto operativo seleccionado.

### Degradaciones honestas aplicadas

- La alta manual de camaras no promete tipo, IP, MAC, megapixeles ni estado operativo avanzado porque el backend actual no los persiste desde este formulario.
- La edicion manual de camaras queda diferida por GAP real de API.
- La alta y edicion manual de NVR no promete red, almacenamiento, fechas ni estado avanzado; esos datos siguen entrando por importacion o procesos especializados.
- El mapa se mantiene como modulo complementario y referencial mientras la API no entregue latitud y longitud reales.

### Alcance

- Revisar CRUD real de camaras y NVR.
- Cerrar importacion masiva con la interfaz que el backend si puede consumir.
- Corregir guardado de floor plans para no perder semantica del editor.
- Resolver como se presenta el mapa mientras no haya coordenadas reales.
- Verificar consistencia entre camaras, NVR, floor plans y contexto sitio-activo.

### Fuera de alcance

- Nuevos endpoints de geolocalizacion.
- Nuevos endpoints de catalogo maestro inexistentes.

### Validacion ejecutada

- `npm test` en `cctv_web`: OK.
- `npm run build` en `cctv_web`: OK.
- Playwright Fase 3 en `http://localhost:3030`: OK sobre camaras/NVR, importacion, mapa y persistencia defendible de floor plans.
- Playwright smoke adicional en `http://localhost:3030`: OK sobre `/inventory`, `/camera-models` y `/cameras` sin hydration mismatch.

### Criterio de salida

El bloque CCTV puede demostrarse y operarse sin promesas falsas de contrato.

## Fase 4. Operacion contractual

### Objetivo

Alinear tickets, polizas y SLA como una sola capa operativo-contractual.

### Alcance

- Tickets.
- Polizas.
- SLA.
- Relacion entre activos, cobertura y operacion.

### Criterio de salida

La capa contractual deja de ser un conjunto de modulos sueltos y se vuelve un flujo coherente.

## Fase 5. Backoffice enterprise

### Objetivo

Separar y cerrar la administracion enterprise del portal operativo.

### Alcance

- Empresas y tenants.
- Usuarios.
- Roles y permisos.
- Tema y configuracion general.
- Storage.
- IA.
- Evaluacion del modulo de menu por plantillas.

### Criterio de salida

El backoffice deja de ser una tab grande y pasa a ser una capa administrable con ownership claro.

## Fase 6. Calidad, hardening y handoff

### Objetivo

Cerrar calidad, validaciones, documentacion operativa y preparacion de entrega.

### Alcance

- Alinear puertos y scripts.
- Revisar Playwright y base URLs.
- Ejecutar QA funcional por modulo.
- Alinear docs, seeds, datos demo y release notes.

### Criterio de salida

Existe una definicion defendible de listo para entrega y de GAP aceptado.

## Siguiente paso recomendado

La siguiente ejecucion en codigo debe ser **Fase 4: Operacion contractual**.

El razonamiento es:

- Fase 3 ya dejo el bloque CCTV en un estado demostrable y defendible.
- El siguiente riesgo enterprise no es visual sino contractual: tickets, polizas, SLA y cobertura todavia necesitan cerrarse como un solo flujo.
- Resolver Fase 4 antes de ampliar backoffice evita que la operacion siga separada de las reglas reales de servicio y cobertura.
