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

## Que NO quedo realmente hecho

No quedo cerrado lo que da sentido al producto SaaS enterprise esperado:

- portal tenant autocontenido y claramente separado del backoffice global,
- gestion completa de usuarios internos del tenant desde el flujo administrativo,
- gobierno unificado de menu runtime por tenant + rol + servicio desde una sola fuente,
- gestion fuerte de paquetes/servicios desde backend si se quiere algo mas que catalogo frontend,
- y modulo `Control de Acceso` como superficie web real.

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
- y crecer despues a nuevos dominios como `Control de Acceso`.

En otras palabras:

**se resolvio primero la plataforma existente, y apenas en C6.1/C6.2 se cerro el onboarding inicial y el catalogo visible de servicios; el modelo enterprise completo sigue abierto.**

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
- pero el dominio de usuarios internos del tenant sigue parcial y necesita retomarse en C6.3.

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
- y modulos operativos nuevos para dominios planeados como `Control de Acceso` o `Redes`.

Conclusion:

- hoy el plan comercial y el plan funcional ya estan separados dentro de la web,
- pero la gobernanza sigue siendo frontend-first y todavia no existe como dominio administrativo cerrado de backend.

### Bloque C. Portal tenant real

Hoy existe:

- usuarios del tenant listados,
- cambio de password,
- asignacion de roles,
- cierta separacion visual entre plataforma y tenant,
- y un contexto visible del tenant mas claro.

Hoy no existe cerrado:

- alta administrativa de usuarios internos del tenant desde el backoffice,
- shell o narrativa claramente distinta para el tenant,
- experiencia en la que un usuario tipo "Bimbo Admin" sienta que esta dentro de su propio portal y no dentro del backoffice global.

Conclusion:

- el portal tenant sigue parcial y es el siguiente foco correcto.

### Bloque D. Control de Acceso

Hoy existe:

- semantica conceptual del servicio `access_control` en el catalogo de producto,
- referencias de producto y ejemplos de menu deseado,
- y una clasificacion honesta como dominio planeado, no operativo.

Hoy no existe evidencia suficiente de:

- rutas reales del modulo,
- paginas reales del modulo,
- CRUD u operacion del dominio,
- ni una superficie web navegable equivalente a CCTV.

Conclusion:

- `Control de Acceso` hoy debe tratarse como dominio no construido, no como modulo ya habilitable.

## Matriz honesta de esperado vs real

| Expectativa de producto | Estado actual real | Faltante real | Bloqueado por backend | Implementable en web ya | Observaciones |
|---|---|---|---|---|---|
| Alta de empresa/tenant | Existe alta de tenant con branding, plan y servicios visibles | Endurecer experiencia y validacion live contra backend levantado | No totalmente | Si | El alta ya no es solo ficha; ahora puede dejar onboarding inicial avanzado |
| Branding por empresa | Existe logo, colores y tema basico | Endurecimiento de media y consistencia del portal tenant | No critico | Si | Branding base ya existe |
| Usuario admin inicial del tenant | Existe flujo de bootstrap desde Empresas con password y asignacion de `tenant_admin` | Repetir smoke live y endurecer politicas de seguridad del bootstrap | Parcial | Si | Se implemento sobre `POST /auth/register` + asignacion de rol, sin tocar backend |
| Tenant puede iniciar sesion de verdad | Si, si el usuario existe y tiene rol | Validar smoke live en ambiente levantado y cerrar narrativa tenant | Parcial | Si | El login existe; el alta ya puede dejar al tenant mucho mas cerca de operar |
| Roles internos por tenant | Existen y pueden administrarse parcialmente | Cerrar ciclo real dentro del portal tenant | No total | Si | Falta ownership de portal tenant |
| Usuarios internos del tenant | Se listan, editan, asignan roles y password | Alta administrativa real de nuevos usuarios | Parcial | Si, si se aprueba integrar register o cambia backend | `/users` no tiene `POST` |
| Sitios/sucursales administrables | Se consumen como contexto operativo | CRUD real de sitios/sucursales | Si | No completo | Sigue siendo GAP fuerte de backend |
| Servicios habilitados por empresa | Existe catalogo frontend y persistencia en `enabled_services` | Llevarlo a gobierno mas fuerte o backend si se requiere | En parte | Si | La web ya separa servicios operativos de dominios planeados |
| Que incluye basic/professional/enterprise | Ya esta definido en el catalogo vigente del shell actual | Validar si debe migrar a catalogo administrable o backend | No necesariamente | Si | Hoy ya no se comunica como metadato vacio, sino como preset comercial visible |
| Menu por tenant + rol + servicio | Sidebar y tabs de settings ya responden a permisos + servicios; `menu_templates` sigue aparte | Unificar runtime completo con menu dinamico | No total | Parcial | Ya existe gobierno real, pero aun no una sola fuente de verdad |
| Portal tenant separado del backoffice | Solo existe separacion parcial en `/settings` | Shell, narrativa y experiencia tenant real | No total | Si | Es el foco natural de C6.3 |
| Modulo Control de Acceso operativo | No existe evidencia de superficie real | Auditar, modelar y construir el dominio | Probablemente si, en parte | No sin nueva etapa | Hoy no debe venderse como modulo existente |

## Que puede hacerse ya desde web sin tocar backend

- seguir endureciendo el onboarding tenant,
- dejar clara la diferencia entre `subscription_plan` y paquete funcional real,
- definir la experiencia del portal tenant,
- alinear el menu y la narrativa a lo que si existe,
- y auditar formalmente que `Control de Acceso` hoy no es un modulo real.

## Que depende fuerte del backend actual o de una decision muy sensible

- alta administrativa general de usuarios internos mas alla del bootstrap inicial,
- administracion completa de sitios/sucursales,
- posible gobierno persistente de servicios habilitados si se quiere algo mas fuerte que menu + permisos,
- y cualquier dominio nuevo que requiera APIs propias, como `Control de Acceso`.

## Nuevo plan correcto

Antes de hardening, el plan correcto es:

1. Cerrar Fase 6 como correccion de rumbo producto.
2. Atacar ahora el portal tenant real.
3. Auditar formalmente `Control de Acceso`.
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
   Resultado esperado:
   Modelo claro de experiencia tenant, ownership y navegacion.
4. `C6.4 Control de Acceso`
   Resultado esperado:
   Auditoria honesta del dominio y decision formal sobre su estado real.
5. `C6.5 Consolidacion F6`
   Resultado esperado:
   Integracion de hallazgos y congelamiento del nuevo rumbo antes de Fase 7.

## Regla de cierre por checkpoint

Cada checkpoint debe cerrar con:

- actualizacion de los `.md` afectados,
- respuesta explicita de que si existe, que no existe y que esta bloqueado,
- criterio claro del siguiente checkpoint,
- evidencia automatizada disponible cuando aplique,
- y aprobacion tuya antes de seguir con el siguiente bloque si el impacto de producto es alto.

## Primera conclusion ejecutiva

El sistema no debe presentarse como "terminado" ni como "enterprise completo".

La afirmacion correcta es esta:

**hoy existe una base tecnica y funcional fuerte para CCTV + operacion contractual + backoffice inicial, y ya quedaron resueltos C6.1 y C6.2; aun asi la vision enterprise esperada por producto sigue abierta en portal tenant y Control de Acceso.**
