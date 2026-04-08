# 03. Gaps y Decisiones Pendientes

> Regla aplicada: cuando una capacidad no esta respaldada por el backend auditado, se documenta como GAP. No se inventan endpoints. Tampoco se declara una fase como "cerrada" si el requerimiento de negocio que le da sentido sigue sin operar end-to-end.

## Resumen ejecutivo

Los GAPs detectados no son homogeneos. Se agrupan en:

- backend/API,
- frontend/UI,
- modelo de negocio,
- permisos/scopes,
- experiencia multi-tenant,
- y datos demo/seeds/mocks.

El mayor riesgo actual no es la falta de pantallas, sino la mezcla entre:

- capacidades reales,
- capacidades simuladas por UI,
- y expectativas de producto que aun no quedaron convertidas en flujo operativo real.

## Actualizacion Fase 4 (2026-04-07)

Durante la ejecucion de Fase 4 se cerraron y/o dejaron explicitados estos puntos:

- Tickets ya no dependen de UUID manual para cliente, sitio o poliza.
- Polizas ya no dependen de UUID manual para cliente o sitio.
- La edicion de tickets se degrada de forma intencional a campos no contractuales.
- La edicion de polizas comunica la limitacion de una poliza `site-scoped`.
- `business_hours` en SLA sigue siendo documental.

## Actualizacion Fase 5 (2026-04-07)

Durante la ejecucion de Fase 5 se cerraron y/o dejaron explicitados estos puntos:

- `/settings` ya separa de forma visible `Plataforma` vs `Tenant activo`.
- La gestion de empresas incorpora upload de logo por tenant y rehidrata el snapshot local cuando coincide con la empresa activa.
- La web ya cuenta con una consola inicial de `menu_templates` operando sobre el backend real.
- La configuracion tenant de tema sincroniza la paleta con el snapshot local usado por header y theme provider.
- La navegacion runtime sigue fija por decision honesta de fase; el backend de menu ya se administra, pero aun no gobierna el sidebar operativo.

## Actualizacion correccion de rumbo producto (2026-04-07)

Se reconoce explicitamente esta desviacion:

- Fases 1-5 ordenaron buena parte del sistema actual, pero no cerraron el producto enterprise esperado por negocio.
- El alta de tenant hoy no deja a la empresa lista para iniciar sesion con un usuario admin inicial.
- `subscription_plan` existe en tenant, pero no equivale a un catalogo real de paquetes o servicios habilitados.
- El portal tenant sigue siendo parcial y comparte demasiada narrativa con el backoffice global.
- `Control de Acceso` sigue sin evidencia de superficie web real y no debe presentarse como modulo ya habilitable.

## Actualizacion Fase 6 cerrada (2026-04-08)

Durante C6.1-C6.5 se cerraron y/o dejaron explicitados estos puntos:

- El onboarding del tenant ya puede dejar admin inicial bootstrapeado, pero el alta administrativa general de usuarios internos sigue parcial por ausencia de `POST /users`.
- El catalogo de servicios y paquetes ya separa plan comercial, servicio habilitado y modulo visible.
- El portal tenant ya tiene una experiencia propia dentro de la shell actual, aunque todavia no existe un runtime aislado.
- `Control de Acceso` y `Redes` ya existen como modulos scaffold/WIP visibles en runtime, aunque siguen sin backend ni operacion cerrada.
- La consolidacion de F6 deja el hardening habilitado solo porque la desviacion de producto ya esta documentada y no maquillada.

## GAP de backend / API

