# 08. Correccion de Rumbo Producto

> Objetivo: reconocer explicitamente la desviacion entre el cierre tecnico de Fases 1-5 y la vision enterprise esperada por producto, y dejar un camino corregido antes de continuar con hardening.

## Que quedo realmente hecho

Las Fases 1-5 si dejaron valor real:

- contexto multi-tenant mas honesto en login, seleccion de empresa y tenant activo,
- bloque CCTV defendible respecto al contrato real,
- capa contractual de tickets, polizas y SLA mas coherente,
- y un backoffice administrativo inicial mas claro en `/settings`.

Tambien quedaron operativas estas capacidades concretas:

- alta de tenant como entidad,
- branding base por tenant con logo y paleta,
- login real cuando ya existe un usuario valido para ese tenant,
- roles del tenant con administracion parcial,
- consola inicial de `menu_templates`,
- bootstrap opcional del admin inicial del tenant desde el flujo de alta de empresa,
- recuperacion del onboarding desde la edicion del tenant cuando quedo parcial,
- snapshot visible de onboarding dentro de `tenant.settings.onboarding`,
- catalogo visible de servicios y paquetes dentro de `/settings`,
- persistencia de `enabled_services` por tenant,
- y visibilidad real de sidebar y tabs de `/settings` gobernada por permisos + servicios habilitados.
- experiencia tenant-only visible en sidebar, header, dashboard y `/settings`,
- breadcrumb, copy y CTA alineados a `Portal` y `Mi empresa` cuando el perfil no tiene backoffice global,
- y separacion explicita entre `tenant_portal` y `hybrid_backoffice` dentro de la shell compartida actual.

## Que NO quedo realmente hecho

No quedo cerrado lo que da sentido al producto SaaS enterprise esperado:

- portal tenant totalmente autocontenido con runtime/rutas dedicadas,
- gestion completa de usuarios internos del tenant desde el flujo administrativo,
- gobierno unificado de menu runtime por tenant + rol + servicio desde una sola fuente,
- gestion fuerte de paquetes/servicios desde backend si se quiere algo mas que catalogo frontend,
- y la maduracion operativa completa de modulos empresariales visibles como `Control de Acceso` y `Redes`.

## Por que hubo desviacion del objetivo original

La desviacion vino de cerrar primero el orden interno del sistema actual:

- auth y contexto,
- CCTV core,
- operacion contractual,
- y backoffice administrativo.

Eso mejoro mucho la base tecnica, pero no cerro completo el problema de negocio que esperabas:

- dejar lista a una empresa para entrar,
- operar con sus propios usuarios,
- ver solo sus modulos contratados,
- y crecer despues a dominios visibles como `Control de Acceso` y `Redes`, aunque sigan en estado WIP.

En otras palabras:

**se resolvio primero la plataforma existente, y durante C6.1-C6.5 se corrigio el rumbo del producto sin fingir que el modelo enterprise completo ya esta cerrado.**

## Regla corregida de avance

Desde este punto:

- no debe declararse una fase como "completada" si el requerimiento de negocio que la justifica sigue sin operar end-to-end,
- no debe iniciarse hardening si aun faltan definiciones o flujos base del producto esperado,
- y cada checkpoint debe cerrar con evidencia tecnica real, degradaciones honestas y siguiente paso explicito.

## Lectura por bloques

### Bloque A. Onboarding real de tenant

Hoy existe:

- alta de tenant,
- branding base,
- login por tenant cuando el usuario ya existe,
- bootstrap de admin inicial desde la UI de empresas,
- y recuperacion del onboarding cuando un tenant quedo creado sin admin listo.

Hoy no existe cerrado:

- smoke live repetido contra backend levantado en este workspace,
- alta administrativa general de usuarios internos adicionales desde `/users`,
- y una politica cerrada de seguridad/gobierno para diferenciar bootstrap inicial vs alta regular de usuarios.

Punto clave:

- el backend si expone `POST /auth/register`, por lo que hay una base tecnica para crear usuarios con password,
- la web ya lo integra dentro del flujo administrativo de onboarding del tenant,
- y el API protegido de `/users` no expone `POST /users`.

Conclusion:

- el onboarding del tenant ya es operable en web con el contrato actual hasta el admin inicial,
- pero el dominio de usuarios internos del tenant sigue parcial y debe retomarse despues de C6.3 para cerrar altas administrativas y gobierno mas completo.

