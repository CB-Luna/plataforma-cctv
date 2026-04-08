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
| F6 | Completada | 2026-04-08 | C6.1-C6.5 ya corrigieron el rumbo de producto con onboarding tenant, servicios habilitados, portal tenant, auditoria formal de `Control de Acceso` y consolidacion documental honesta |
| F7 | Pendiente | - | Puede iniciarse despues del cierre formal de F6 y debe enfocarse en calidad, hardening y handoff sin inventar producto faltante |

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

### Checkpoints de Fase 6

La Fase 6 se ejecuta por checkpoints formales. Ningun checkpoint se considera cerrado si no deja:

- evidencia documental actualizada,
- conclusion explicita de que si existe y que no existe,
- bloqueos de backend separados de lo implementable ya en web,
- y criterio claro para el siguiente checkpoint.

#### Estado de checkpoints

| Checkpoint | Estado | Objetivo corto |
|---|---|---|
| C6.1 | Completado con validacion contractual mockeada | Cerrar onboarding real de tenant |
| C6.2 | Completado | Cerrar servicios habilitados y paquetes |
| C6.3 | Completado | Definir portal tenant real |
| C6.4 | Completado | Auditar `Control de Acceso` |
| C6.5 | Completado | Consolidar F6 antes de hardening |

| Checkpoint | Nombre | Objetivo | Entregable principal | Gate de salida |
|---|---|---|---|---|
| C6.1 | Onboarding tenant | Definir que significa dejar un tenant realmente operable | Flujo `tenant -> branding -> admin inicial -> login` documentado | Queda claro si el bootstrap admin es implementable ya o bloqueado |
| C6.2 | Servicios y paquetes | Separar plan comercial, servicio habilitado, paquete, poliza, SLA y modulo visible | Matriz producto -> servicio -> menu -> tenant | Deja de existir ambiguedad sobre `subscription_plan` |
| C6.3 | Portal tenant | Definir la experiencia real del tenant al iniciar sesion | Modelo de shell, ownership y navegacion tenant | Queda claro que ve un tenant vs que ve plataforma |
| C6.4 | Control de Acceso | Auditar honestamente el dominio y decidir si existe o no como modulo real | Auditoria y conclusion formal del estado del dominio | Se deja de vender como modulo existente si no hay evidencia |
| C6.5 | Consolidacion F6 | Integrar hallazgos y congelar el nuevo rumbo antes de hardening | Plan maestro corregido y backlog priorizado | Queda aprobada la salida de F6 y habilitada F7 |

### Checkpoint C6.1. Onboarding tenant

#### Estado del checkpoint

Completado el 2026-04-07 con limitacion de validacion live: el flujo quedo implementado y probado con contrato mockeado en navegador real, pero no se corrio contra un backend levantado en este workspace durante este turno.

#### Objetivo

Definir el flujo real para que una empresa dada de alta quede lista para operar.

#### Alcance

- Alta de tenant.
- Branding base.
- Usuario admin inicial.
- Evidencia de login real.

#### Fuera de alcance

- Programar hardening.
- Asumir que crear tenant ya equivale a dejarlo listo.

#### Entregables

- Definicion de "tenant operable".
- Matriz entre onboarding esperado y onboarding existente.
- Conclusion clara sobre `POST /auth/register` y/o bloqueos del contrato.

#### Resultado materializado

- El alta de tenant ahora puede incluir branding base, seleccion de servicios habilitados y bootstrap opcional del admin inicial en el mismo flujo.
- La web usa `POST /auth/register` para crear el admin inicial del tenant sin tocar `cctv_server/`.
- El flujo intenta asignar automaticamente el rol global `tenant_admin` al usuario bootstrap.
- El resultado del onboarding queda persistido como snapshot en `tenant.settings.onboarding` y se expone en tabla, dialogos y contexto tenant.
- Si el tenant se creo sin admin o fallo la asignacion de rol, el estado queda visible y recuperable al editar la empresa.
- El selector de empresa y el contexto tenant ahora muestran mejor el estado operativo y los servicios habilitados.

#### Degradaciones honestas aplicadas

- La validacion end-to-end con backend real no pudo correrse en este turno porque no habia servicios levantados en el workspace; se cubrio con build, tests y Playwright mockeando el contrato.
- El bootstrap del admin inicial depende de que el rol global `tenant_admin` exista y siga asignable desde el contexto actual.
- La administracion de usuarios internos adicionales sigue sin `POST /users`; por ahora el cierre operativo se centra en el admin inicial del tenant.

#### Criterio de salida

Se puede responder sin ambiguedad:

**hoy como dejo lista una empresa para iniciar sesion y operar, o por que no puedo hacerlo aun.**

### Checkpoint C6.2. Servicios y paquetes

