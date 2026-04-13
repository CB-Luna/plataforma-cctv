# Plan de Avance - App Movil Operativa por Tenant

> Documento vivo para `cctv_mobile`.
> La app objetivo es operativa, orientada a tecnicos y supervisores de campo.
> Criterio de cierre: experiencia visible en emulador o dispositivo + flujo real con backend actual.

---

## Objetivo del producto

Construir una app movil modular por tenant para ejecutar trabajo de campo dentro de SyMTickets:

- recibir tickets
- ver prioridad y SLA
- ubicar sitio y equipo
- diagnosticar
- capturar evidencia
- resolver, escalar o cerrar

La app no busca reemplazar al CRM. Busca ejecutar operacion.

---

## Principios rectores

- La app es tenant-aware, no plataforma-global.
- El tecnico es la persona principal.
- Los modulos visibles dependen de tenant + rol + backend real.
- Primero acciones operativas, despues estadisticas.
- No cerrar fases con mocks si el backend real no soporta el flujo.

---

## Dependencias backend confirmadas

Al momento de este plan, `cctv_server` ya ofrece piezas utiles para movil:

- `POST /auth/login`
- `GET /auth/me`
- `GET /tickets`
- `GET /tickets/:id`
- `PATCH /tickets/:id/status`
- `PATCH /tickets/:id/assign`
- `GET /tickets/:id/timeline`
- `GET /tickets/:id/comments`
- `POST /tickets/:id/comments`
- `GET /tickets/stats`
- `POST /storage/upload`
- `GET /inventory/cameras`
- `GET /inventory/nvrs`
- `GET /inventory/summary`
- `GET /inventory/floor-plans/sites`
- `GET /inventory/floor-plans/site/:siteId`

GAPs relevantes ya conocidos:

- sin `POST /auth/refresh`
- sin `POST /auth/switch-company`
- sin `POST/PUT/DELETE /sites`

---

## Politica de cierre de fase

Al terminar cualquier fase:

1. `flutter analyze`
2. ejecucion real en emulador o dispositivo
3. validacion contra `cctv_server` real cuando el flujo dependa de backend
4. actualizacion del estado en este documento

---

## Resumen de fases

| Fase | Nombre | Prioridad | Estado |
|------|--------|-----------|--------|
| F0 | Definicion funcional y contrato movil | Critica | Pendiente |
| F1 | Base tecnica ejecutable y saneamiento del proyecto Flutter | Critica | Pendiente |
| F2 | Auth multiempresa y branding por tenant | Critica | Pendiente |
| F3 | Shell operativa y Home orientada a accion | Alta | Pendiente |
| F4 | Tickets operativos reales | Critica | Pendiente |
| F5 | Ejecucion de trabajo en campo | Critica | Pendiente |
| F6 | Equipos y modulos operativos | Alta | Pendiente |
| F7 | Sitios, planos y contexto visual | Alta | Pendiente |
| F8 | Resiliencia movil y trabajo con mala conectividad | Alta | Pendiente |
| F9 | Supervisor de campo y observabilidad operativa | Media | Pendiente |
| F10 | QA, release y handoff | Alta | Pendiente |

---

## F0 - Definicion funcional y contrato movil

**Objetivo:** cerrar la definicion de producto antes de crecer UI o codigo.

**Entregables:**

- confirmar que la persona principal es `tecnico de campo`
- definir roles iniciales soportados por la app
- definir navegacion base
- mapear modulo -> pantallas -> endpoints reales
- documentar GAPs backend que bloqueen roadmap

**Salida esperada:**

- criterios claros de que entra y que no entra a la v1 movil
- backlog priorizado por valor operativo real

---

## F1 - Base tecnica ejecutable y saneamiento del proyecto Flutter

**Objetivo:** convertir `cctv_mobile` en una base realmente corrible y mantenible.

**Checklist inicial:**

- generar y validar plataforma Android si falta
- mantener iOS operativo
- revisar configuracion de `baseUrl`
- quitar dependencias o features fantasmas no usadas
- dejar estrategia minima de configuracion por ambiente

**Criterio de cierre:**

- corre en emulador Android
- corre en simulador o build iOS si el entorno lo permite
- `flutter analyze` limpio

---

## F2 - Auth multiempresa y branding por tenant

**Objetivo:** alinear login movil con la arquitectura real multi-tenant.

**Trabajo esperado:**