| ID | GAP | Evidencia | Impacto | Recomendacion |
|---|---|---|---|---|
| API-01 | No existe `POST /auth/refresh` | Documentado en instrucciones y ausente en `main.go` | La sesion no puede renovarse silenciosamente | Mantener relogin explicito y documentarlo |
| API-02 | No existe `POST /auth/switch-company` | No esta registrado en `main.go` | No hay cambio de tenant respaldado por backend como flujo dedicado | Mantener cambio por login/contexto real |
| API-03 | No existe CRUD completo de sitios | Instrucciones del monorepo y ausencia de rutas `/sites` | Sitios no se pueden crear/editar desde web | Mantener sitios como entidad consumida, no administrable |
| API-04 | No hay lat/lng operativo en el flujo consumido por frontend | `listSites()` usa `/inventory/floor-plans/sites` y no recibe coords reales | El mapa no puede ser confiable | Tratar mapa como aproximacion o diferirlo |
| API-05 | No existen endpoints de mantenimiento preventivo | GAP documentado en workspace | No se puede planear modulo preventivo real | Mantenerlo fuera de alcance |
| API-06 | No existe endpoint de auditoria | GAP documentado en workspace | No hay historial operacional formal | Diferir auditoria funcional real |
| API-07 | `PUT /inventory/cameras/:id` no esta registrado en backend real | `cctv_web` lo llego a usar; `main.go` no lo expone | Riesgo de edicion falsa de camaras | Tratar edicion de camaras como GAP |
| API-08 | Clientes no tienen `PUT`/`DELETE` | `clients.ts` solo envuelve listar, obtener y crear; `main.go` coincide | CRUD incompleto de clientes | Dejarlo explicito como alcance real |
| API-09 | No hay endpoint dedicado de eliminacion de rol | `roles` solo lista, crea, obtiene, actualiza y asigna permisos | El ciclo de vida de roles queda incompleto | Mantener `eliminar` fuera del alcance real |
| API-10 | No existe `POST /users` en el API protegido | `/users` lista, edita, cambia password y desactiva, pero no da alta | El onboarding del tenant y la administracion completa de usuarios internos quedan parciales | Evaluar si `POST /auth/register` puede usarse como bootstrap controlado o documentar bloqueo |
| API-11 | No existe un contrato dedicado para servicios habilitados o paquetes | No hay endpoints que modelen catalogo producto -> tenant -> servicios | Complica menu, pricing y habilitacion formal de modulos | Tratarlo como decision/product gap antes de codigo |
| API-12 | No existen APIs operativas de `Control de Acceso` ni `Redes` en el contrato auditado | `main.go` expone `users`, `roles`, `settings`, `menu`, `tenants`, `storage`, `intelligence`, `clients`, `policies`, `sla`, `inventory`, `tickets` y `dashboard`, pero no grupos equivalentes para esos dominios | Los modulos pueden existir como WIP visible, pero no como operacion cerrada | Mantenerlos visibles en runtime con estado honesto `WIP` y sin prometer CRUD |

## GAP de frontend / UI

