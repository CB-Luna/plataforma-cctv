# Plan de Accion v2 — SyMTickets CCTV (Abril 2026)

> Documento vivo. Actualizar estado de cada item conforme se complete.
> Criterio de cierre: la mejora es visible en runtime real, no solo en codigo.
> Plan anterior archivado en `.github/planes_completados/PLAN_DE_ACCION_v1.md`.

---

## Politica de cierre de fase (OBLIGATORIO)

Al terminar cualquier fase:
1. `npm run build` — sin errores TypeScript
2. Verificacion visual en `http://localhost:3011`
3. Si aplica, test de Playwright que valide el comportamiento nuevo
4. Commit: `git add -A && git commit -m "fase(FX): descripcion corta del cambio"`
5. Actualizar el estado de la fase en este documento

---

## Resumen de fases

| Fase | Nombre | Prioridad | Estado |
|------|--------|-----------|--------|
| F1 | Temas: aplicacion completa de colores por tenant | **Critica** | **En progreso** |
| F2 | Inventario: paginacion, filtros y buscador | **Alta** | **Completada** |
| F3 | Sidebar: ocultar paginas redundantes (/cameras, /nvrs) | Alta | **Completada** || F4 | Planos: fix texto "Salas" y mejora en grabado | Alta | **Parcial** |
| F5 | Dashboard Global real para Admin del Sistema | Critica | Pendiente |
| F6 | Shell Admin Sistema — separacion limpia de contextos | Critica | Pendiente |
| F7 | Portal Tenant — logo, nombre empresa, identidad visual | Media | Parcial |
| F8 | Encapsulamiento por tenant en pantallas de operacion | Critica | Pendiente |
| F9 | CAPEX — paginacion, estados reales, filtros por empresa | Media | Pendiente |
| F10 | Operaciones — Tickets, Clientes, Polizas coherentes | Baja | Pendiente |
| F11 | Imagen de perfil de usuario (localStorage) | Baja | Pendiente |
| F12 | Mejoras enterprise generales (tablas, empty states, toasts) | Baja | **Parcial** |

---

## Fase 1 — Temas: aplicacion completa de colores por tenant

**Objetivo:** Cuando se asigna un tema a una empresa o usuario, TODOS los componentes de la UI deben reflejar esos colores.

### F1-01: Puente de variables CSS tenant → shadcn oklch — **COMPLETADA** ✅
- **Archivos:** `theme-provider.tsx`, `globals.css`
- **Problema:** shadcn usa variables oklch (`--primary`, `--secondary`, etc.) y los temas del tenant usan hex (`--tenant-primary`). Los componentes de shadcn (botones, badges, inputs, sidebar) no cambian con el tema.
- **Solucion aplicada:** `hexToOklch()` en `theme-provider.tsx` convierte colores hex a oklch y los inyecta tanto en `--tenant-*` como en `--primary`, `--accent`, `--ring`, `--sidebar-primary`, `--chart-*`.

