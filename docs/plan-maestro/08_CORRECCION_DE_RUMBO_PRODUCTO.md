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
- y consola inicial de `menu_templates`.

## Que NO quedo realmente hecho

No quedo cerrado lo que da sentido al producto SaaS enterprise esperado:

- alta de tenant con usuario admin inicial listo para operar,
- catalogo real de servicios o modulos habilitados por empresa,
- relacion operativa entre paquete, servicio, poliza, SLA y menu visible,
- portal tenant autocontenido y claramente separado del backoffice global,
- gestion completa de usuarios internos del tenant desde el flujo administrativo,
- y modulo `Control de Acceso` como superficie web real.

## Por que hubo desviacion del objetivo original

La desviacion vino de cerrar primero el orden interno del sistema actual:

- auth y contexto,
- CCTV core,
- operacion contractual,
- y backoffice administrativo.

Eso mejoro mucho la base tecnica, pero no cerro el problema de negocio que esperabas:

- dejar lista a una empresa para entrar,
- operar con sus propios usuarios,
- ver solo sus modulos contratados,
- y crecer despues a nuevos dominios como `Control de Acceso`.

En otras palabras:

**se resolvio primero la plataforma existente, pero no se cerro todavia el modelo de producto SaaS enterprise.**

## Regla corregida de avance

Desde este punto:

- no debe declararse una fase como "completada" si el requerimiento de negocio que la justifica sigue sin operar end-to-end,
- y no debe iniciarse hardening si aun faltan definiciones o flujos base del producto esperado.

## Lectura por bloques

### Bloque A. Onboarding real de tenant

Hoy existe:

- alta de tenant,
- branding base,
- login por tenant cuando el usuario ya existe.

Hoy no existe cerrado:

- bootstrap de usuario admin inicial desde el backoffice,
- flujo end-to-end "creo empresa -> le doy admin inicial -> puede entrar hoy mismo".

Punto clave:

- el backend si expone `POST /auth/register`, por lo que hay una base tecnica para crear usuarios con password,
- pero la web actual no lo integra como flujo administrativo de onboarding,
- y el API protegido de `/users` no expone `POST /users`.

Conclusion:

- el onboarding real del tenant sigue abierto.

### Bloque B. Servicios habilitados / paquetes / modulos

Hoy existe:

- `subscription_plan` en tenant,
- `menu_templates`,
- permisos y visibilidad basica.

Hoy no existe cerrado:

- catalogo real de paquetes,
- matriz clara de que incluye `basic`, `professional` o `enterprise`,
- persistencia formal de servicios habilitados como concepto funcional,
- menu runtime gobernado por tenant + rol + servicio.

Conclusion:

- hoy el plan comercial y el plan funcional siguen mezclados y parciales.

### Bloque C. Portal tenant real

Hoy existe:

- usuarios del tenant listados,
- cambio de password,
- asignacion de roles,
- y cierta separacion visual entre plataforma y tenant.

Hoy no existe cerrado:

- alta administrativa de usuarios internos del tenant desde el backoffice,
- shell o narrativa claramente distinta para el tenant,
- experiencia en la que un usuario tipo "Bimbo Admin" sienta que esta dentro de su propio portal y no dentro del backoffice global.

Conclusion:

- el portal tenant sigue parcial.

### Bloque D. Control de Acceso

Hoy existe:

- semantica conceptual del servicio `access_control` en partes del modelo contractual,
- referencias de producto y ejemplos de menu deseado.

Hoy no existe evidencia suficiente de:

- rutas reales del modulo,
- paginas reales del modulo,
- CRUD o operacion del dominio,
- ni una superficie web navegable equivalente a CCTV.

Conclusion:

- `Control de Acceso` hoy debe tratarse como dominio no construido, no como modulo ya habilitable.

## Matriz honesta de esperado vs real