| ID | GAP | Evidencia | Impacto | Recomendacion |
|---|---|---|---|---|
| FE-01 | Login multiempresa inicialmente no consumia `companies` de `POST /auth/login` | GAP ya tratado en Fase 1 | Riesgo alto de contexto ambiguo | Se considera resuelto para el alcance de Fase 1 |
| FE-02 | Cambio de empresa en header era enganoso | GAP ya tratado en Fase 1 | Riesgo alto de contexto visual distinto al real | Se considera resuelto para el alcance de Fase 1 |
| FE-03 | Selector de sucursal no tenia efecto real | GAP mitigado parcialmente en Fase 2 | Contexto visible, pero no siempre transversal | Mantenerlo como limite de contrato hasta tener CRUD real de sitios |
| FE-04 | Importacion masiva era incompleta | GAP mitigado en Fase 3 | Flujo aparente sin carga util | Mantener validacion fuerte sobre lo que realmente importa |
| FE-05 | Tickets usaban UUID manual para cliente, sitio y tecnico | GAP mitigado en Fase 2/Fase 4 | UX fragil | Se considera resuelto para el flujo principal |
| FE-06 | Polizas usaban UUID manual para cliente, sitio y activos | GAP mitigado en Fase 2/Fase 4 | UX fragil | Se considera resuelto para el flujo principal |
| FE-07 | Sidebar runtime ya responde a tenant + rol + servicios habilitados + estado del modulo, pero aun no usa `menu_templates` como fuente unica | `sidebar.tsx` ya gobierna modulos operativos y WIP por servicio; Fase 5 agrego consola real de `menu_templates` | La visibilidad del producto ya es real, pero la gobernanza final sigue duplicada | Dejar la unificacion runtime del menu como cierre posterior y no prometer dinamismo completo aun |
| FE-08 | No hay guardas de permisos por pagina/accion en toda la superficie | Hay enforcement parcial, no total | Riesgo de acciones visibles fuera de scope | Endurecer gradualmente y validarlo en hardening |
| FE-09 | Mapa usa coordenadas sinteticas | `branch-map.tsx`, `city-coordinates.ts` | Modulo demostrable, pero no confiable | Etiquetarlo como aproximado o sacarlo de core |
| FE-10 | Persistencia de floor plans es parcial | Se usa proyeccion legacy + documento enriquecido | Riesgo de perdida semantica si crece el editor | Mantener alcance controlado y probar reabrir/guardar |
| FE-11 | Branding de tenant no tiene flujo avanzado de media | Hay upload, pero no recorte ni variantes por canal | El branding base existe, pero no esta endurecido | Mantener upload simple y dejar tratamiento avanzado para hardening posterior |
| FE-12 | Varias rutas administrativas son solo redirects a `/settings` | `/users`, `/roles`, `/storage`, `/intelligence`, `/tenants` | Duplica superficie sin navegacion profunda por URL | Decidir si se mantienen como aliases o se eliminan |
| FE-13 | El flujo UI de bootstrap del admin inicial ya existe, pero el dominio de usuarios internos sigue incompleto | La web ya puede crear el primer usuario operativo del tenant, pero no usuarios internos adicionales desde `/users` | El tenant queda mucho mas cerca de operar, aunque la administracion general de usuarios sigue parcial | Mantener bootstrap inicial y tratar el alta posterior de usuarios como gap separado |
| FE-14 | El portal tenant sigue sin autonomia tecnica total, aunque ya tiene experiencia propia visible | C6.3 endurecio sidebar, header, dashboard y `/settings`, pero no existen rutas/layout aislados | El usuario tenant ya no se siente dentro del mismo backoffice en UX, pero la separacion tecnica sigue parcial | Mantener la experiencia actual como cierre de F6 y decidir aislamiento tecnico en etapa posterior |
| FE-15 | `Control de Acceso` y `Redes` ya tienen superficie web scaffold/WIP, pero sin flujo operativo real | Existen rutas y pantallas navegables en `src/app`, aunque no CRUD ni data del dominio | Riesgo de sobreprometer si se comunican como terminados | Mantenerlos visibles en runtime solo con estado WIP y mensaje honesto |
| FE-16 | `subscription_plan` se muestra como si fuera un plan funcional cerrado | El alta de tenant ya usa `basic/professional/enterprise` | Puede generar expectativa falsa sobre modulos incluidos | Separar plan comercial de producto visible hasta definir catalogo |

## GAP de modelo de negocio

