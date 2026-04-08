# 04. Plan Faseado de Completacion

> Criterio rector: una fase no se considera realmente cerrada solo porque exista avance tecnico o visual. Debe quedar operable end-to-end el requerimiento de negocio que le da sentido, o bien debe quedar degradado y documentado como GAP real.

## Vista general corregida

| Fase | Nombre | Resultado principal |
|---|---|---|
| F0 | Alineacion y decisiones de producto | Modelo base aprobado y backlog congelado por nucleo |
| F1 | Consolidacion multi-tenant y scopes | Contexto de empresa confiable y no enganoso |
| F2 | Maestros operativos y UX de contexto | Cliente-sitio-activo operables sin UUIDs manuales |
| F3 | Cierre CCTV core | Inventario, importacion, planos y mapa en estado defendible |
| F4 | Operacion contractual | Tickets, polizas y SLA coherentes con cobertura real |
| F5 | Backoffice enterprise inicial | Configuracion, roles, tenants, storage e IA con frontera administrativa mas clara |
| F6 | Correccion de rumbo producto | Tenant operable, servicios habilitados, portal tenant y auditoria real de Control de Acceso |
| F7 | Calidad, hardening y handoff | QA, e2e, documentacion y criterios de release cerrados |

## Estado de ejecucion corregido

| Fase | Estado | Fecha | Evidencia |
|---|---|---|---|
| F0 | Completada | 2026-04-07 | Paquete `docs/plan-maestro/` aprobado y decisiones base cerradas |
| F1 | Completada | 2026-04-07 | Flujo login/select-company/contexto activo implementado en `cctv_web`, switch enganoso retirado, guards minimos aplicados |
| F2 | Completada | 2026-04-07 | Formularios de tickets y polizas sin UUIDs manuales para contexto principal, aliases administrativos apuntando a `/settings`, contexto de sitio aplicado donde fue posible |
| F3 | Completada | 2026-04-07 | Camaras y NVR alineados al contrato manual real, importacion con parseo y mapeo, floor plans defendibles y mapa degradado con precision aproximada |
| F4 | Completada | 2026-04-07 | Tickets, polizas y SLA ya exponen cobertura real y degradaciones honestas de update |
| F5 | Completada con alcance administrativo parcial | 2026-04-07 | `/settings` ya separa plataforma vs tenant, branding tenant se rehidrata y existe consola inicial de `menu_templates`; esto NO equivale a tener tenant operable end-to-end |
| F6 | Pendiente | - | Debe reparar la desviacion entre lo implementado y la vision enterprise esperada |
| F7 | Pendiente | - | Solo debe iniciarse despues de cerrar F6 y reauditar el estado real del producto |

## Nota de correccion de rumbo

El cierre tecnico de F1-F5 resolvio una parte importante del sistema actual, pero no resolvio el objetivo de negocio que motivaba el proyecto enterprise:

- dar de alta una empresa y dejarla lista para iniciar sesion,
- asignarle servicios o modulos habilitados con criterio real,
- separar de verdad el backoffice global del portal tenant,
- y contar con dominios adicionales como Control de Acceso mas alla de una mencion conceptual.

Por esa razon, el siguiente paso ya no puede ser hardening directo. Antes debe ejecutarse una fase nueva de correccion de rumbo producto.

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

- `LoginResponse` se alineo al payload real con `companies`.
- El login multiempresa usa seleccion explicita de empresa antes de emitir el contexto final de trabajo.
- Se elimino la dependencia funcional de `X-Company-ID` y el selector enganoso de empresa en header.
- El tenant activo queda persistido como snapshot local y se rehidrata desde `/auth/me`.
- La navegacion fija de Fase 1 respeta permisos por ruta.
- Se agregaron guards minimos por pagina y acciones principales en tickets, clientes y configuracion.

### Criterio de salida

No existen mas switches de empresa visuales sin sustento de contrato.

## Fase 2. Maestros operativos y UX de contexto

### Objetivo

Convertir cliente, sitio y activos en contexto operativo usable, sin formularios basados en UUIDs manuales.

### Estado del checkpoint

Completado el 2026-04-07.

### Resultado materializado

- `site-store` rehidrata y reconcilia el sitio activo contra datos reales del tenant.
- Tickets ya usan selectores de cliente, sitio, poliza y tecnico.
- Polizas ya usan selectores de cliente, sitio y activos cubiertos navegables.
- Inventario recalcula KPIs por sitio activo cuando existe contexto operativo seleccionado.
- `/users`, `/roles`, `/tenants`, `/storage` e `/intelligence` redirigen a la tab correcta de `/settings`.
- `TabLayout` y `/settings` soportan deep link por query string.

### Degradaciones honestas aplicadas

- El cruce cliente-sitio se resuelve por nombre comercial mientras la API de sitios no entregue `client_id`.
- La asociacion de activos cubiertos por `equipment_id` generico se retiro de la UI operativa porque no existe catalogo navegable real en backend.
- Las polizas sin `site_id` siguen visibles aun con sitio activo para no ocultar cobertura a nivel cliente.

### Criterio de salida

