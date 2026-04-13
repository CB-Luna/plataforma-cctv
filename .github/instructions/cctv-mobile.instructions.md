---
description: "Usar al trabajar en cctv_mobile. Define el enfoque producto de la app movil operativa por tenant, los roles objetivo, reglas de UX de campo, limites backend reales y la direccion de implementacion."
applyTo: "cctv_mobile/**"
---
# SyMTickets CCTV Mobile - Instrucciones especificas

## Proposito

La app movil no es una replica del CRM ni un mini backoffice.

La app movil es la herramienta operativa de campo del tenant.

Su objetivo principal es ayudar a ejecutar trabajo real:

- recibir tickets
- entender prioridad, SLA, sitio y equipo
- llegar al lugar correcto
- diagnosticar
- documentar evidencia
- resolver o escalar
- cerrar la atencion

## Persona principal

La persona principal de esta app es el tecnico de campo del tenant.

Tambien puede servir a:

- supervisor de campo
- coordinador operativo
- personal tecnico especializado por modulo

No es la experiencia principal para:

- Admin del Sistema
- backoffice global
- configuracion enterprise de tenants, packs, temas o permisos

Si un `super_admin` entra a esta app, debe sentirse como acceso de inspeccion o soporte, no como shell principal del producto.

## Contexto de negocio correcto

SyMTickets CCTV ya no debe pensarse solo como CCTV. La app movil debe asumir que una empresa puede tener modulos como:

- CCTV
- Redes
- Control de Acceso
- Tickets
- Planos
- Inventario
- IA asistiva

La app no debe hardcodear una sola vertical. Debe comportarse como app operativa modular por tenant.

## Regla de contexto

La app movil siempre opera en contexto tenant.

- No debe iniciar en modo plataforma global.
- No debe mezclar datos de varias empresas en una misma sesion operativa.
- No debe mostrar UI de gobierno global del producto.

Si un mismo correo existe en varias empresas, la app debe resolver el tenant de forma explicita en login o pre-home usando la respuesta real del backend.

Si el usuario solo pertenece a una empresa, la app puede entrar directo a esa empresa.

## Branding por tenant

La identidad visible de la app debe venir del tenant activo:

- logo
- nombre comercial
- colores principales
- ajustes visuales relevantes

No dejar como solucion final:

- `defaultTenantId` fijo
- logo hardcodeado de producto
- colores globales identicos para todas las empresas

La app final debe sentirse como "la app operativa de esa empresa dentro de la plataforma", no como demo generica.

## Roles y permisos

Los roles deben respetar el modelo multi-tenant del monorepo:

- los roles globales del sistema no son el foco de esta app
- los roles del tenant si deben gobernar la experiencia movil
- los permisos y servicios habilitados deben controlar que se ve y que se puede ejecutar

Modelo recomendado de producto:

- `field_technician` o equivalente como rol primario
- `field_supervisor` como rol secundario
- `tenant_admin` solo si necesita operacion movil limitada

Evitar convertir la app en una sopa de menus por cada rol. Preferir:

- pocas experiencias base
- permisos por accion
- modulos visibles segun tenant y rol

## Regla de modulos

La app debe ser modular y permission-aware.

Siempre pueden existir modulos base:

- autenticacion
- perfil
- tickets

Los modulos operativos visibles deben depender de:

- modulos habilitados para el tenant
- permisos o servicios del rol
- existencia real de backend y flujo visible

Ejemplos:

- si el tenant no tiene `Control de Acceso`, no debe aparecer su seccion
- si el rol no puede operar `Redes`, no debe ver acciones de ese modulo
- si un modulo existe visualmente pero no tiene backend real, debe tratarse como `WIP` de forma explicita y no fingirse terminado

## Regla UX

La app debe sentirse como herramienta de trabajo, no como dashboard inflado.

Principios:

- el tecnico debe saber que hacer en menos de 3 segundos
- la siguiente accion pesa mas que las estadisticas
- prioridad, SLA, sitio, equipo y estado deben leerse rapido
- los errores deben ocupar poco espacio y proponer recuperacion clara
- los botones importantes deben requerir pocos taps
- los formularios deben ser rapidos y pensados para uso en campo

Evitar:

- home llena de tarjetas decorativas
- errores enormes rompiendo la pantalla
- acciones primarias escondidas detras de menus secundarios
- UI que parezca template generico de login + dashboard + cards

## Flujo principal esperado

Flujo ideal de producto:

1. Login y seleccion de empresa si aplica
2. Home operativa con proxima accion
3. Lista de tickets asignados
4. Detalle con sitio, equipo, SLA, historial y evidencia
5. Cambio de estado en campo
6. Evidencia antes y despues
7. Firma o confirmacion de cierre
8. Resolucion o escalamiento

## Realidad actual del backend

Antes de implementar cualquier pantalla, priorizar el contrato real de `cctv_server`.

Capacidades reales ya visibles en backend:

- login y `auth/me`
- respuesta de login con `companies`, logo y colores por tenant
- tickets: listado, detalle, timeline, comentarios, cambio de estado, asignacion, stats
- storage upload para evidencia
- inventario: camaras, NVRs, summary
- floor plans por sitio

GAPs o limites ya conocidos para producto movil:

- no asumir cambio de empresa en runtime si no existe flujo real; el monorepo ya documenta ausencia de `POST /auth/switch-company`
- no asumir refresh token silencioso; el monorepo ya documenta ausencia de `POST /auth/refresh`
- no asumir CRUD completo de sucursales; el monorepo ya documenta falta de `POST/PUT/DELETE /sites`
- no inventar push, optimizacion de rutas, sincronizacion offline servidor o check-in geofenciado si no existe backend real para ello

Si una feature movil depende de algo inexistente, documentarla como GAP y no cerrarla como terminada.

## Estado actual de `cctv_mobile`

La app Flutter actual debe tratarse como base inicial, no como producto final.

Hoy ya existe:

- login
- registro
- home
- tickets
- detalle de ticket
- cierre con evidencia y firma
- perfil

Hoy todavia no esta resuelto:

- experiencia real multiempresa usando `companies` del backend
- branding real por tenant en la UI movil
- shell modular por tenant
- experiencia optimizada para tecnico de campo
- scaffolding Android operativo en el proyecto actual

## Validacion obligatoria

No cerrar un avance movil solo por existir codigo.

Siempre distinguir entre:

1. evidencia mockeada
2. evidencia de UI real en emulador o dispositivo
3. flujo real con backend actual

Validacion minima por checkpoint:

- `flutter analyze`
- ejecucion real en emulador o dispositivo
- comprobacion de endpoints reales contra `cctv_server`
- verificacion visual del contexto tenant correcto

## Orden recomendado

Seguir `.github/PLAN_APP_MOVIL.md` como plan vivo de implementacion.

Antes de tocar UX o arquitectura movil, releer tambien:

- `.github/Resumen del proyecto CCTV.md`
- `.github/instructions/cctv-project.instructions.md`

## Regla final

La app movil debe ayudar a ejecutar trabajo.

Si una propuesta se parece demasiado al CRM, al dashboard del backoffice o a una demo generica, va en direccion incorrecta.