| ID | GAP | Evidencia | Impacto | Recomendacion |
|---|---|---|---|---|
| BIZ-01 | Tenant y cliente ya fueron distinguidos, pero su UX sigue mezclandose en varios lugares | Backend tiene `tenants` y `clients`; la UI aun usa "empresa" para ambos niveles en zonas puntuales | Ambiguedad estructural residual | Seguir estabilizando el vocabulario de producto |
| BIZ-02 | Sitio no esta formalizado como entidad administrable transversal | Existe en inventario y filtros, pero sin CRUD real | El sistema no "piensa" por sitio de forma completa | Declararlo entidad core consumida mientras la API no cambie |
| BIZ-03 | El catalogo de servicios habilitados ya existe, pero aun no esta cerrado como gobierno backend unico | La UI ya distingue CCTV, Storage, IA, Control de Acceso y Redes con estados operativo/parcial/WIP | Complica pricing, RBAC fino y evolucion del runtime | Confirmar si seguira frontend-first o migrara a fuente administrable unica |
| BIZ-04 | CAPEX/garantias no tiene rol de negocio cerrado | Hoy deriva de inventario | Puede crecer sin modelo | Mantenerlo derivado hasta definir proceso |
| BIZ-05 | Paquete, poliza y SLA ya quedaron diferenciados conceptualmente, pero no materializados como modelo de producto integral | Hoy coexisten, pero el producto aun no gobierna menu/portal con esa semantica | Riesgo de duplicidad conceptual | Formalizar la relacion en Fase 6 |
| BIZ-06 | `subscription_plan` no equivale hoy a un paquete funcional real | El tenant guarda `basic/professional/enterprise`, pero no existe una matriz viva de servicios/modulos | Riesgo alto de vender planes sin significado operativo | Separar plan comercial, servicio habilitado y modulo visible |
| BIZ-07 | La definicion de "tenant operable" ya existe, pero no toda su validacion live esta cerrada | C6.1 definio branding + admin inicial + login defendible, aunque falta repetir smoke live contra backend levantado | El producto ya tiene una referencia minima de tenant listo, pero aun debe endurecer su validacion | Mantener checklist minimo y repetir prueba live en F7 |
| BIZ-08 | `Control de Acceso` y `Redes` ya existen como producto visible, pero no como modulo operativo terminado | La auditoria corregida encontro runtime scaffold/WIP, sin backend ni flujo cerrado | Riesgo de sobrepromesa comercial y funcional si se omite la etiqueta WIP | Mantener la clasificacion visible: operativo, parcial, WIP o futuro |

## GAP de permisos / scopes

| ID | GAP | Evidencia | Impacto | Recomendacion |
|---|---|---|---|---|
| SEC-01 | Falta modelo visible de scope global vs tenant en toda la UX | Backend reconoce acceso global via roles; frontend lo expresa solo parcialmente | Riesgo de mezclar backoffice con portal tenant | Materializar scopes en UX y rutas |
| SEC-02 | Permisos no gobiernan toda la superficie a nivel accion/pagina | Existe enforcement parcial | Riesgo de acciones visibles aunque fallen en backend | Definir guardas de lectura, accion y navegacion de forma transversal |
| SEC-03 | El cambio de empresa ya no es enganoso, pero el recalculo de experiencia tenant sigue parcial | El tenant activo existe; la shell sigue compartida | Riesgo de permisos y narrativa mezclados | Separar experiencia tenant del backoffice global |
| SEC-04 | Roles sin eliminacion ni remocion fina de permisos | Backend y frontend no cubren ciclo completo | Administracion incompleta | Aceptar limitacion o redisenar flujo |

## GAP de experiencia multi-tenant

| ID | GAP | Evidencia | Impacto | Recomendacion |
|---|---|---|---|---|
| MT-01 | Multiempresa basica ya funciona y el tenant ya entra a un portal con identidad visible, pero no aislado tecnicamente | Login, seleccion de empresa y experiencia tenant-only existen; el shell sigue siendo comun | La experiencia SaaS enterprise avanzo, aunque el aislamiento tecnico sigue incompleto | Mantener la shell endurecida actual y decidir aislamiento posterior solo si el producto lo necesita |
| MT-02 | La empresa activa ya puede quedar "operable" desde el alta, pero la validacion live y el gobierno posterior siguen parciales | Se crea tenant, branding y admin inicial, pero no hay smoke live repetido ni alta posterior general de usuarios | El producto avanzo fuerte, aunque el onboarding aun necesita endurecimiento | Mantener checklist de tenant listo para operar y repetir validacion live |
| MT-03 | La configuracion hibrida ya es visible, pero aun no existe particion fuerte por rutas o shells | Fase 5 separo scopes en `/settings`, aunque varios aliases siguen en una sola shell | Menor confusion, pero el backoffice aun depende de una pantalla compartida | Decidir en Fase 6 si basta el shell actual o si conviene abrir rutas/shells dedicados |
| MT-04 | Menu por tenant ya se administra y el sidebar ya responde a servicios habilitados, pero no gobierna desde una sola fuente | Backend de menu avanzado + consola Fase 5 + sidebar hardcodeado enriquecido | La experiencia final ya avanzo, pero la gobernanza sigue parcial | Confirmar si la V1 cierra con esta estrategia o si el runtime dinamico pasa a una fase posterior |
| MT-05 | Ya existe criterio operativo inicial de visibilidad por tenant + rol + servicio + estado del modulo, pero no RBAC fino por dominio WIP | Existen permisos base, catalogo de servicios y status del modulo | La navegacion esta mucho mas alineada al producto, aunque falta profundizar permisos backend por dominio | Mantener criterio vigente y madurarlo cuando existan APIs reales |