#### Estado del checkpoint

Completado el 2026-04-07.

#### Objetivo

Cerrar la semantica del modelo comercial-funcional antes de seguir tocando menus o planes.

#### Alcance

- Servicio habilitado.
- Paquete.
- `subscription_plan`.
- Poliza.
- SLA.
- Modulo visible.

#### Fuera de alcance

- Inventar persistencia nueva en backend.
- Asumir que `basic/professional/enterprise` ya tiene significado funcional.

#### Entregables

- Matriz servicio -> paquete -> visibilidad.
- Regla de como impacta a menu, portal tenant y narrativa comercial.
- Lista de lo que puede gobernarse ya con permisos + `menu_templates`.

#### Resultado materializado

- Existe un catalogo frontend explicito de planes `basic`, `professional` y `enterprise`, con servicios sugeridos y estados de soporte.
- Los servicios habilitados del tenant ahora viven en `tenant.settings.enabled_services`.
- El sidebar runtime y las tabs de `/settings` ya responden a permisos + servicios habilitados + superficie real del modulo.
- `/settings` ahora expone una tab global `Servicios y paquetes` para hacer visible el catalogo vigente, los dominios planeados y la regla real de visibilidad.
- `subscription_plan` deja de presentarse como si fuera suficiente por si solo: se comunica como referencia comercial y se separa de la habilitacion real de modulos.

#### Degradaciones honestas aplicadas

- El catalogo de paquetes vive hoy en frontend porque el backend no expone un CRUD formal de paquetes/servicios.
- `Control de Acceso` y `Redes` se documentan como dominios planeados, no como modulos operativos habilitables.
- `menu_templates` sigue siendo una consola administrativa; todavia no es la fuente unica del sidebar runtime.

#### Criterio de salida

Deja de existir confusion entre plan comercial y producto visible.

### Checkpoint C6.3. Portal tenant

#### Estado del checkpoint

Completado el 2026-04-07.

#### Objetivo

Definir la experiencia del tenant como producto propio, no como una extension ambigua del backoffice global.

#### Alcance

- Shell tenant.
- Roles internos.
- Usuarios internos.
- Navegacion y ownership.

#### Fuera de alcance

- Implementar dominios nuevos.
- Declarar que `/settings` ya resuelve por si solo el portal tenant.

#### Entregables

- Modelo de experiencia tenant.
- Frontera clara global vs tenant.
- Criterio de rutas o shell dedicadas vs shell compartida endurecida.

#### Resultado materializado

- El shell ahora distingue explicitamente `tenant_portal` vs `hybrid_backoffice` usando permisos, roles y tenant activo.
- El sidebar tenant-only cambia branding, copy y CTA principales: `Inicio del portal`, `Mi empresa` y resumen visible de la empresa activa.
- El header tenant-only ya usa `Portal` como raiz, refleja rol interno + tenant activo y alinea el breadcrumb con la narrativa del portal.
- El dashboard agrega un hero de portal tenant con plan, servicios visibles, rol interno y accesos rapidos propios del tenant.
- `/settings` tenant-only deja de mostrarse como backoffice global y se presenta como espacio de empresa activa, ocultando tabs globales cuando el perfil no tiene workspace de plataforma.
- Usuarios y roles internos del tenant quedan reforzados como ownership de empresa dentro de la experiencia visible.
- Se documenta y se implementa la decision de producto para C6.3: por ahora basta una shell compartida endurecida; no se introducen rutas o layouts separados mientras el contrato backend siga comun.

#### Degradaciones honestas aplicadas

- El portal tenant sigue montado sobre la misma shell tecnica del dashboard; la separacion es de experiencia, ownership y navegacion, no de runtime aislado.
- La alta administrativa general de usuarios internos sigue parcial porque `/users` no expone `POST`.
- La administracion de sitios/sucursales del tenant sigue limitada por GAP backend; el portal hoy los consume como contexto, no como CRUD cerrado.
- El menu runtime sigue siendo una composicion fija gobernada por permisos + servicios; `menu_templates` aun no es la fuente unica.

#### Criterio de salida

Queda claro que vera una empresa tipo "Bimbo" al iniciar sesion y por que ya no se sentira dentro del backoffice global.

### Checkpoint C6.4. Control de Acceso

#### Estado del checkpoint

Completado el 2026-04-08.

#### Objetivo

Auditar el dominio `Control de Acceso` con la misma honestidad con la que ya se audito CCTV.

#### Alcance

- Existencia real de rutas.
- Existencia real de pantallas.
- Existencia real de APIs o contrato.
- Plan de construccion si no existe.

#### Fuera de alcance

- Venderlo como modulo actual sin evidencia.
- Programarlo todavia si primero no queda auditado.

#### Entregables

