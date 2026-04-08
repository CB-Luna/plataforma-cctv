# 06. Backlog Priorizado Web

> Regla de priorizacion: primero se corrige lo que compromete contexto, contrato, tenant onboarding y verdad del producto; despues lo que mejora cobertura funcional; al final lo que solo pule presentacion o conveniencia.

## Escala usada

- Prioridad: critica, alta, media, baja.
- Tipo: bug, gap, ux, integracion, documentacion.
- Esfuerzo estimado: XS, S, M, L, XL.
- Dependencia: referencia a fase, decision o contrato backend.

## Backlog priorizado

> Actualizacion post-F6 (2026-04-08):
> este backlog ya no enumera el trabajo de correccion de rumbo que quedo cerrado, sino el trabajo residual despues de F6 y lo que sigue vivo para F7 o la etapa siguiente.

| ID | Modulo | Tarea | Prioridad | Tipo | Dependencia | Esfuerzo estimado | Riesgo | Criterio de terminado |
|---|---|---|---|---|---|---|---|---|
| WEB-001 | Auth / multi-tenant | Alinear `LoginResponse`, `auth-store` y login page con el payload real que puede incluir `companies` | Critica | Integracion | Fase 0 aprobada; contrato actual `POST /auth/login` | M | Alto | El flujo de login usa el contrato real y deja de depender de una interpretacion incompleta del payload |
| WEB-002 | Auth / multi-tenant | Redefinir el flujo `login -> select-company -> contexto activo` para usuarios con una y multiples empresas | Critica | Gap | WEB-001; decision DEC-01 | L | Alto | El usuario monoempresa entra directo; el multiempresa elige contexto de forma explicita y verificable |
| WEB-003 | Header / tenant switch | Retirar o rehacer el cambio de empresa del header para que no dependa de `X-Company-ID` como cambio real de tenant | Critica | Bug | WEB-002; contrato backend sin `switch-company` | M | Alto | No existe cambio visual de empresa sin cambio real de contexto |
| WEB-004 | Tenant store | Definir una unica fuente de verdad para empresa activa e hidratarla correctamente tras recarga | Critica | Integracion | WEB-002 | M | Alto | El tenant activo sobrevive a refresh sin caer a un estado ambiguo |
| WEB-005 | Permisos | Implementar guardas minimas de pagina y accion usando permisos, no solo menu lateral | Critica | Gap | Fase 1; modelo de scopes confirmado | M | Alto | Las acciones criticas no son visibles ni ejecutables fuera de permiso |
| WEB-006 | Sitio activo | Conectar `site-store` al contexto operativo real o degradar honestamente el selector de sucursal | Alta | Gap | Fase 1 cerrada; decision tenant-cliente-sitio | M | Alto | El sitio afecta consultas/listados o el selector queda identificado como no operativo |
| WEB-007 | Tickets | Sustituir UUIDs manuales por selectores de cliente, sitio y tecnico con datos reales disponibles | Alta | UX | WEB-006; fuentes de datos existentes | L | Alto | Crear y actualizar tickets ya no requiere escribir IDs crudos |
| WEB-008 | Polizas | Sustituir UUIDs manuales por selectores de cliente, sitio y activos cubiertos | Alta | UX | WEB-006; relaciones operativas definidas | L | Alto | Crear/editar polizas y activos cubiertos sin IDs manuales |
| WEB-009 | Camaras | Confirmar y ajustar la accion de edicion de camaras al contrato real del backend | Alta | Integracion | Auditoria API; decision sobre degradacion | S | Alto | La UI no ofrece `PUT` si no existe soporte real, o la accion queda alineada al contrato valido |
| WEB-010 | Importaciones | Rehacer el flujo de importacion para enviar `column_mapping` y `data` utiles o reducir el alcance visible del modulo | Alta | Gap | Fase 3; contrato actual de import batch | L | Alto | La importacion genera un batch valido y resultado util, o queda claramente limitada |
| WEB-011 | Floor plans | Limitar herramientas o ajustar persistencia para no perder semantica al guardar | Alta | Bug | Fase 3; contrato de floor plans | M | Medio | El usuario no pierde tipos de elementos soportados sin aviso |
| WEB-012 | Mapa | Etiquetar o degradar el mapa mientras use coordenadas sinteticas por ciudad | Alta | UX | Fase 3; falta de lat/lng reales | S | Medio | El mapa comunica su nivel de precision y no se presenta como geolocalizacion exacta |
| WEB-013 | Sidebar / menu | Decidir y ejecutar estrategia de menu fijo vs dinamico usando menu templates y permisos | Alta | Gap | DEC-04 y DEC-07 | L | Medio | Existe criterio cerrado y la navegacion responde a esa decision sin contradicciones |
| WEB-014 | Settings | Separar conceptualmente configuracion global, tenant e hibrida dentro de `/settings` | Alta | UX | DEC-06 | M | Medio | El usuario entiende que tabs son de plataforma y cuales son propias del tenant |
| WEB-015 | Tenants / branding | Incorporar UI para logo de tenant y aclarar alcance del branding | Media | Integracion | Fase 5; endpoint `uploadTenantLogo` existente | M | Bajo | Se puede cargar logo desde la UI o queda documentado por que se difiere |
| WEB-016 | Users / roles | Alinear las pantallas alias (`/users`, `/roles`, `/tenants`, `/storage`, `/intelligence`) con una estrategia de routing clara | Media | UX | Fase 2 o 5 | S | Bajo | Las URLs alias no generan ambiguedad y el breadcrumb es coherente |
| WEB-017 | Dashboard | Revisar KPIs y accesos rapidos para que respondan al tenant activo y al sitio cuando aplique | Media | Integracion | WEB-004; WEB-006 | M | Medio | El dashboard no muestra agregados contradictorios con el contexto activo |
| WEB-018 | Clientes | Explicitar alcance real de clientes como lista/alta/detalle y evitar prometer CRUD completo si no existe API | Media | Documentacion | Auditoria API | S | Bajo | La UI y los textos no prometen acciones que el backend no soporta |
| WEB-019 | SLA | Alinear SLA con el flujo de polizas y cobertura contractual | Media | Gap | Fase 4; decision DEC-05 | M | Medio | SLA deja de verse como catalogo aislado y se integra semanticamente con polizas |
| WEB-020 | CAPEX / garantias | Definir si CAPEX es vista derivada o modulo autonomo y ajustar copy/acciones | Media | UX | DEC-08 | S | Bajo | El modulo refleja su rol real y no sobrepromete proceso propio |
| WEB-021 | Inventario | Normalizar tablas, filtros y estados vacios segun contexto cliente-sitio-activo | Media | UX | WEB-006 | M | Medio | Inventario usa filtros consistentes y muestra estados honestos |
| WEB-022 | NVR | Verificar y completar consistencia CRUD y relaciones con sitio/camaras | Media | Integracion | Fase 3 | M | Medio | NVR puede operarse sin inconsistencias visibles tras recarga |
| WEB-023 | Topologia | Revisar coherencia de topologia con floor plans e inventario del sitio | Media | Integracion | WEB-011; WEB-021 | M | Medio | La topologia refleja activos y no queda desacoplada del resto del modulo CCTV |
| WEB-024 | Errores globales | Unificar manejo de errores funcionales, de permiso y de red en formularios y tablas | Media | UX | Transversal | M | Medio | Los modulos presentan errores diferenciados y recuperables |
| WEB-025 | Estado vacio | Estandarizar mensajes y CTAs de estados vacios, sin permiso y sin integracion | Media | UX | Transversal | S | Bajo | Los modulos ya no muestran vacios ambiguos |
| WEB-026 | Documentacion tecnica | Corregir puertos y contratos desactualizados en docs de `cctv_web` y scripts auxiliares | Media | Documentacion | Hardening | S | Medio | La documentacion usa puertos coherentes y scripts no apuntan a endpoints obsoletos |
| WEB-027 | Playwright / QA | Alinear `playwright.config.ts` y smoke tests al puerto y flujo reales del proyecto | Media | Integracion | Hardening; entorno reproducible | S | Medio | Las pruebas e2e apuntan al shell correcto y al flujo vigente |
| WEB-028 | Build / middleware | Atender la advertencia de Next 16 sobre `middleware` y migracion futura a `proxy` | Baja | Documentacion | Hardening; decision tecnica | S | Bajo | Existe decision documentada y plan de ajuste |
| WEB-029 | IA | Confirmar ownership y alcance de configuracion de IA por tenant o plataforma | Baja | Gap | DEC-06 | S | Bajo | El modulo comunica con claridad su ambito de configuracion |
| WEB-030 | Storage | Confirmar ownership y alcance de configuracion de storage por tenant o plataforma | Baja | Gap | DEC-06 | S | Bajo | El modulo comunica con claridad su ambito de configuracion |
| WEB-031 | Tenant onboarding | Repetir smoke live del flujo `crear tenant -> branding -> admin inicial -> login valido` contra backend levantado en el workspace | Alta | Integracion | F6 cerrada; contrato `tenants` + `auth/register` | M | Medio | Existe validacion live reproducible, no solo mockeada |
| WEB-032 | Tenant onboarding | Formalizar politica de seguridad para el uso de `POST /auth/register` como bootstrap administrativo | Alta | Documentacion | API-10; decision DEC-09 | M | Alto | Queda explicitamente aprobado cuando aplica bootstrap inicial y cuando no |
| WEB-033 | Users tenant | Implementar alta de usuario interno del tenant si se aprueba el flujo seguro sobre contrato actual | Alta | Integracion | WEB-032; validacion producto/seguridad | L | Alto | El tenant puede dar de alta usuarios internos sin hacks ni supuestos |
| WEB-034 | Servicios habilitados | Endurecer el catalogo hacia una fuente administrable o backend si producto exige gobierno mas fuerte | Alta | Gap | BIZ-03; BIZ-06 | M | Alto | La matriz servicio -> menu -> modulo -> tenant deja de vivir solo en frontend |
| WEB-035 | Paquetes | Mantener separacion entre `subscription_plan` y producto visible, evitando regresiones de copy y UX | Media | Documentacion | WEB-034 | S | Medio | Ninguna pantalla vuelve a vender `basic/professional/enterprise` como modulo ya construido |
| WEB-036 | Menu runtime | Decidir si el runtime se quedara fijo hasta etapa 2 o si debe unificarse con `menu_templates` como fuente unica | Alta | Gap | WEB-013; WEB-034 | L | Alto | Existe una sola estrategia defendible de menu runtime |
| WEB-037 | Portal tenant | Evaluar si el portal tenant necesita layout/rutas aisladas o si la shell endurecida actual es suficiente | Alta | UX | MT-01; MT-05 | M | Medio | Existe decision aprobada sobre aislamiento tecnico del portal |
| WEB-038 | Roles tenant | Cerrar ciclo real de usuarios y roles internos, mas alla de listado, update y password | Alta | UX | DEC-03; WEB-033 | M | Medio | El tenant puede administrar su equipo con ownership claro |
| WEB-039 | Control de Acceso | Mantener el dominio fuera del menu y del discurso de modulo actual despues de la auditoria C6.4 | Critica | Documentacion | C6.4 cerrada | S | Alto | Ninguna UI ni doc lo presenta como modulo existente |
| WEB-040 | Control de Acceso | Diseñar la etapa propia del dominio como producto nuevo, con contrato, inventario y operacion reales | Alta | Gap | WEB-039 | L | Alto | Existe fase propia, alcance y criterio de salida para ese dominio |
| WEB-041 | Sitios / sucursales | Explicitar en UI y docs que el CRUD de sitios sigue bloqueado por backend | Alta | Documentacion | API-03 | S | Medio | No se promete una administracion de sucursales que hoy no existe |