## GAP de datos demo / seeds / mocks

| ID | GAP | Evidencia | Impacto | Recomendacion |
|---|---|---|---|---|
| DEMO-01 | Demo users del login son presets visuales, no garantia de datos reales | `login/page.tsx` | Puede generar expectativa falsa | Dejar claro que son atajos de credenciales |
| DEMO-02 | Mapa usa coordenadas sinteticas | `city-coordinates.ts`, fallback por ciudad | Demo luce mejor que la verdad de datos | Etiquetar la aproximacion |
| DEMO-03 | Scripts y docs viejos siguen apuntando a puertos anteriores | `verify-api.ps1`, docs previas, seeds historicos | QA y onboarding inconsistentes | Limpiar despues de Fase 6 |
| DEMO-04 | No hay certeza de seeds multiempresa compatibles con el flujo actual | Scripts y docs no garantizan usuario con multiples companias operables en web | Dificulta validar `select-company` y portal tenant | Preparar dataset de validacion controlado |
| DEMO-05 | No hay dataset defendible para tenant onboarding completo | El repo no deja listo un tenant nuevo con admin inicial | Dificulta probar el objetivo enterprise esperado | Definir dataset especifico para Fase 6 |

## Decisiones cerradas y confirmadas (2026-04-07)

Estas decisiones ya no se consideran pendientes para programar la base del producto:

- DEC-01: login hibrido aprobado, con seleccion explicita de empresa cuando el usuario pertenece a multiples tenants.
- DEC-02: tenant y client quedan oficialmente separados dentro del modelo de producto.
- DEC-03: se aprueba modelo de roles globales de plataforma + roles internos por tenant.
- DEC-04: en Fase 1 el menu permanece de estructura fija, pero su visibilidad debe respetar tenant + permisos + contexto real.
- DEC-05: `/settings` queda definido como espacio hibrido entre plataforma y tenant.
- DEC-06: el mapa no es bloqueante de V1 y puede mantenerse como modulo complementario con precision aproximada.
- DEC-07: paquete, poliza y SLA no son equivalentes y deben convivir con semantica distinta.
- DEC-08: la V1 core queda enfocada en auth/contexto, clientes/sitios, inventario CCTV, tickets, polizas/SLA y configuracion esencial.

## Decisiones que pasan a la siguiente etapa despues de Fase 6

Estas decisiones ya no pueden seguir implicitas despues del cierre de F6:

- DEC-09: como se bootstrapea el usuario admin inicial del tenant sin vender un flujo inexistente.
- DEC-10: si `subscription_plan` seguira siendo solo metadato comercial o se convertira en paquete funcional real.
- DEC-11: si el menu runtime seguira fijo en F7 o si el siguiente salto de producto exige integrarlo con `menu_templates` como fuente unica.
- DEC-12: si el portal tenant puede seguir viviendo en la shell actual endurecida o si la siguiente etapa exige shell/rutas dedicadas.
- DEC-13: como y cuando los modulos WIP (`Control de Acceso`, `Redes`) pasaran de visibles a operativos sin romper la honestidad del producto.

## Conclusiones

El sistema ya tiene suficiente superficie como para requerir disciplina de producto, no solo disciplina tecnica.

La condicion para seguir programando con seguridad ya no es "tener otra pantalla", sino validar:

- como se deja realmente listo un tenant para operar,
- que significa de verdad un servicio habilitado,
- como se ve un portal tenant autocontenido,
- y como maduran `Control de Acceso` y `Redes` desde WIP visible hasta dominio operativo real.