- consumir `companies` que ya devuelve el backend en login
- permitir seleccion de empresa si el correo pertenece a varias
- persistir tenant activo correctamente
- mostrar logo y colores del tenant en login, shell y estados vacios
- eliminar dependencia final de `defaultTenantId` fijo

**Criterio de cierre:**

- login real con tenant correcto
- sesion guarda tenant activo
- la UI refleja empresa activa sin hardcodes

---

## F3 - Shell operativa y Home orientada a accion

**Objetivo:** reemplazar la home tipo prototipo por una home de trabajo.

**Trabajo esperado:**

- header con identidad del tenant y estado del tecnico
- bloque principal de "proxima accion"
- accesos reales a tickets, equipos, evidencias pendientes y ruta
- navegacion inferior simple y estable

**Criterio de cierre:**

- al abrir la app se entiende que hacer sin leer tarjetas de relleno
- errores y estados vacios no rompen la pantalla

---

## F4 - Tickets operativos reales

**Objetivo:** cerrar el corazon de la app.

**Trabajo esperado:**

- lista de tickets asignados con filtros utiles
- cards con prioridad, SLA, sitio, cliente, equipo y estado
- detalle con resumen, ubicacion, equipo, historial y comentarios
- lectura clara de riesgo y urgencia

**Criterio de cierre:**

- un tecnico puede abrir, entender y seguir un ticket real de punta a punta

---

## F5 - Ejecucion de trabajo en campo

**Objetivo:** permitir que la app no solo vea tickets, sino que los opere.

**Trabajo esperado:**

- iniciar ticket
- cambiar estados compatibles con backend
- registrar comentarios operativos
- subir evidencia
- capturar firma o conformidad
- cerrar o resolver ticket

**Notas:**

- no inventar estados que el backend no acepte
- si hace falta `accept/reject/reassign`, primero confirmar contrato real

**Criterio de cierre:**

- al menos un flujo real de atencion puede completarse desde el movil

---

## F6 - Equipos y modulos operativos

**Objetivo:** conectar la app con inventario y con la idea de modulos por tenant.

**Trabajo esperado:**

- busqueda de camaras y NVRs
- detalle de equipo relacionado al ticket
- entry point de escaneo QR
- UI condicional por modulos habilitados
- base para crecer a `Redes` y `Control de Acceso`

**Criterio de cierre:**

- el tecnico ya no llega "a ciegas"; ve equipo y contexto real

---

## F7 - Sitios, planos y contexto visual

**Objetivo:** dar contexto espacial a la operacion.

**Trabajo esperado:**

- mostrar informacion del sitio
- abrir direccion o mapa externo cuando aplique
- integrar floor plans por sitio si el backend y assets lo permiten
- ubicar equipo afectado dentro del contexto de la sucursal

**Criterio de cierre:**

- el ticket puede entenderse tambien en termino de lugar, no solo de texto

---

## F8 - Resiliencia movil y trabajo con mala conectividad

**Objetivo:** preparar la app para condiciones reales de campo.

**Trabajo esperado:**

- cola local de acciones pendientes
- reintentos claros
- manejo de conectividad
- estados de subida pendiente para evidencia
- proteccion contra perdida de formulario

**Criterio de cierre:**

- la app no se cae operativamente al perder conexion por periodos cortos

---

## F9 - Supervisor de campo y observabilidad operativa

**Objetivo:** ampliar la utilidad para un rol de supervision sin contaminar la experiencia del tecnico.

**Trabajo esperado:**

- vista de carga de tecnicos
- tickets por cuadrilla o zona
- historial operativo
- reasignacion si el backend y permisos lo permiten

**Criterio de cierre:**

- existe una experiencia secundaria para supervision sin convertir la app en CRM

---

## F10 - QA, release y handoff

**Objetivo:** dejar la app lista para evolucion controlada.

**Trabajo esperado:**

- smoke tests de rutas principales
- checklist de regresion manual
- pruebas en distintos tamanos de pantalla
- documentacion de ambientes
- criterios de versionado y release

**Criterio de cierre:**

- la app puede seguir creciendo sin depender de memoria tribal

---

## Fuera de alcance para la primera etapa

No meter de inicio:

- configuracion global de plataforma
- CRUD enterprise de tenants
- shell de backoffice
- promesas de IA, push, offline total o geofencing sin contrato real

---

## Regla final

Si una fase produce una app que solo "muestra datos" pero no ayuda a ejecutar trabajo real en campo, la fase no esta bien orientada aunque el codigo funcione.