## Agrupacion sugerida por fase

### Fase 1

- WEB-001
- WEB-002
- WEB-003
- WEB-004
- WEB-005

### Fase 2

- WEB-006
- WEB-007
- WEB-008
- WEB-014
- WEB-016
- WEB-021

### Fase 3

- WEB-009
- WEB-010
- WEB-011
- WEB-012
- WEB-022
- WEB-023

### Fase 4

- WEB-019
- WEB-020

### Fase 5

- WEB-013
- WEB-015
- WEB-029
- WEB-030

### Residual post-F6 / etapa siguiente

- WEB-031
- WEB-032
- WEB-033
- WEB-034
- WEB-035
- WEB-036
- WEB-037
- WEB-038
- WEB-039
- WEB-040
- WEB-041

### Fase 7

- WEB-024
- WEB-025
- WEB-026
- WEB-027
- WEB-028

## Bloqueadores de backlog

- Mientras no se confirme DEC-09, el bootstrap del admin inicial del tenant no debe sobredisenarse.
- Mientras no se confirme DEC-10, `subscription_plan` no debe tratarse como paquete funcional real.
- Mientras no se confirme DEC-11, el sidebar no debe presentarse como si ya estuviera gobernado por tenant + rol + servicio.
- Mientras no se confirme DEC-12, el portal tenant seguira apoyado en la shell endurecida actual y no en rutas/layout aislados.
- Mientras el backend no exponga mejor soporte de sitios, la administracion real de sucursales debe tratarse como bloqueo.
- La auditoria formal de `Control de Acceso` ya quedo cerrada en C6.4; mientras no exista etapa propia del dominio, no debe venderse como modulo disponible.

## Lectura ejecutiva del backlog

Las prioridades criticas ya no son solo tecnicas. Ahora atacan el riesgo sistemico de que la aplicacion proyecte una experiencia enterprise sin haber cerrado todavia:

- el onboarding real del tenant,
- el catalogo de servicios habilitados,
- el portal tenant autocontenido,
- y la verdad del dominio `Control de Acceso`.

Corregir primero ese nucleo evita que el proyecto entre a hardening sobre una promesa de producto que aun no existe.