- Conclusion binaria: existe como modulo real, existe parcial, o no existe.
- Lista de gaps de backend y frontend.
- Plan faseado propio si el dominio debe construirse.

#### Resultado materializado

- Se audito el repo completo y se confirma que `Control de Acceso` no existe como modulo operativo real en web, mobile ni backend.
- En frontend solo existe como servicio `planned` dentro de `service-catalog`, como familia contractual en polizas y como copy de producto; no hay rutas ni pantallas equivalentes a CCTV.
- En backend solo existe semantica de seeds/categorias de equipo y no un grupo de endpoints dedicado en `main.go`.
- En mobile no existe feature del dominio.
- Se genero una auditoria formal en `docs/plan-maestro/09_AUDITORIA_CONTROL_DE_ACCESO.md`.
- La UI administrativa ya comunica con mas fuerza que `Control de Acceso` sigue sin modulo web ni API operativa auditada.

#### Degradaciones honestas aplicadas

- `Control de Acceso` puede seguir apareciendo como familia de cobertura contractual o dominio planeado, pero no como modulo habilitable operativo.
- No se creo ninguna pantalla placeholder ni mock funcional para "simular" el dominio.
- El siguiente trabajo sobre ese dominio queda movido a una etapa futura con contrato y modelo propios.

#### Criterio de salida

Ya no se vuelve a mencionar `Control de Acceso` como modulo habilitable sin una etiqueta honesta de su estado real.

### Checkpoint C6.5. Consolidacion F6

#### Estado del checkpoint

Completado el 2026-04-08.

#### Objetivo

Integrar hallazgos, congelar decisiones y dejar a Fase 7 con una base defendible.

#### Alcance

- Integracion de hallazgos de C6.1 a C6.4.
- Ajustes a plan, backlog, validaciones y riesgos.
- Recomendacion formal de siguiente etapa.

#### Entregables

- Plan maestro corregido.
- Estado final de F6.
- Lista de decisiones que requieren tu aprobacion antes de nuevo codigo.

#### Resultado materializado

- F6 queda formalmente cerrada como correccion de rumbo producto y no como fase de nuevo dominio.
- Se actualizo el plan maestro, las validaciones, el backlog, los riesgos y la correccion de rumbo para reflejar el estado real despues de C6.4.
- Se generaron dos documentos de cierre: `09_AUDITORIA_CONTROL_DE_ACCESO.md` y `10_CIERRE_FASE_6.md`.
- Queda habilitada F7 como siguiente paso correcto, con la restriccion de no usar hardening para inventar producto faltante.
- Tambien queda explicitada la regla posterior: al cerrar F7 debe generarse un nuevo paquete documental para la etapa siguiente antes de volver a programar dominios nuevos.

#### Criterio de salida

No hay contradiccion entre lo que el producto dice ser, lo que el repo demuestra y lo que sigue pendiente.

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

### Checkpoints F7

| Checkpoint | Estado | Objetivo | Entregable esperado | Gate de salida |
|---|---|---|---|---|
| C7.1 | Pendiente | Dejar un entorno reproducible y sin contradicciones operativas | Scripts, puertos, URLs y comandos base alineados | Cualquier persona del equipo puede levantar y validar el flujo principal con instrucciones consistentes |
| C7.2 | Pendiente | Ejecutar smoke y QA transversal del producto actual | Evidencia de pruebas sobre login, seleccion de empresa, portal tenant, CCTV, tickets, polizas/SLA y settings | No quedan regresiones bloqueantes abiertas en el alcance actual |
| C7.3 | Pendiente | Endurecer bugs, permisos, contexto y estados criticos detectados en QA | Correcciones dentro del alcance real del producto actual | El sistema se comporta de forma estable sin inventar producto faltante |
| C7.4 | Pendiente | Cerrar handoff, release criteria y documentacion operativa | Runbook, limitaciones conocidas, release notes y criterio defendible de entrega | La salida a entrega queda explicada con honestidad y trazabilidad |
| C7.5 | Pendiente | Generar el nuevo paquete documental de la etapa siguiente | `docs/plan-etapa-2/` o paquete equivalente de la siguiente etapa real | No se programa producto nuevo hasta dejar lista esa nueva base documental |

### Checkpoint C7.1. Entorno reproducible

#### Objetivo

Alinear la base operativa del repo para que desarrollo, build, pruebas y smokes se ejecuten con puertos, URLs y comandos consistentes.

#### Alcance

- Revisar puertos y comandos en scripts, docs y pruebas.
- Alinear `E2E_BASE_URL`, defaults locales y notas de uso.
- Dejar claro cuando una validacion usa mocks, `next start` o backend vivo.

#### Fuera de alcance

- Reescribir arquitectura de devops.
- Meter infraestructura nueva que no sea necesaria para reproducibilidad local.

