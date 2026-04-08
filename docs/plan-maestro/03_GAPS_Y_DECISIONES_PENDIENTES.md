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
| API-12 | No hay evidencia auditada de APIs operativas para `Control de Acceso` | No aparecen rutas equivalentes al dominio CCTV en el contrato revisado | El dominio no puede venderse como modulo existente | Auditarlo como etapa nueva de producto |

## GAP de frontend / UI

| ID | GAP | Evidencia | Impacto | Recomendacion |
|---|---|---|---|---|
| FE-01 | Login multiempresa inicialmente no consumia `companies` de `POST /auth/login` | GAP ya tratado en Fase 1 | Riesgo alto de contexto ambiguo | Se considera resuelto para el alcance de Fase 1 |
| FE-02 | Cambio de empresa en header era enganoso | GAP ya tratado en Fase 1 | Riesgo alto de contexto visual distinto al real | Se considera resuelto para el alcance de Fase 1 |
| FE-03 | Selector de sucursal no tenia efecto real | GAP mitigado parcialmente en Fase 2 | Contexto visible, pero no siempre transversal | Mantenerlo como limite de contrato hasta tener CRUD real de sitios |
| FE-04 | Importacion masiva era incompleta | GAP mitigado en Fase 3 | Flujo aparente sin carga util | Mantener validacion fuerte sobre lo que realmente importa |
| FE-05 | Tickets usaban UUID manual para cliente, sitio y tecnico | GAP mitigado en Fase 2/Fase 4 | UX fragil | Se considera resuelto para el flujo principal |
| FE-06 | Polizas usaban UUID manual para cliente, sitio y activos | GAP mitigado en Fase 2/Fase 4 | UX fragil | Se considera resuelto para el flujo principal |
| FE-07 | Sidebar runtime aun no usa el menu dinamico completo del backend | `sidebar.tsx` sigue hardcodeado; Fase 5 agrego consola real de `menu_templates` | El producto administra plantillas, pero no las capitaliza en la navegacion diaria | Dejar la integracion runtime del menu como cierre posterior y no prometer dinamismo operativo |
| FE-08 | No hay guardas de permisos por pagina/accion en toda la superficie | Hay enforcement parcial, no total | Riesgo de acciones visibles fuera de scope | Endurecer gradualmente y validarlo en hardening |
| FE-09 | Mapa usa coordenadas sinteticas | `branch-map.tsx`, `city-coordinates.ts` | Modulo demostrable, pero no confiable | Etiquetarlo como aproximado o sacarlo de core |
| FE-10 | Persistencia de floor plans es parcial | Se usa proyeccion legacy + documento enriquecido | Riesgo de perdida semantica si crece el editor | Mantener alcance controlado y probar reabrir/guardar |
| FE-11 | Branding de tenant no tiene flujo avanzado de media | Hay upload, pero no recorte ni variantes por canal | El branding base existe, pero no esta endurecido | Mantener upload simple y dejar tratamiento avanzado para hardening posterior |
| FE-12 | Varias rutas administrativas son solo redirects a `/settings` | `/users`, `/roles`, `/storage`, `/intelligence`, `/tenants` | Duplica superficie sin navegacion profunda por URL | Decidir si se mantienen como aliases o se eliminan |
| FE-13 | No existe flujo UI de bootstrap de admin inicial por tenant | La web crea tenant, pero no crea el primer usuario operativo de esa empresa | El tenant no queda listo end-to-end al terminar el alta | Definir flujo controlado de onboarding o documentar bloqueo |
| FE-14 | No existe portal tenant realmente autocontenido | La separacion en `/settings` es parcial y el shell principal sigue siendo compartido | El usuario tenant sigue sintiendose dentro del backoffice global | Definir shell, narrativa y rutas tenant con criterio de producto |
| FE-15 | No existe superficie web real de `Control de Acceso` | No hay rutas o paginas equivalentes al bloque CCTV para ese dominio | No puede venderse como modulo habilitable operativo | Auditar backend/frontend y convertirlo en etapa propia de construccion |
| FE-16 | `subscription_plan` se muestra como si fuera un plan funcional cerrado | El alta de tenant ya usa `basic/professional/enterprise` | Puede generar expectativa falsa sobre modulos incluidos | Separar plan comercial de producto visible hasta definir catalogo |

## GAP de modelo de negocio