### F1-02: Sidebar cambia de color con el tema — **COMPLETADA** ✅
- **Problema:** `applyCoreColors()` NO actualizaba `--sidebar-nav-bg`, `--sidebar-nav-text` ni `--sidebar-nav-active-bg`. El sidebar quedaba siempre en el color base (#0f172a) sin importar el tema.
- **Solucion:** Se agrega deteccion de luminancia (`isLightColor`) para elegir texto claro u oscuro automaticamente. Se inyectan `--sidebar-nav-bg` (= primary), `--sidebar-nav-text`, `--sidebar-nav-text-active`, `--sidebar-nav-active-bg` segun contraste.
- **Indicador:** `--sidebar-nav-indicator` ahora usa el terciario para distinguirse del fondo.

### F1-03: Tema del Admin Sistema vs tema de empresa
- El Admin del Sistema usa el tema base de la plataforma (sin sobreescritura)
- El Admin de Empresa ve los colores de su empresa
- Verificar que al cambiar de empresa (como Admin Sistema inspeccionando), el tema se actualice

---

## Fase 2 — Inventario: paginacion, filtros y buscador — **COMPLETADA**

### F2-01: Paginacion en CamerasTable y NvrsTable ✅
- Paginacion client-side con selector de items por pagina (10/25/50/100)
- Controles anterior/siguiente con indicador de pagina actual
- Default cambiado de 25 a **10 items por pagina**

### F2-02: Buscador por texto libre ✅
- Busqueda por nombre, codigo, IP y modelo en ambas tablas

### F2-03: Filtros por tipo y estado ✅
- Filtro por tipo de camara (dome, bullet, PTZ, etc.) en CamerasTable
- Filtro por estado (activo/inactivo) en ambas tablas
- Reset automatico de pagina al cambiar filtros

### F2-04: Max-height con scroll interno ✅
- Tablas con `max-h-[500px]` y `overflow-auto`
- Header sticky para mantener visibilidad de columnas al hacer scroll

---

## Fase 3 — Sidebar: ocultar paginas redundantes — **COMPLETADA**

### F3-01: Ocultar /cameras y /nvrs del menu lateral ✅
- Comentadas en `runtime-navigation.ts`
- Las rutas siguen existiendo (no eliminadas) para acceso directo si es necesario
- Todo el inventario se gestiona desde `/inventory` con tabs de Camaras y NVRs

---

## Fase 4 — Planos: fix texto "Salas" y mejora en grabado

### F4-01: Nombres incrementales para nuevas salas ✅
- Antes: toda sala nueva se llamaba "Sala" (generico)
- Ahora: "Sala 1", "Sala 2", "Sala 3"... basado en conteo de rooms existentes

### F4-02: NVRs legacy ya no se convierten a rooms ✅
- Antes: `buildEditorDocument()` convertia NVR legacy a `type: "room"`, causando textos "Sala" fantasma
- Ahora: NVR legacy se convierte a `type: "text"` con su nombre original

### F4-03: Investigar problemas de grabado — Pendiente
- El usuario reporta problemas al guardar planos
- Investigar: `handleSave()` serializa correctamente? El backend responde OK? Se pierde data?
- La funcion `handleSave` guarda tanto `editor_document` (formato completo) como `elements` (formato legacy)
- Verificar que al recargar el plano, los datos persisten correctamente

---

## Fase 5 — Dashboard Global real para Admin del Sistema

**Objetivo:** KPIs reales de plataforma en vez de datos de tenant.

- Empresas activas / total
- Servicios definidos
- Ultimas empresas creadas
- NO mostrar camaras, NVRs, tickets (eso es operacion tenant)

---

## Fase 6 — Shell Admin Sistema: separacion de contextos

**Objetivo:** Hacer inequivoco cuando el usuario esta en modo plataforma vs inspeccionando una empresa.

- Banner claro al inspeccionar una empresa
- Modo plataforma como default al iniciar sesion como Admin del Sistema

---

## Fase 7 — Portal Tenant: identidad visual

- Logo de empresa en sidebar
- Nombre de empresa como titulo del sidebar
- Iconos y colores del tema aplicados en todo el portal

---

## Fase 8 — Encapsulamiento por tenant

**Objetivo:** Cada pantalla de operacion filtra datos por empresa activa.

- /map: solo sucursales de la empresa
- /inventory: solo equipos de la empresa
- /tickets, /clients: solo datos del tenant
- Admin Sistema puede ver todo + filtrar por empresa

---

## Fase 9 — CAPEX

- Paginacion (similar a inventario)
- Estados reales (activo/inactivo con color)
- Filtros por empresa y sucursal
- Garantia: mostrar "Sin registro" en gris si no hay fecha

---

## GAPs de backend conocidos

| GAP | Impacto | Mitigacion frontend |
|-----|---------|---------------------|
| GAP-01 | CRUD de sucursales no existe | Banner "Modo preparacion" en portal tenant |
| GAP-04 | Sin refresh token | 401 redirige a login |
| GAP-08 | Upload avatar no persiste | localStorage como fallback |
| GAP-09 | /inventory/summary 500 sin tenant | EmptyState con mensaje claro |

---

## Criterio de cierre

Una fase se cierra SOLO si:
1. El cambio es visible en `http://localhost:3011`
2. Sin errores de consola relacionados
3. Build exitoso
4. Commit descriptivo realizado
# Plan de Accion — SyMTickets CCTV (Abril 2026)

> Documento vivo. Actualizar estado de cada item conforme se complete.
> Criterio de cierre: la mejora es visible en runtime real, no solo en codigo.
> Cada fase cerrada requiere: build limpio + Playwright smoke pass + commit git con mensaje descriptivo.

---

## Politica de cierre de fase (OBLIGATORIO)

Al terminar cualquier fase:
1. `npm run build` — sin errores TypeScript
2. `npm run test:e2e` — al menos 5/5 smoke tests pasan
3. Escribir o actualizar un test de Playwright que valide el comportamiento nuevo
4. Si todo pasa: `git add -A && git commit -m "fase(FX): descripcion corta del cambio"`
5. Actualizar el estado de la fase en este documento a `Completada`

---

## Resumen de fases

> **Estado revisado tras auditoria Playwright — Fase 0 (Abril 2026)**
> Ver `docs/producto-visible/09_AUDITORIA_PLAYWRIGHT_FASE0.md` para evidencia completa.

| Fase | Nombre | Prioridad | Estado | Evidencia real |
|------|--------|-----------|--------|----------------|
| F0 | Higiene global (font, encoding, notas dev) | **Critica** | **Parcial** | F0-01 pendiente, F0-02 pendiente, F0-03 **RESUELTO** (acentos corregidos en DB) |
| F1 | Shell Admin del Sistema — separacion limpia de contexto | **Critica** | **Parcial** | F1-03 completado (accesos rapidos eliminados). Resto pendiente |
| F2 | Dashboard Global real para Admin del Sistema | **Critica** | Pendiente | Dashboard muestra portal de empresa, no metricas globales |
| F3 | Inventario e Imports — manejo correcto sin tenant | **Critica** | **Parcial** | Crashes de object-as-child corregidos, lazy-mount en dialogs aplicado |
| F4 | CAPEX — paginacion, estados reales, filtros | Media | **Parcial** | max-h-125, sticky header, default 10 items, paginacion. Filtros empresa/sucursal pendiente |
| F5 | Imagen de perfil de usuario | Baja | **Parcial** | Header muestra avatar_url del usuario (AvatarImage). Upload localStorage pendiente |
| F6 | Portal Tenant — logo, nombre empresa en sidebar | Media | **Parcial** | Nombre ✅, logo solo muestra inicial (no imagen real) |
| F7 | Modulo Operaciones — Tickets, Clientes, Polizas, CAPEX | Baja | **Regresado** | Clientes duplicados (AUD-05), NVRs duplicados (AUD-10), filtros __all__ (AUD-07) |
| F8 | Mejoras enterprise generales | Baja | **Regresado** | Filtros __all__, routing /settings=/storage (AUD-07,09) |
| F9 | Encapsulamiento por tenant — cada pantalla filtra por empresa | **Critica** | **Regresado** | Mapa "Todas las empresas" (AUD-03), Planos sin filtro tenant (AUD-16) |
| F10 | Roles — filtrado por contexto (roles sistema ocultos a empresas) | Alta | **Verificado** ✅ | super_admin/tenant_admin NO visibles en cards de roles |
| F11 | Temas — aplicacion real de variables CSS por empresa | Alta | **Parcial** | Sidebar oscuro (deriveSidebarBg), tablas con colores de tema, puente shadcn oklch |
| F12 | Empresas reales en dropdowns — coherencia de datos | Alta | **Parcial** | CompanySelector usa TanStack Query (F13-01 resuelto) |
| F13 | Sucursales — CRUD desde Portal Tenant con mapa | Media | **Parcial** | Tabla muestra datos backend (Admin). Calimax vacio. Banner "Modo preparacion" OK |
| F14 | Pantallas operativas — coherencia Admin Sistema vs Empresa | Media | **Regresado** | Admin opera identico a tenant — sin diferenciacion (AUD-02,18) |

---

## Fase 0 — Higiene global

**Objetivo:** Eliminar roces de calidad que degradan la percepcion profesional de la plataforma.

### F0-01: Cambiar fuente global a algo enterprise
- **Archivo:** `cctv_web/src/app/layout.tsx`
- **Problema:** Inter actual se percibe como Times New Roman. No es enterprise.
- **Solucion:** Cambiar a `Plus Jakarta Sans` o `DM Sans` (ambas disponibles en Google Fonts via `next/font/google`). Recomendacion: `Plus Jakarta Sans` — moderna, legible, enterprise.
- **Cambio concreto:** Reemplazar la importacion de `Inter` por la fuente elegida y actualizar la variable CSS `--font-geist-sans`.
- **Impacto:** Global en toda la app.

### F0-02: Eliminar notas de desarrollo visibles en UI
- **Archivos afectados:**
  - `cctv_web/src/app/(dashboard)/imports/` — contiene texto "Fase 3: flujo utilizable y honesto..." visible al usuario
  - `cctv_web/src/app/(dashboard)/map/page.tsx` — contiene nota "Precision geografica aproximada..."
- **Solucion:** Eliminar o mover esos textos a comentarios de codigo (`//`) que no se rendericen en la UI.

### F0-03: Corregir texto con acentos rotos (T??cnico, Mar??a) — **RESUELTO** ✅
- **Causa raiz:** Los datos se corrompieron al ejecutar `seed_test_data.sql` via psql con encoding incorrecto. Los bytes UTF-8 de `é` (0xC3 0xA9) y `í` (0xC3 0xAD) se convirtieron en `??` (0x3F 0x3F) al insertarse en PostgreSQL. El archivo SQL esta correcto en UTF-8.
- **Solucion aplicada:** UPDATE directo en la DB corrigiendo:
  - `auth.users`: `last_name = 'Técnico'` para tecnico@demo.com, `first_name = 'María'` para viewer@demo.com
  - `auth.roles`: `name = 'Técnico', description = 'Técnico de campo'` para el rol id 550e8400...0003
- **Verificacion:** API `GET /api/v1/users` retorna `Carlos Técnico` y `María Visualizadora` correctamente.
- **Prevencion futura:** Al ejecutar seeds manuales con psql, asegurar `SET client_encoding TO 'UTF8';` al inicio del script o usar `psql -c "\encoding UTF8"` antes de ejecutar.

---

## Fase 1 — Shell Admin del Sistema

**Objetivo:** Cuando el Admin del Sistema inicia sesion, la interfaz debe ser inequivocamente de contexto global. No debe mostrar ninguna empresa ni operar como si perteneciera a un tenant.

### F1-01: Eliminar shortcuts redundantes del Sidebar
- **Archivo:** `cctv_web/src/components/layout/sidebar.tsx`
- **Problema:** El sidebar del Admin del Sistema muestra accesos directos a "Empresas", "Servicios y Paquetes" y "Plantilla menu" como si fueran rutas independientes. Al hacer clic llevan a una tab dentro de Configuracion. Son ruido visual redundante.
- **Solucion:** Eliminar esos tres links del sidebar cuando el contexto es Admin del Sistema. El usuario llega a esas secciones desde `Configuracion → tab correspondiente`.
- **Condicion:** Solo eliminar si `isSystemAdmin` o si no hay empresa activa.

### F1-02: Eliminar bloque "Operacion del tenant" del Dashboard
- **Archivo:** `cctv_web/src/app/(dashboard)/dashboard/page.tsx`
- **Problema (BUG-01):** Cuando el Admin del Sistema abre el dashboard, aparece el bloque "Operacion del tenant: Empresa Demo CCTV" con KPIs de esa empresa. Eso es incorrecto — el Admin del Sistema no deberia ver datos de un tenant activo por defecto.
- **Solucion:** En el dashboard, si `isSystemAdmin` o no hay tenant activo, NO renderizar el bloque de operacion del tenant. Ese bloque solo debe aparecer cuando el Admin del Sistema esta en modo inspeccion de una empresa especifica (con un banner visible de que esta inspeccionando X empresa).

### F1-03: Eliminar seccion "Accesos rapidos" del Dashboard
- **Archivo:** `cctv_web/src/app/(dashboard)/dashboard/page.tsx`
- **Problema (BUG-02):** La seccion "Accesos rapidos" (con links a Empresas, Servicios y paquetes, Plantillas de menu) no aporta valor al Admin del Sistema. Ya existe Configuracion con esas tabs.
- **Solucion:** Eliminar el componente o condicionar su render para que NO aparezca cuando el contexto es Admin del Sistema.

### F1-04: Revisar tab "Storage" en Configuracion del Admin del Sistema
- **Pantalla:** `Configuracion → Storage`
- **Problema:** El cuerpo de la tab dice "Configura un proveedor de almacenamiento para este tenant." El Admin del Sistema no es ni opera como un tenant. El texto es incoherente con su rol.
- **Solucion A (recomendada):** Si Storage es configuracion de plataforma (MinIO global), cambiar el texto a "Configura el proveedor de almacenamiento de la plataforma." y quitar la referencia a "tenant".
- **Solucion B:** Si Storage solo tiene sentido en contexto tenant, moverla fuera de la Configuracion del Admin del Sistema y mostrarla solo en el Portal Tenant.
- **Playwright:** Verificar que la tab Storage es visible y el texto no hace referencia a "tenant" cuando el usuario es Admin del Sistema.

---

## Fase 2 — Dashboard Global real para Admin del Sistema

**Objetivo:** En vez de un dashboard vacio o con datos de tenant, el Admin del Sistema debe ver metricas reales de la plataforma.

### F2-01: KPIs globales de plataforma
- **Datos disponibles en backend:** `getTenantStats()` — empresas activas, total empresas, total servicios, total plantillas de menu.
- **Lo que se debe mostrar:**
  - Empresas activas / total registradas
  - Servicios definidos en catalogo
  - Plantillas de menu definidas
  - (Dato contextual: ultimas empresas creadas)
- **Lo que NO mostrar:** Camaras activas, NVRs, almacenamiento, tickets — esos son datos de operacion tenant.

### F2-02: Lista rapida de empresas recientes
- **Origen:** `listTenants()` — lista de empresas con estado activo/suspendido.
- **UI:** Tabla compacta con nombre, estado (badge activa/suspendida), modulos habilitados, fecha de creacion.
- **Accion:** Boton "Inspeccionar" o navegar al detalle.

### F2-03: Eliminar graficos de operacion CCTV del dashboard global
- Los graficos de Salud de NVRs, Camaras por Tipo, Distribucion de Tickets, etc. son graficos de OPERACION de un tenant. No tienen sentido para el Admin del Sistema en contexto global.
- Solo deben mostrarse si esta en modo inspeccion de una empresa especifica.

---

## Fase 3 — Inventario e Imports (manejo correcto sin tenant)

**Objetivo:** Cuando el Admin del Sistema ve `/inventory` o `/imports`, no debe ver errores 500 ni UI rota.

### F3-01: Manejo de error 500 en `/inventory/summary`
- **GAP-09:** El endpoint `/inventory/summary` devuelve 500 si no hay tenant activo.
- **Solucion:** En `getInventorySummary()` y cualquier query de inventario, detectar si el usuario es Admin del Sistema sin tenant activo. En ese caso: no llamar el endpoint; mostrar un `EmptyState` con mensaje claro como "Selecciona una empresa para ver su inventario."
- **Patron:** `if (isSystemAdmin && !activeTenantId) return null` antes de ejecutar la query.
- **Estado parcial:** El crash por `camera_type` (objeto renderizado como child) fue corregido con `safeString()` en columns.tsx. El manejo de 500 sin tenant sigue pendiente.

### F3-02: Manejo de error 500 en `/imports`
- **Mismo problema que F3-01.** Las queries de imports (`listImportBatches`, `getImportStats`) fallan sin tenant activo.
- **Solucion:** Igual que F3-01 — detectar contexto y mostrar EmptyState descriptivo.
- **Estado parcial:** Los crashes por objects-as-children en columns.tsx fueron corregidos. El manejo de 500 sin tenant sigue pendiente.

### F3-03: Sidebar bloqueada en /cameras e /imports — **FIX APLICADO** 🔧
- **Problema:** Al navegar a /cameras o /imports, el sidebar dejaba de responder a clics. El usuario no podia salir de la pantalla sin logout o URL manual.
- **Patron encontrado:** Todas las paginas afectadas tienen 2 componentes `Dialog` (de @base-ui/react). Todas las paginas funcionales tienen 1. Tener 2 Dialog.Root en el DOM (aunque cerrados) interfiere con el manejo de `inert`/`aria-hidden` del FloatingFocusManager.
- **Fix aplicado:** Lazy-mount condicional — los Dialog solo se montan cuando `open=true`:
  - cameras/page.tsx: `{dialogOpen && <CameraDialog>}` y `{importOpen && <ImportDialog>}`
  - imports/page.tsx: `{createOpen && <ImportDialog>}` y `{!!detailBatch && <BatchDetailDialog>}`
- **Verificacion:** Build pasa. Verificacion manual pendiente (E2E no funciona por problema de hidratacion).

### F3-03: Redisenar `/inventory` — no debe ser solo shortcuts
- **Problema (punto 3 del usuario):** La pagina actual de Inventario es principalmente 4 tarjetas de navegacion que apuntan a `/cameras`, `/nvrs`, `/floor-plans`, `/imports`. Se siente como un menú de accesos directos, no como una pantalla de utilidad.
- **Solucion propuesta:** Mantener las nav-cards pero agregar valor real arriba: stats de inventario cuando hay tenant activo, EmptyState cuando no hay tenant.

---

## Fase 4 — CAPEX / Garantias

**Objetivo:** La pantalla de CAPEX debe ser funcional, paginada y con estados informativos reales.

### F4-01: Agregar paginacion
- **Archivo:** `cctv_web/src/app/(dashboard)/capex/page.tsx`
- **Problema (BUG-06):** La tabla no tiene paginacion. Puede haber cientos de registros.
- **Solucion:** Implementar paginacion con shadcn/ui. Mostrar X registros por pagina con controles de pagina siguiente/anterior y selector de items por pagina.

### F4-02: Corregir columna "Estado Garantia" que muestra "Sin info"
- **Problema:** La funcion `classifyWarranty()` retorna `sin_info` cuando `dateStr` es null o undefined. Si la mayoria de los equipos no tienen fecha de garantia en el backend, todos muestran "Sin info".
- **Investigar:** Si los NVRs/camaras tienen campo `warranty_date` o similar expuesto en el API. Si no existe, es un GAP de backend.
- **Solucion UI mientras tanto:** Mostrar "Sin info" de forma menos prominente (texto gris, sin badge llamativo) para que no se vea como un error. Agregar tooltip explicando que el equipo no tiene fecha de garantia registrada.

### F4-03: Mejorar columna "Estado" (punto gris)
- **Problema:** La columna Estado solo muestra un punto gris para todos.
- **Solucion:** Revisar el campo `status` que llega de la API (`extractStatus()`). Si el valor es "active", mostrar punto verde + texto "Activo". Si es "inactive", punto rojo + "Inactivo". Si es desconocido, punto gris + el texto tal como llega.

### F4-04: Agregar filtros por empresa y sucursal
- **Solucion:** Agregar dos selectores en la barra de filtros:
  - "Empresa" — lista de tenants (solo visible si es Admin del Sistema)
  - "Sucursal" — lista `listSites()` filtrada por empresa seleccionada
- **Condicion:** El filtro por empresa solo aparece si `isSystemAdmin`.

---

## Fase 5 — Imagen de perfil de usuario

**Objetivo:** Permitir agregar foto al crear o editar usuario, aun sin persistencia en backend real.

### F5-01: Campo de avatar en CreateUserDialog
- **Archivo:** `cctv_web/src/app/(dashboard)/users/user-dialogs.tsx`
- **GAP-08:** El backend no tiene endpoint para upload de avatar.
- **Solucion pragmatica:** Guardar la imagen en base64 o URL en localStorage (clave `user_avatar_{userId}`) similar a como se guarda el tema visual del usuario.
- **UI:** Avatar circular clickeable arriba del formulario. Al hacer clic abre file picker (solo imagenes). Preview inmediato.
- **Columna en tabla:** Mostrar avatar circular en la primera columna de la tabla de usuarios.

---

## Fase 6 — Portal Tenant — logo y nombre en sidebar

**Objetivo:** Cuando un Admin de Empresa inicia sesion, el sidebar debe mostrar el nombre y logo de SU empresa, no "SyMTickets".

### F6-01: Mostrar nombre de empresa en sidebar
- **Archivo:** `cctv_web/src/components/layout/sidebar.tsx`
- **Problema (BUG-09):** El sidebar muestra "SyMTickets" + "Plataforma" incluso cuando el contexto es un tenant.
- **Solucion:** En modo `tenant_portal`: mostrar nombre del tenant activo en lugar de "SyMTickets". El rol del usuario debajo.

### F6-02: Mostrar logo de empresa en sidebar
- **Problema:** El logo asignado a la empresa no se renderiza aunque exista en la DB.
- **Investigar:** Si `tenant.logo_url` llega en la respuesta del API de tenants y si se esta leyendo desde `useTenantStore()`.
- **Solucion:** Si `tenant.logo_url` existe, renderizarlo con `<Image>` de Next.js. Si no, mostrar las iniciales de la empresa con fondo del color primario del tema.

---

## Fase 7 — Modulo Operaciones

**Objetivo:** Revisar que Tickets, Clientes, Polizas SLA, Niveles SLA sean coherentes y funcionales.

### F7-01: Auditoria de cada pantalla de Operaciones
- Revisar cada pantalla bajo `/tickets`, `/clients`, `/policies`, `/sla`, `/capex` siendo Admin del Sistema y como Admin de Empresa.
- Documentar que funciona con backend real vs que es UI sin respaldo.

### F7-02: Errores 500 en pantallas de operacion cuando no hay tenant
- Aplicar el mismo patron de F3-01: si no hay tenant activo y la pantalla requiere datos de tenant, mostrar EmptyState en vez de error crudo.

---

## Fase 8 — Mejoras enterprise generales

**Objetivo:** Pulir la percepcion visual y de usabilidad de la plataforma.

### F8-01: Mejora visual de tablas y cards
- Revisar que todas las tablas usen el componente `DataTable` con sorting, pagination y busqueda.
- Cards con sombra sutil, border-radius uniforme, espaciado coherente.

### F8-02: Estados vacios consistentes
- Todo modulo debe tener un `EmptyState` descriptivo cuando no hay datos, en vez de tabla vacia o error sin mensaje.
- Usar el componente `EmptyState` existente en `src/components/ui/empty-state`.

### F8-03: Loading states consistentes
- Usar skeleton loaders en vez de spinners sueltos donde sea posible.

### F8-04: Feedback de acciones (toasts)
- Verificar que todas las mutaciones (crear, editar, eliminar, activar, suspender) tengan toast de exito y de error.

---

## Notas sobre GAPs de backend

Los siguientes problemas NO tienen solucion sin modificar el backend (que es inmutable). Se documentan para transparencia:

| GAP | Impacto visible |
|-----|----------------|
| GAP-08 | Foto de perfil solo persiste en localStorage, no en DB |
| GAP-09 | Inventario/imports dan 500 sin tenant — se mitiga con EmptyState en frontend |
| GAP-04 | Sin refresh token: sesion expira sin aviso y mueve a login |
| GAP-01 | CRUD de sucursales (POST/PUT/DELETE /sites) no existe — empresas no pueden crear sucursales reales aun |
| GAP-10 | Empresas reales creadas desde UI no aparecen en todos los dropdowns — posible inconsistencia entre datos seeded y datos reales de la DB |

---

## Criterio de cierre por fase

Una fase se considera cerrada SOLO si:
1. El cambio es visible al navegar en `http://localhost:3011` (o el puerto activo)
2. No hay errores de consola relacionados con el cambio
3. El build `npm run build` es exitoso sin errores TypeScript
4. Las pruebas smoke `npm run test:e2e` siguen pasando (5/5 minimo)
5. Existe al menos un test de Playwright nuevo o actualizado que valide el comportamiento de la fase
6. Se realiza un commit: `git add -A && git commit -m "fase(FX): descripcion"`

---

## Fase 9 — Encapsulamiento por tenant

**Objetivo:** Cada pantalla de operacion (camaras, NVRs, mapa, inventario, tickets, etc.) debe mostrar SOLO los datos de la empresa con la que se inicio sesion. El Admin del Sistema puede ver todos los datos o filtrar por empresa.

### F9-01: /map — mostrar solo sucursales de la empresa activa
- **Archivo:** `cctv_web/src/app/(dashboard)/map/page.tsx`
- **Problema:** El mapa muestra todas las sucursales de todas las empresas cuando el usuario es de una empresa (tenant). Deberia mostrar SOLO las sucursales de su empresa.
- **Solucion:**
  - Si `isSystemAdmin`: mostrar todas las sucursales (comportamiento actual correcto para el admin).
  - Si es usuario de empresa: filtrar `listSites()` por `tenant_id` del usuario activo. El backend ya debe retornar solo los sites del tenant si se pasa el header de autenticacion correcto — verificar si es necesario un filtro adicional en frontend.
- **Playwright:** Test que valida que al hacer login como empresa, el mapa solo muestra sus sucursales.

### F9-02: /cameras — listar solo camaras de la empresa activa
- **Mismo patron que F9-01.** Las camaras listadas deben pertenecer al tenant activo.
- **Verificar:** Si el API de cameras ya filtra por tenant del token JWT o si se necesita filtro manual.

### F9-03: /nvrs — listar solo NVRs de la empresa activa
- **Mismo patron que F9-01.**

### F9-04: /floor-plans — listar solo planos de la empresa activa
- **Mismo patron que F9-01.**

### F9-05: /inventory — datos de la empresa activa
- Aplicar patron de filtrado consistente en stats y listados de inventario.

### F9-06: /tickets, /clients, /policies, /sla — datos de la empresa activa
- Todas las pantallas de operacion deben estar encapsuladas al tenant activo.
- El Admin del Sistema puede ver todos + filtrar por empresa desde un selector global.

---

## Fase 10 — Roles: filtrado por contexto

**Objetivo:** Los roles de sistema (super_admin, tenant_admin y cualquier rol marcado como "sistema") NO deben ser visibles ni seleccionables desde el portal de una empresa.

### F10-01: Ocultar roles de sistema en el listado del Portal Tenant
- **Pantalla:** `Configuracion → Roles y Permisos` cuando el usuario es de una empresa
- **Problema:** Al iniciar sesion como empresa (ej: Calimax), se ven los roles `super_admin` y `tenant_admin` que son roles del sistema. Una empresa no debe ver ni editar esos roles.
- **Solucion:** Al listar roles, si el usuario es de una empresa (`!isSystemAdmin`), filtrar o no mostrar los roles que tengan `scope: "system"` o `is_system: true` o el campo equivalente que los marque como roles de plataforma.
- **Investigar:** El campo exacto en el objeto rol que diferencia roles de sistema de roles de empresa.
- **Playwright:** Test que verifica que al iniciar sesion como empresa, no se ven roles con nombre `super_admin` o `tenant_admin` en la lista.

### F10-02: Ocultar roles de sistema en selectores de asignacion
- **Aplica a:** Dialogo de creacion/edicion de usuario — selector de "Rol inicial"
- **Problema:** Al crear un usuario como empresa, el selector de rol puede incluir `super_admin` y `tenant_admin`.
- **Solucion:** Mismo filtro que F10-01: excluir roles de sistema del dropdown si el usuario es de una empresa.

### F10-03: Distinguir visualmente roles de sistema vs roles de empresa
- **Solo para el Admin del Sistema:** En la lista de roles, agregar un badge o color distinto para los roles de sistema vs los roles creados por empresas.
- **Badge propuesto:** `Sistema` (ya existe en la UI actual) — verificar que se aplica correctamente.

---

## Fase 11 — Temas: aplicacion real de variables CSS

**Objetivo:** Los temas asignados a empresas o usuarios deben aplicarse realmente en la UI, no solo guardarse en localStorage.

### F11-01: Diagnosticar por que los temas no se aplican — **RESUELTO** ✅
- **Problema original:** Los temas se podian seleccionar pero la UI no cambiaba visualmente.
- **Causa raiz:** `applyCoreColors()` en `theme-provider.tsx` inyectaba el color primario directamente como fondo de sidebar (muy brillante). Las tablas usaban clases Tailwind hardcoded (`bg-muted/50`) en vez de las CSS variables del tema.
- **Solucion aplicada:**
  - Sidebar: Se agrego `deriveSidebarBg()` (misma logica que la vista previa) — fuerza HSL lightness a 0.12, cap de saturacion a 0.7. El sidebar ahora es oscuro independientemente del color primario elegido.
  - Tablas: `table.tsx` ahora usa `--table-header-bg` (inline style en TableHeader), `--table-stripe-bg` y `--table-hover-bg` (Tailwind arbitrary values en TableRow). Estos se inyectan desde `THEME_VAR_MAP` en `applyCoreColors()`.
  - `usePermissions()` ahora exporta `isSystemAdmin` (bool) para uso en componentes.

### F11-02: Implementar aplicacion real de variables CSS del tema
- **Patron esperado:** Al iniciar sesion, leer el tema del tenant/usuario activo y set variables CSS:
  ```js
  document.documentElement.style.setProperty('--color-primary', theme.primaryColor);
  document.documentElement.style.setProperty('--color-secondary', theme.secondaryColor);
  // etc.
  ```
- **Donde implementar:** En el layout de dashboard (`src/app/(dashboard)/layout.tsx`) justo despues de hidratar el tenant store.
- **Asegurar:** Que los componentes de shadcn/ui usen `var(--color-primary)` consistentemente (Tailwind 4 con CSS variables).
- **Playwright:** Test que valida que al cambiar de empresa con un tema distinto, el color primario del sidebar cambia.

### F11-03: Tema del sistema para el Admin del Sistema
- El Admin del Sistema no pertenece a una empresa, por lo que usa el tema base de la plataforma (no un tema de empresa).
- Asegurarse de que al iniciar sesion como Admin del Sistema se cargue el tema global y no el de ningun tenant.

---

## Fase 12 — Mejoras enterprise generales (tablas, scroll, paginacion) — **PARCIAL**

### F12-01: Paginacion en Sucursales (sites) ✅
- Buscador por nombre, cliente, direccion, ciudad
- Paginacion client-side (default 10 items) con selector 10/25/50/100
- Max-height 500px con scroll interno y header sticky

### F12-02: Paginacion en Planos interactivos (floor-plans) ✅
- Paginacion client-side (default 10 items) con selector 10/25/50/100
- Max-height 500px con scroll interno y header sticky
- Reset de pagina al cambiar filtros de busqueda o empresa

### F12-03: Max-height + scroll interno en DataTable compartido ✅
- Componente `data-table.tsx` ahora tiene `max-h-[500px]` con `overflow-auto`
- Header sticky con `backdrop-blur-sm` para visibilidad al hacer scroll

### F12-04: Estilo visual "Proveedores" para tablas — Completado
- Iconos circulares con color por tipo (Camera azul, Server violeta, Building2 esmeralda, Map ambar)
- Badges de tipo de camara con colores por categoria (dome=azul, bullet=verde, PTZ=morado, turret=naranja, fisheye=teal, box=rosa)
- Status con indicador de punto (verde activo, gris inactivo) en vez de Badge plano
- Boton "Exportar" CSV con BOM UTF-8 en CamerasTable y NvrsTable
- IP con fondo `bg-muted` para destacar
- Floor-plans: indicador de punto en columna "Plano" en vez de Badge
- Soporte dark mode en todos los colores

---

## Fase 13 — Empresas reales en dropdowns y listados

**Objetivo:** Las empresas creadas desde la UI real (no hardcodeadas ni seeds) deben aparecer en todos los dropdowns, filtros y listados de la aplicacion.

### F13-01: Diagnosticar origen de datos en dropdowns de empresa — **RESUELTO** ✅
- **Problema:** Empresas creadas desde `Configuracion → Empresas` no aparecian en el `CompanySelector` del header.
- **Causa raiz:** `CompanySelector` leia de `useAuthStore((s) => s.companies)` (Zustand), que solo se llena al hacer login via `getMe()`. Crear una empresa invalidaba `["tenants"]` en TanStack Query pero NUNCA actualizaba el Zustand store.
- **Solucion aplicada:** Se reescribio `CompanySelector` para que:
  - Admin del Sistema: usa `useQuery` con `queryKey: ["tenants"]` y `listTenants(200)`. Al crear empresas, se invalida esta query y el dropdown se actualiza automaticamente.
  - Admin de Empresa: sigue usando `authStore.companies` (contexto fijo).
  - Mapeo `Tenant[] → Company[]` con campos `id, name, slug, primary_color, secondary_color, tertiary_color, logo_url, is_active`.
- **Archivos:** `company-selector.tsx`, `use-permissions.ts` (agrego `isSystemAdmin`)

### F13-02: Unificar fuente de datos de empresas
- Todos los dropdowns y listados que muestran empresas deben usar el mismo `listTenants()` de `src/lib/api/tenants.ts` con TanStack Query.
- Al crear o editar una empresa, invalidar la query `["tenants"]` para que todos los componentes se actualicen.

### F13-03: Verificar que el selector global de empresa en el header usa datos reales
- **Componente:** El selector "Todas las sucursales" / "Todas las empresas" visible en el header.
- **Verificar:** Que la lista venga de `listTenants()` y no de datos estaticos.

---

## Fase 14 — Sucursales: CRUD desde Portal Tenant

**Objetivo:** Una empresa que inicia sesion debe poder ver, crear y gestionar sus propias sucursales, incluyendo posicionarlas en un mapa.

### F14-01: Pantalla "Mis Sucursales" en el Portal Tenant
- **Ruta propuesta:** `/sites` o como tab dentro de la configuracion del tenant
- **Problema actual:** No existe una pantalla donde una empresa pueda crear sus propias sucursales. GAP-01 indica que `POST/PUT/DELETE /sites` no existe en el backend.
- **Solucion parcial (sin backend completo):** Crear la pantalla con:
  - Listado de sucursales existentes (lee del endpoint GET /sites que si existe)
  - Formulario de alta de sucursal (nombre, direccion, ciudad) — mostrar con disclaimer "Funcionalidad en proceso de activacion"
  - Mapa Leaflet con marcador arrastrable para posicionar la sucursal

### F14-02: Bloquear alta de sucursal si GAP-01 no esta resuelto
- Si el backend no acepta POST /sites, mostrar el formulario en modo "preparacion" con un mensaje claro para el usuario: "La creacion de sucursales estara disponible proximalente."
- No simular exito si el endpoint falla.

### F14-03: Admin del Sistema puede ver las sucursales de cualquier empresa
- Cuando el Admin del Sistema inspecciona una empresa, debe poder ver sus sucursales.

---

## Fase 14 — Coherencia pantallas operativas: Admin Sistema vs Empresa

**Objetivo:** Cada pantalla de operacion (camaras, NVRs, tickets, etc.) debe comportarse diferente dependiendo de si quien la ve es el Admin del Sistema o un usuario de empresa.

### F14-01: /cameras — alta de camara con contexto de empresa y sucursal
- **Problema:** El Admin del Sistema puede hacer clic en "Agregar camara" en `/cameras` sin contexto de empresa ni sucursal. Eso es incorrecto.
- **Regla:**
  - Si es `isSystemAdmin`: antes de permitir agregar, mostrar selector de empresa + sucursal. Sin seleccion, el boton de agregar debe estar deshabilitado o no mostrar formulario.
  - Si es usuario de empresa: el formulario ya sabe a que empresa pertenece (tenant activo). Solo necesita seleccionar la sucursal de su empresa.

### F14-02: /nvrs — misma logica que F14-01
- Alta de NVR requiere contexto de empresa + sucursal.

### F14-03: Selector global de contexto para Admin del Sistema
- Cuando el Admin del Sistema navega por pantallas de operacion (camaras, NVRs, mapa, inventario), debe existir un selector visible de "Empresa activa" que le permita ver los datos de una empresa especifica.
- Sin empresa seleccionada: mostrar EmptyState con instruccion de seleccionar una empresa.
- Con empresa seleccionada: mostrar los datos de esa empresa tal como los veria su admin.

### F14-04: Badge de contexto visible en el header
- Cuando el Admin del Sistema esta operando en el contexto de una empresa (inspeccion), mostrar claramente en el header: "Inspeccionando: [Nombre Empresa]" con boton de salir del contexto.
- Impide confusion entre "estoy en modo plataforma" vs "estoy viendo datos de una empresa".

---

## Registro de cambios implementados (Abril 2026)

### Sesion 1 — Hardening de crash y estabilidad

**Archivos creados:**
- `src/lib/utils/safe-field.ts` — utilidad `safeString()` y `safeStatus()` para evitar objetos renderizados como children de React
- `src/app/(dashboard)/error.tsx` — error boundary para paginas de dashboard
- `src/components/layout/company-selector.tsx` — selector global de empresa para admin

**Archivos modificados (hardening object-as-child):**
- `src/app/(dashboard)/cameras/columns.tsx` — `safeString()` en columnas name, ip_address, model, type, site_name
- `src/app/(dashboard)/nvrs/columns.tsx` — `safeString()` en columnas name, ip_address, model, site_name
- `src/app/(dashboard)/imports/columns.tsx` — `safeString()` en columnas filename, status, created_by_name
- `src/app/(dashboard)/tickets/columns.tsx` — `safeString()` en todas las columnas de texto
- `src/app/(dashboard)/clients/columns.tsx` — `safeString()` en columnas de texto
- `src/app/(dashboard)/inventory/page.tsx` — hardening de stats fallback
- `src/components/layout/sidebar.tsx` — `safeString(tenant?.logo_url)` para evitar crash por logo_url null/object

**Archivos modificados (sidebar navigation fix — lazy-mount):**
- `src/app/(dashboard)/cameras/page.tsx` — condicional `{dialogOpen && <CameraDialog>}` y `{importOpen && <ImportDialog>}` para montar dialogos solo al abrir
- `src/app/(dashboard)/imports/page.tsx` — condicional `{createOpen && <ImportDialog>}` y `{!!detailBatch && <BatchDetailDialog>}` para montar dialogos solo al abrir
- **Contexto:** Las paginas con 2 componentes Dialog abiertos simultaneamente en el DOM (aunque cerrados) causaban que la navegacion del sidebar quedara bloqueada. El patron correlacionado: /cameras y /imports (con 2 Dialogs) bloqueaban; /nvrs, /tickets, /clients (con 1 Dialog) funcionaban.

**Otros cambios:**
- `src/components/layout/header.tsx` — integrado CompanySelector
- `src/app/(dashboard)/layout.tsx` — logica de seleccion de empresa corregida para respetar cambios manuales del usuario
- `src/app/(dashboard)/dashboard/page.tsx` — eliminada seccion "Accesos rapidos" (F1-03)

### Sesion 2 — F0-03 Encoding fix

**Cambios en base de datos (no en codigo):**
- `auth.users`: Corregido `T??cnico` → `Técnico` (last_name para tecnico@demo.com)
- `auth.users`: Corregido `Mar??a` → `María` (first_name para viewer@demo.com)
- `auth.roles`: Corregido `T??cnico` / `T??cnico de campo` → `Técnico` / `Técnico de campo`
- **Causa raiz:** El seed SQL (`cctv_server/scripts/seed_test_data.sql`) tiene UTF-8 correcto, pero al ejecutarse via psql sin encoding explicito, los bytes multibyte se convirtieron en `?` (U+003F).

### Problemas conocidos pendientes

| Problema | Estado | Notas |
|----------|--------|-------|
| Sidebar bloqueada en /cameras e /imports | Fix aplicado, pendiente verificacion manual | Lazy-mount de dialogs aplicado. E2E no puede verificar (ver abajo) |
| E2E Playwright no funciona | Bloqueado | React/Next.js 16 con Turbopack no hidrata correctamente en Playwright. Todos los tests de login fallan (form hace GET nativo en vez de React handleSubmit). Middleware usa cookies, no localStorage |
| F0-01 Font enterprise | Pendiente | Cambiar Inter por Plus Jakarta Sans o DM Sans |
| F0-02 Notas dev visibles | Pendiente | Eliminar textos de desarrollo de la UI |

---