#### Entregables esperados

- Matriz corta de comandos estandar de arranque y validacion.
- Referencias coherentes a puertos y URLs.
- Advertencias visibles sobre mocks, seeds y limites del entorno actual.

#### Criterio de salida

No quedan contradicciones entre docs, scripts y pruebas para levantar el producto actual.

### Checkpoint C7.2. Smoke y QA transversal

#### Objetivo

Comprobar que el producto actual funciona de punta a punta dentro de su alcance real, con foco en regresiones de auth, multi-tenant, CCTV, operacion contractual y settings.

#### Alcance

- Ejecutar smoke de login, seleccion de empresa y persistencia de contexto.
- Validar portal tenant y experiencia backoffice dentro de la shell vigente.
- Validar modulos core ya cerrados: CCTV, tickets, polizas/SLA y configuracion.

#### Fuera de alcance

- Probar dominios que ya quedaron auditados como no construidos.
- Declarar cobertura E2E completa si solo existe smoke parcial.

#### Entregables esperados

- Evidencia automatizada y/o manual de los flujos criticos.
- Lista clara de fallas detectadas y severidad.
- Decisiones de degradacion honesta cuando el backend limite el flujo.

#### Criterio de salida

Existe evidencia defendible del flujo principal y no quedan regresiones bloqueantes sin clasificar.

### Checkpoint C7.3. Hardening funcional

#### Objetivo

Corregir hallazgos de calidad dentro del alcance actual del producto, sin usar hardening como excusa para tapar vacios de producto.

#### Alcance

- Bugs de permisos, contexto, navegacion, estados vacios y errores.
- Inconsistencias entre UI, copy, docs y comportamiento real.
- Ajustes de estabilidad de pruebas o flujos reproducibles.

#### Fuera de alcance

- Construir nuevos dominios de negocio.
- Inventar capacidades backend no auditadas.

#### Entregables esperados

- Lista de fixes aplicados.
- Validaciones repetidas sobre los hallazgos cerrados.
- Registro de que se mantuvo la honestidad sobre GAPs abiertos.

#### Criterio de salida

Los defectos criticos o altos detectados en C7.2 quedan resueltos, degradados con honestidad o bloqueados formalmente.

### Checkpoint C7.4. Handoff y criterio de release

#### Objetivo

Dejar una salida defendible para entrega interna, demo o handoff tecnico, con limitaciones abiertas visibles.

#### Alcance

- Consolidar release notes, runbook y limitaciones conocidas.
- Alinear backlog residual, riesgos y bloqueos con el estado final post-hardening.
- Definir explicitamente que significa "listo para entrega" en este repo.

#### Fuera de alcance

- Vender el sistema como enterprise completo si no lo es.
- Ocultar gaps por falta de backend o producto no construido.

#### Entregables esperados

- Documento de cierre de F7.
- Criterio de release y handoff.
- Riesgos y limitaciones actualizados.

#### Criterio de salida

La entrega ya puede explicarse con rigor: que si esta listo, que sigue parcial y que pasa a la siguiente etapa.

### Checkpoint C7.5. Paquete documental de la siguiente etapa

#### Objetivo

Generar la nueva base documental de la etapa siguiente antes de tocar mas producto, para que el roadmap posterior arranque desde evidencia y no desde supuestos.

#### Alcance

- Crear `docs/plan-etapa-2/` o nombre equivalente.
- Auditar brecha entre lo implementado al cierre de F7 y la vision enterprise pendiente.
- Proponer fases, backlog, riesgos y validaciones de la etapa siguiente.

#### Fuera de alcance

- Programar dominios nuevos en esta misma salida.
- Reabrir F7 como si fuera etapa de producto.

#### Entregables esperados

- Nuevo paquete documental completo de etapa siguiente.
- Primera fase recomendada de esa etapa.
- Lista de decisiones de producto pendientes de validar.

#### Criterio de salida

No queda ambiguedad sobre cual es la siguiente etapa real del producto ni sobre que debe validarse antes de programarla.

## Siguiente paso recomendado

La siguiente ejecucion correcta ya no es C6.4 ni el cierre completo de Fase 6.

La siguiente ejecucion debe ser **Fase 7: calidad, hardening y handoff**, arrancando por **C7.1 Entorno reproducible**.

El razonamiento es:

- C6.1 ya cerro el onboarding tenant hasta donde permite el contrato actual.
- C6.2 ya cerro el catalogo visible de servicios y paquetes dentro del shell existente.
- C6.3 ya cerro la experiencia tenant dentro de una shell compartida endurecida.
- C6.4 ya dejo auditado que `Control de Acceso` no existe como modulo real.
- C6.5 ya congelo el nuevo rumbo y alinea backlog, riesgos y validaciones con esa realidad.