### Bloque B. Servicios habilitados / paquetes / modulos

Hoy existe:

- `subscription_plan` en tenant,
- `enabled_services` persistido en `tenant.settings`,
- catalogo visible de planes y servicios en `/settings`,
- `menu_templates`,
- permisos,
- y visibilidad real en sidebar y tabs de configuracion.

Hoy no existe cerrado:

- catalogo gobernado por backend,
- menu runtime resuelto desde `menu_templates` + servicios + rol como fuente unica,
- y madurar modulos WIP como `Control de Acceso` o `Redes` hasta volverlos operativos.

Conclusion:

- hoy el plan comercial y el plan funcional ya estan separados dentro de la web,
- pero la gobernanza sigue siendo frontend-first y todavia no existe como dominio administrativo cerrado de backend.

### Bloque C. Portal tenant real

Hoy existe:

- usuarios del tenant listados,
- cambio de password,
- asignacion de roles,
- shell tenant-only con sidebar, header, dashboard y `/settings` orientados a empresa,
- copy y breadcrumbs alineados a `Portal` / `Mi empresa`,
- y una diferenciacion visible entre experiencia `tenant_portal` y `hybrid_backoffice`.

Hoy no existe cerrado:

- alta administrativa de usuarios internos del tenant desde el backoffice,
- shell o runtime aislado con rutas/layouts dedicados,
- administracion CRUD de sitios/sucursales del tenant,
- y una fuente unica de menu runtime gobernada por `menu_templates` + servicios + rol.

Conclusion:

- el portal tenant ya es defendible a nivel de experiencia dentro de la web actual, pero sigue parcial a nivel de runtime, usuarios internos completos y gobierno total del menu.

### Bloque D. Control de Acceso y Redes

Hoy existe:

- servicios asignables en el catalogo de producto,
- side menu gobernado por servicios habilitados,
- rutas reales y pantallas navegables de `Control de Acceso` y `Redes`,
- y clasificacion honesta como modulos scaffold/WIP, no operativos.

Hoy no existe evidencia suficiente de:

- CRUD u operacion cerrada del dominio,
- API dedicada de backend,
- permisos backend propios por modulo,
- ni una superficie equivalente a CCTV en profundidad funcional.

Conclusion:

- `Control de Acceso` y `Redes` hoy deben tratarse como modulos visibles del producto en estado `WIP`, no como modulos operativos terminados.

## Matriz honesta de esperado vs real

| Expectativa de producto | Estado actual real | Faltante real | Bloqueado por backend | Implementable en web ya | Observaciones |
|---|---|---|---|---|---|
| Alta de empresa/tenant | Existe alta de tenant con branding, plan y servicios visibles | Endurecer experiencia y validacion live contra backend levantado | No totalmente | Si | El alta ya no es solo ficha; ahora puede dejar onboarding inicial avanzado |
| Branding por empresa | Existe logo, colores y tema basico | Endurecimiento de media y consistencia del portal tenant | No critico | Si | Branding base ya existe |
| Usuario admin inicial del tenant | Existe flujo de bootstrap desde Empresas con password y asignacion de `tenant_admin` | Repetir smoke live y endurecer politicas de seguridad del bootstrap | Parcial | Si | Se implemento sobre `POST /auth/register` + asignacion de rol, sin tocar backend |
| Tenant puede iniciar sesion de verdad | Si, si el usuario existe y tiene rol | Validar smoke live en ambiente levantado y cerrar narrativa tenant | Parcial | Si | El login existe; el alta ya puede dejar al tenant mucho mas cerca de operar |
| Roles internos por tenant | Existen y pueden administrarse parcialmente dentro de la experiencia tenant | Cerrar ciclo real completo con altas administrativas y separacion mas fuerte del runtime | No total | Si | C6.3 ya cerro ownership visible, no el ciclo completo |
| Usuarios internos del tenant | Se listan, editan, asignan roles y password | Alta administrativa real de nuevos usuarios | Parcial | Si, si se aprueba integrar register o cambia backend | `/users` no tiene `POST` |
| Sitios/sucursales administrables | Se consumen como contexto operativo | CRUD real de sitios/sucursales | Si | No completo | Sigue siendo GAP fuerte de backend |
| Servicios habilitados por empresa | Existe catalogo frontend y persistencia en `enabled_services` | Llevarlo a gobierno mas fuerte o backend si se requiere | En parte | Si | La web ya separa servicios operativos, capacidades parciales y modulos WIP visibles |
| Que incluye basic/professional/enterprise | Ya esta definido en el catalogo vigente del shell actual | Validar si debe migrar a catalogo administrable o backend | No necesariamente | Si | Hoy ya no se comunica como metadato vacio, sino como preset comercial visible |
| Menu por tenant + rol + servicio | Sidebar y tabs de settings ya responden a permisos + servicios; los modulos WIP tambien ya aparecen por estado del dominio; `menu_templates` sigue aparte | Unificar runtime completo con menu dinamico | No total | Parcial | Ya existe gobierno real, pero aun no una sola fuente de verdad |
| Portal tenant separado del backoffice | Existe shell tenant-only sobre la misma base tecnica: sidebar, header, dashboard y `/settings` cambian por perfil y tenant | Rutas/layout aislado, menu runtime unificado y CRUD mas completo del tenant | No total | Si | C6.3 ya cerro la experiencia visible, no el aislamiento tecnico completo |
| Modulo Control de Acceso | Existe como scaffold/WIP visible en menu, rutas y pantallas | Cerrar backend, datos, RBAC y operacion del dominio | Si | Si | Ya no debe ocultarse del runtime; debe comunicarse como WIP |
| Modulo Redes | Existe como scaffold/WIP visible en menu, rutas y pantallas | Cerrar backend, datos, RBAC y operacion del dominio | Si | Si | Comparte la misma regla de visibilidad honesta del producto |