| Expectativa de producto | Estado actual real | Faltante real | Bloqueado por backend | Implementable en web ya | Observaciones |
|---|---|---|---|---|---|
| Alta de empresa/tenant | Existe alta de tenant con branding y limites base | Falta dejar a la empresa lista para operar | No totalmente | Si, parcialmente | El alta del tenant no equivale al alta del tenant operable |
| Branding por empresa | Existe logo, colores y tema basico | Falta endurecimiento de media y consistencia de portal | No critico | Si | Branding base ya existe |
| Usuario admin inicial del tenant | No existe flujo admin UI end-to-end | Crear o bootstrapear el primer admin con password | Parcial | Si, con decision de producto/seguridad | `POST /auth/register` existe, pero no como flujo administrativo cerrado |
| Tenant puede iniciar sesion de verdad | Si, si ya tiene usuario valido | Integrar esto al alta de tenant | Parcial | Si | El login existe; el problema es el onboarding completo |
| Roles internos por tenant | Existen y pueden administrarse parcialmente | Cerrar ciclo real dentro del portal tenant | No total | Si | Falta contexto de portal tenant y narrativa propia |
| Usuarios internos del tenant | Se listan, editan, asignan roles y password | Alta administrativa real de nuevos usuarios | Parcial | Si, si se aprueba integrar register o cambia backend | `/users` no tiene `POST` |
| Sitios/sucursales administrables | Se consumen como contexto operativo | CRUD real de sitios/sucursales | Si | No completo | Sigue siendo GAP fuerte de backend |
| Servicios habilitados por empresa | No existe catalogo real | Definir servicios, paquetes y reglas de visibilidad | En parte | Parcial | Hoy solo hay señales sueltas: plan, menu, permisos |
| Que incluye basic/professional/enterprise | No esta definido de forma funcional | Matriz producto -> servicio -> menu -> modulo | No necesariamente | Si, a nivel documental y de UI parcial | Hoy `subscription_plan` es metadato, no producto cerrado |
| Menu por tenant + rol + servicio | Hay `menu_templates` y permisos; sidebar runtime fijo | Runtime dinamico o criterio fijo realmente gobernado | No total | Parcial | La consola existe, la navegacion diaria aun no |
| Portal tenant separado del backoffice | Solo existe separacion parcial en `/settings` | Shell, narrativa y experiencia tenant real | No total | Si | Es un trabajo fuerte de UX y arquitectura frontend |
| Modulo Control de Acceso operativo | No existe evidencia de superficie real | Auditar, modelar y construir el dominio | Probablemente si, en parte | No sin nueva etapa | Hoy no debe venderse como modulo existente |

## Que puede hacerse ya desde web sin tocar backend

- reauditar el producto y reordenar el roadmap,
- dejar clara la diferencia entre `subscription_plan` y paquete funcional real,
- definir la experiencia del portal tenant,
- alinear el menu y la narrativa a lo que si existe,
- y auditar formalmente que `Control de Acceso` hoy no es un modulo real.

## Que depende fuerte del backend actual o de una decision muy sensible

- alta administrativa end-to-end del primer usuario del tenant,
- administracion completa de sitios/sucursales,
- posible gobierno persistente de servicios habilitados si se quiere algo mas fuerte que menu + permisos,
- y cualquier dominio nuevo que requiera APIs propias, como `Control de Acceso`.

## Nuevo plan correcto

Antes de hardening, el plan correcto es:

1. Cerrar Fase 6 como correccion de rumbo producto.
2. Reauditar tenant onboarding, servicios habilitados, portal tenant y `Control de Acceso`.
3. Acordar que parte puede resolverse con el backend actual y que parte queda como GAP formal.
4. Solo despues entrar a hardening.
5. Al cerrar hardening, generar un nuevo paquete documental para la siguiente etapa real del producto.

## Primera conclusion ejecutiva

El sistema no debe presentarse como "terminado" ni como "enterprise completo".

La afirmacion correcta es esta:

**hoy existe una base tecnica y funcional fuerte para CCTV + operacion contractual + backoffice inicial, pero la vision enterprise esperada por producto sigue abierta en tenant onboarding, servicios habilitados, portal tenant y Control de Acceso.**