La operacion basica ya no depende de conocimiento tecnico de IDs para usuarios funcionales.

## Fase 3. Cierre CCTV core

### Objetivo

Dejar el bloque CCTV en estado operable y honesto respecto a sus limitaciones reales.

### Estado del checkpoint

Completado el 2026-04-07.

### Resultado materializado

- `camaras` aplica contexto de sitio en tabla, KPIs y exportacion; el alta manual se acota a los campos que el backend realmente persiste y la edicion se retira porque no existe `PUT /inventory/cameras/{id}`.
- `nvrs` aplica contexto de sitio, expone columna de sucursal y separa la alta manual base de la edicion parcial que el contrato si soporta.
- `imports` parsea CSV/XLSX en frontend, expone el mapeo de columnas, usa el analisis del backend cuando esta disponible y crea batches con `column_mapping` y `data` reales.
- `floor-plans` guarda una proyeccion legacy para compatibilidad y una version enriquecida del documento editor.
- `map` comunica explicitamente que la georreferencia es aproximada por ciudad.

### Degradaciones honestas aplicadas

- La alta manual de camaras no promete tipo, IP, MAC, megapixeles ni estado operativo avanzado.
- La edicion manual de camaras queda diferida por GAP real de API.
- La alta y edicion manual de NVR no promete red, almacenamiento, fechas ni estado avanzado.
- El mapa se mantiene como modulo complementario y referencial.

### Criterio de salida

El bloque CCTV puede demostrarse y operarse sin promesas falsas de contrato.

## Fase 4. Operacion contractual

### Objetivo

Alinear tickets, polizas y SLA como una sola capa operativo-contractual.

### Estado del checkpoint

Completado el 2026-04-07.

### Resultado materializado

- `tickets` ya expone cobertura y SLA con el mismo orden de resolucion del backend.
- `ticket-dialog` separa creacion vs edicion y bloquea el contexto contractual cuando el backend no recalcula.
- `ticket-actions` usa workload real del backend para asignacion y documenta el impacto de cada transicion.
- `polizas` muestran alcance contractual en tabla, formulario con `coverage_json` y detalle que conecta cobertura, activos y tickets ligados.
- `sla` explica la logica real de seleccion de reglas y comunica que `business_hours` sigue siendo documental.

### Degradaciones honestas aplicadas

- La edicion de tickets no permite cambiar tipo, prioridad, sitio ni poliza.
- Una poliza existente con `site_id` no promete volver a cobertura cliente por update.
- `business_hours` en SLA se mantiene visible como dato documental, no como comportamiento activo del motor.

### Criterio de salida

La capa contractual deja de ser un conjunto de modulos sueltos y se vuelve un flujo coherente.

## Fase 5. Backoffice enterprise inicial

### Objetivo

Separar y ordenar la administracion enterprise que ya existia, sin confundir eso con tener un producto tenant-operable completo.

### Estado del checkpoint

Completado el 2026-04-07, con alcance administrativo parcial.

### Resultado materializado

- `/settings` funciona como shell enterprise con separacion visible entre `Backoffice global` y `Portal de empresa`, usando tabs agrupadas por ownership.
- `empresas` ya opera branding corporativo con upload de logo por tenant y rehidrata el snapshot local cuando la empresa editada coincide con el tenant activo.
- `tema` deja explicito que solo gobierna branding del tenant activo y sincroniza la paleta con el snapshot local.
- `usuarios`, `roles`, `storage` e `ia` comunican alcance tenant y limitaciones reales del contrato.
- Se agrego una consola inicial de `menu_templates` sobre el backend real: listar, crear, editar, eliminar, asignar tenants, definir composicion base e inspeccionar el menu efectivo resuelto por `GET /menu`.
- `/settings` y sus aliases administrativos aceptan tambien permisos de `menu`.

### Lo que NO quedo cerrado

- No existe onboarding end-to-end del tenant con usuario admin inicial.
- `subscription_plan` sigue siendo metadato de tenant, no un catalogo real de paquetes o servicios habilitados.
- El sidebar runtime sigue fijo y no se hidrata desde `menu_templates`.
- El portal tenant sigue compartiendo shell y narrativa con el backoffice global.
- No existe superficie web real del dominio `Control de Acceso`.

### Criterio de salida

El backoffice deja de ser una tab grande y pasa a ser una capa administrativa mas clara, pero esto no basta para considerar resuelta la vision enterprise esperada por producto.

## Fase 6. Correccion de rumbo producto

### Objetivo

Cerrar la brecha entre el sistema tecnicamente ordenado y el producto enterprise realmente esperado:

- tenant operable desde el alta,
- servicios o modulos habilitados con criterio explicito,
- portal tenant autocontenido,
- y auditoria honesta del dominio `Control de Acceso`.

### Por que existe esta fase

Las Fases 1-5 ordenaron la plataforma actual, pero no completaron estos requerimientos centrales de negocio:

- alta de tenant con branding base y usuario admin inicial,
- login real de la empresa creada,
- gestion clara de servicios o modulos habilitados,
- menu visible por tenant + rol + servicio,
- experiencia tenant que no se sienta como backoffice global,
- y modulo `Control de Acceso` como superficie real o GAP formal.