## Que puede hacerse ya desde web sin tocar backend

- seguir endureciendo el onboarding tenant,
- dejar clara la diferencia entre `subscription_plan` y paquete funcional real,
- definir la experiencia del portal tenant,
- alinear el menu y la narrativa a lo que si existe,
- y dejar formalmente visible que `Control de Acceso` y `Redes` ya existen como modulos WIP del runtime.

## Que depende fuerte del backend actual o de una decision muy sensible

- alta administrativa general de usuarios internos mas alla del bootstrap inicial,
- administracion completa de sitios/sucursales,
- posible gobierno persistente de servicios habilitados si se quiere algo mas fuerte que menu + permisos,
- y cualquier dominio nuevo que requiera APIs propias para pasar de WIP a operativo, como `Control de Acceso` o `Redes`.

## Nuevo plan correcto

Antes de hardening, el plan correcto es:

1. Cerrar Fase 6 como correccion de rumbo producto.
2. Auditar y reclasificar formalmente dominios WIP visibles del runtime.
3. Consolidar F6 y congelar el rumbo corregido.
4. Solo despues entrar a hardening.
5. Al cerrar hardening, generar un nuevo paquete documental para la siguiente etapa real del producto.

## Checkpoints propuestos para Fase 6

La Fase 6 ya no debe ejecutarse como bloque unico. Se propone este orden:

1. `C6.1 Onboarding tenant`
   Estado actual:
   Completado con validacion contractual mockeada y limitacion live pendiente.
2. `C6.2 Servicios y paquetes`
   Estado actual:
   Completado.
3. `C6.3 Portal tenant`
   Estado actual:
   Completado.
4. `C6.4 Control de Acceso`
   Estado actual:
   Completado.
5. `C6.5 Consolidacion F6`
   Estado actual:
   Completado.

## Regla de cierre por checkpoint

Cada checkpoint debe cerrar con:

- actualizacion de los `.md` afectados,
- respuesta explicita de que si existe, que no existe y que esta bloqueado,
- criterio claro del siguiente checkpoint,
- evidencia automatizada disponible cuando aplique,
- y aprobacion tuya antes de seguir con el siguiente bloque si el impacto de producto es alto.

## Primera conclusion ejecutiva

El sistema no debe presentarse como "terminado" ni como "enterprise completo".

La afirmacion correcta al cierre de F6 es esta:

**hoy existe una base tecnica y funcional fuerte para CCTV + operacion contractual + backoffice inicial, y ya quedaron resueltos C6.1, C6.2, C6.3, C6.4 y C6.5; aun asi la vision enterprise esperada por producto sigue abierta en aislamiento mas profundo del tenant y en la maduracion de modulos WIP como `Control de Acceso` y `Redes` hasta volverlos operativos.**