| ID | GAP | Evidencia | Impacto | Recomendacion |
|---|---|---|---|---|
| BIZ-01 | Tenant y cliente ya fueron distinguidos, pero su UX sigue mezclandose en varios lugares | Backend tiene `tenants` y `clients`; la UI aun usa "empresa" para ambos niveles en zonas puntuales | Ambiguedad estructural residual | Seguir estabilizando el vocabulario de producto |
| BIZ-02 | Sitio no esta formalizado como entidad administrable transversal | Existe en inventario y filtros, pero sin CRUD real | El sistema no "piensa" por sitio de forma completa | Declararlo entidad core consumida mientras la API no cambie |
| BIZ-03 | No esta definido el catalogo de servicios habilitados | La UI sugiere CCTV, IA, storage, CAPEX, polizas y ejemplos como `Control de Acceso` | Complica menu, pricing, scopes y roadmap | Confirmar modulos por servicio y su criterio de habilitacion |
| BIZ-04 | CAPEX/garantias no tiene rol de negocio cerrado | Hoy deriva de inventario | Puede crecer sin modelo | Mantenerlo derivado hasta definir proceso |
| BIZ-05 | Paquete, poliza y SLA ya quedaron diferenciados conceptualmente, pero no materializados como modelo de producto integral | Hoy coexisten, pero el producto aun no gobierna menu/portal con esa semantica | Riesgo de duplicidad conceptual | Formalizar la relacion en Fase 6 |
| BIZ-06 | `subscription_plan` no equivale hoy a un paquete funcional real | El tenant guarda `basic/professional/enterprise`, pero no existe una matriz viva de servicios/modulos | Riesgo alto de vender planes sin significado operativo | Separar plan comercial, servicio habilitado y modulo visible |
| BIZ-07 | No esta cerrada la definicion de "tenant operable" | El sistema crea tenants, pero no deja claro que los vuelve utilizables end-to-end | El producto puede declararse avanzado sin resolver onboarding real | Definir checklist minimo de tenant listo para operar |
| BIZ-08 | `Control de Acceso` aparece como dominio deseado, no como producto existente | Hay menciones conceptuales, pero no superficie equivalente al modulo CCTV | Riesgo de sobrepromesa comercial y funcional | Tratarlo como etapa nueva, no como feature ya presente |

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
| MT-01 | Multiempresa basica ya funciona, pero el tenant no entra a un portal con identidad propia | Login y seleccion de empresa existen; el shell sigue siendo comun | La experiencia SaaS enterprise sigue incompleta | Definir portal tenant como producto, no solo como subset del backoffice |
| MT-02 | La empresa activa existe, pero el tenant no queda "operable" desde el alta | Se crea tenant y branding, pero no admin inicial | El producto parece avanzado sin cerrar onboarding | Introducir checklist de tenant listo para operar |
| MT-03 | La configuracion hibrida ya es visible, pero aun no existe particion fuerte por rutas o shells | Fase 5 separo scopes en `/settings`, aunque varios aliases siguen en una sola shell | Menor confusion, pero el backoffice aun depende de una pantalla compartida | Decidir en Fase 6 si basta el shell actual o si conviene abrir rutas/shells dedicados |
| MT-04 | Menu por tenant ya se administra, pero no gobierna el sidebar operativo | Backend de menu avanzado + consola Fase 5 + sidebar hardcodeado | La base multi-tenant ya esta preparada, pero la experiencia final sigue parcial | Confirmar si la V1 cierra con menu fijo o si el runtime dinamico pasa a una fase posterior |
| MT-05 | No existe criterio operativo cerrado de visibilidad por tenant + rol + servicio | Existen permisos y templates, pero no catalogo de servicios habilitados | La navegacion y el producto comercial quedan desacoplados | Definir primero el modelo y luego ejecutar la navegacion |

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

## Decisiones que deben reabrirse en Fase 6

Estas decisiones ya no pueden seguir implcitas:

- DEC-09: como se bootstrapea el usuario admin inicial del tenant sin vender un flujo inexistente.
- DEC-10: si `subscription_plan` seguira siendo solo metadato comercial o se convertira en paquete funcional real.
- DEC-11: que parte del menu visible depende de tenant, de rol, de servicio habilitado o de una combinacion de los tres.
- DEC-12: si el portal tenant puede vivir en la shell actual o necesita shell/rutas dedicadas.
- DEC-13: si `Control de Acceso` pasa a ser compromiso real de la siguiente etapa o queda explicitamente fuera del producto actual hasta tener contrato y superficie.

## Conclusiones

El sistema ya tiene suficiente superficie como para requerir disciplina de producto, no solo disciplina tecnica.

La condicion para seguir programando con seguridad ya no es "tener otra pantalla", sino validar:

- como se deja realmente listo un tenant para operar,
- que significa de verdad un servicio habilitado,
- como se ve un portal tenant autocontenido,
- y si `Control de Acceso` existe como dominio real o sigue siendo solo expectativa.