### Alcance

#### Bloque A. Onboarding real de tenant

- Auditar que parte del onboarding ya existe en backend y web.
- Definir el flujo operativo completo para alta de tenant.
- Separar claramente que parte ya existe: tenant, branding, login.
- Documentar si el bootstrap del usuario admin inicial puede implementarse desde web usando contrato existente o si queda bloqueado.
- Definir la evidencia minima para considerar a un tenant "listo para operar".

#### Bloque B. Servicios habilitados / paquetes / modulos

- Definir un catalogo claro de servicios o modulos habilitables por empresa.
- Separar semanticamente `servicio habilitado`, `paquete`, `poliza`, `SLA` y `modulo visible`.
- Definir como impacta eso a menu, permisos, portal tenant y narrativa comercial.
- Identificar que parte puede resolverse con `menu_templates`, permisos y configuracion actual, y que parte requiere soporte backend no existente.

#### Bloque C. Portal tenant real

- Definir la experiencia del tenant al iniciar sesion.
- Delimitar que ve un usuario global vs un usuario tenant.
- Aterrizar usuarios internos del tenant, roles internos y ownership real.
- Decidir si basta una shell compartida con separacion fuerte o si se necesita shell/rutas dedicadas.

#### Bloque D. Control de Acceso

- Auditar honestamente que existe hoy en backend y frontend.
- Documentar si hay dominio, endpoints, rutas o solo semantica conceptual.
- Si no existe superficie real, dejarlo explicitamente fuera de "modulo habilitable operativo" hasta tener plan de construccion.
- Definir un plan faseado especifico para construirlo como dominio operativo.

### Fuera de alcance

- Hardening final.
- Release notes de entrega.
- Dar por hecho que `subscription_plan` ya es un paquete funcional real.
- Declarar `Control de Acceso` como listo si no existe evidencia en repo.

### Tareas detalladas

1. Reabrir el plan maestro y registrar la desviacion de alcance.
2. Crear una matriz honesta de esperado vs existente vs faltante vs bloqueado.
3. Insertar esta fase nueva antes del hardening.
4. Redefinir backlog y riesgos para la nueva realidad del producto.
5. Dejar una definicion operativa de "tenant listo para operar".
6. Dejar una definicion operativa de "servicio habilitado" y "modulo visible".
7. Auditar el estado real de `Control de Acceso`.

### Dependencias

- Contrato actual de `cctv_server/` sin modificaciones.
- Rutas actuales de `auth`, `users`, `roles`, `tenants`, `menu`, `settings`.
- Decision de producto sobre si puede usarse `POST /auth/register` como parte del bootstrap administrativo o si eso debe tratarse como limite de seguridad y onboarding.

### Riesgos

- Forzar hardening sobre una vision de producto todavia incompleta.
- Sobrerrepresentar `subscription_plan` como si ya definiera modulos.
- Tratar `menu_templates` como si ya resolviera menu runtime por si solo.
- Confundir portal tenant con una tab bonita dentro de `/settings`.
- Prometer `Control de Acceso` sin evidencia real en repo.

### Validaciones

- Existe una matriz clara entre lo esperado por negocio y lo existente real.
- Existe definicion cerrada de que deja a un tenant operable.
- Existe criterio claro para gobernar visibilidad por tenant + rol + servicio.
- Existe conclusion explicita sobre el estado real de `Control de Acceso`.
- Existe backlog corregido para cerrar estos vacios antes de hardening.

### Criterio de salida

No se continua a hardening hasta que quede clara, documentada y aprobada la siguiente afirmacion:

**que parte del producto enterprise ya existe, que parte sigue parcial, que parte esta bloqueada por backend y que parte debe convertirse en la siguiente etapa real de construccion.**

## Fase 7. Calidad, hardening y handoff

### Objetivo

Cerrar calidad, validaciones, documentacion operativa y preparacion de entrega, pero solo despues de reparar la desviacion de producto.

### Alcance

- Alinear puertos y scripts.
- Revisar Playwright y base URLs.
- Ejecutar QA funcional por modulo.
- Alinear docs, seeds, datos demo y release notes.
- Generar el paquete documental de la siguiente etapa real antes de programar mas producto.

### Fuera de alcance

- Corregir con hardening vacios de producto que debieron resolverse en F6.
- Declarar "terminado" algo que no este operativo end-to-end.

### Criterio de salida

Existe una definicion defendible de listo para entrega y un paquete documental nuevo para la etapa siguiente del producto.

## Siguiente paso recomendado

La siguiente ejecucion correcta ya no es hardening.

La siguiente ejecucion debe ser **Fase 6: Correccion de rumbo producto**.

El razonamiento es:

- Fase 5 ordeno el backoffice, pero no cerro tenant onboarding, servicios habilitados ni portal tenant real.
- Hardening ahora solo maquillaria una desviacion de alcance que el propio repo y la propia documentacion ya reconocen.
- Antes de seguir programando, el proyecto necesita reauditarse desde la vision enterprise esperada por negocio.
