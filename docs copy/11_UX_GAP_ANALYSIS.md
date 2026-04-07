# 11 — UX Gap Analysis: SyMTickets CCTV vs Brief Visual Esperado

> Fecha: 2026-04-05
> Referencia comparativa: Core Associates Web (`core-associates-web`)
> Producto evaluado: SyMTickets CCTV Next.js (`symticketscctv-next`)
>
> ✅ **RESUELTO (CP-06 cleanup):** Todos los gaps identificados en este documento fueron corregidos:
> - **Login**: Rediseñado con estilo enterprise dark, branding CCTV, fondo con gradiente
> - **Dashboard**: Reescrito con gráficos CCTV (NVR Health donut, Camera Types bar, SLA, Trend)
> - **Sidebar**: Rediseñado enterprise dark con secciones, iconos, collapsible Admin
> - **Header**: Mejorado con breadcrumb implícito, badge de empresa
> - **Settings**: Consolidados en 6 tabs (Usuarios, Empresas, Roles, Tema, IA, Storage)
> - **Empty states**: Implementados en las 12 páginas con DataTable
> - **StatsCard**: Componente enterprise con gradiente, icono watermark, hover lift
> - **Font**: Inter con latin-ext para soporte de acentos español

---

## 1. Resumen Ejecutivo

### Diagnóstico general

El producto actual funciona técnicamente pero **no transmite calidad enterprise**. La brecha no es funcional — es visual y de percepción. Cada pantalla cumple su rol de datos, pero ninguna genera la impresión de "plataforma seria de infraestructura CCTV".

### Qué está bien
- Arquitectura técnica sólida (React 19, Next.js 16, Zustand, TanStack Query)
- Flujos CRUD completos y funcionales
- Multi-tenancy, RBAC, sidebar dinámico, dark mode
- Floor plans con Konva + topología React Flow
- Base de componentes shadcn v4 correcta

### Qué está mal
- **Login**: Tarjeta centrada minimalista, sin identidad de producto, sin branding, sin peso visual
- **Dashboard**: Cards genéricas shadcn sin diferenciación, sin gradientes, sin watermarks, sin narrativa
- **Sidebar**: Funcional pero plano — sin branding area, sin color de identidad, sin indicador de active state fuerte
- **Header**: Demasiado comprimido, sin breadcrumb, sin search global, badge de empresa escondido
- **Settings/Admin**: Una sola página plana con 2 cards — versus el patrón esperado de tabs por dominio
- **Tablas**: Funcionales pero sin presencia visual — sin stats cards con gradiente, sin toolbar rica
- **Empty states**: Inexistentes o mínimos — el sistema vacío se ve roto, no "listo para usar"

### Qué funciona técnicamente pero falla visualmente
- Cards KPI: muestran datos correctos pero son rectángulos planos sin color, sin icono watermark, sin hover lift
- Sidebar: carga menú dinámico correctamente pero se ve como un listado de links sin contexto
- DataTable genérico: paginación y sort funcionan pero visualmente es tabla HTML básica con borde

### Veredicto rápido
**El producto NO está listo para demo.** La primera impresión es de scaffold/prototipo, no de plataforma enterprise. Se necesita una iteración visual completa antes de mostrar a stakeholders.

---

## 2. Criterios de Evaluación

Cada pantalla se evalúa contra:

| Criterio | Descripción |
|---|---|
| Jerarquía visual | ¿Hay un orden claro de importancia? ¿El ojo sabe dónde ir? |
| First impression | ¿Los primeros 3 segundos transmiten calidad? |
| Identidad del producto | ¿Se siente como una plataforma CCTV/infraestructura? |
| Calidad enterprise | ¿Se podría mostrar a un director de operaciones? |
| Consistencia con dominio CCTV | ¿Usa vocabulario visual, iconografía y colores del dominio? |
| Referencia Core Associates | ¿Alcanza el nivel de polish de la referencia? |
| Empty states | ¿Qué se ve cuando no hay datos? |
| Densidad visual | ¿El espacio se usa bien o se siente vacío? |
| Claridad de navegación | ¿Es obvio dónde estoy y a dónde puedo ir? |
| Sensación de producto terminado | ¿Se siente terminado o scaffolded? |

---

## 3. Análisis por Pantalla

---

### LOGIN

**Objetivo esperado**
- Pantalla de acceso enterprise con identidad de producto fuerte
- Primera impresión de plataforma seria de gestión CCTV
- Referencia: Core Associates usa split-panel (60% brand visual + 40% formulario), gradientes profundos, grid pattern overlay, sección de features, ilustración central, user presets para demo

**Estado actual**
- Card shadcn centrado en fondo `bg-muted/50` gris claro
- Título "SyMTickets CCTV" en texto plano 2xl
- Descripción genérica "Ingresa tus credenciales para acceder"
- 2 inputs + 1 botón + error text
- Sin logo, sin ilustración, sin gradiente, sin split-panel, sin features showcase, sin credenciales demo visibles, sin branding
- Total: ~200px de contenido centrado en pantalla completa

**Gap UX/UI**
1. **Sin identidad de producto** — podría ser el login de cualquier SaaS genérico
2. **Sin split-panel** — todo el espacio lateral está desperdiciado
3. **Sin branding area** — no hay logo, no hay colores de marca, no hay ilustración
4. **Sin features showcase** — el usuario no sabe qué va a encontrar tras el login
5. **Sin user presets** — para demo no hay botones rápidos de selección de usuario
6. **Sin password toggle** — falta el eye/eye-off en el input de contraseña
7. **Sin grid pattern** ni textura sutil de fondo
8. **Card demasiado simple** — `max-w-md` de shadcn default sin sombra notable ni ring

**Severidad:** 🔴 CRÍTICA

**Impacto:** Primera pantalla del producto. Define la percepción completa. Un login pobre = producto pobre en la mente del stakeholder.

**Referencia deseada:** Split-panel como Core Associates — panel izquierdo con gradiente profundo (azul/navy + grid pattern + logo + features CCTV), panel derecho con formulario robusto con shadow-xl, ring-1, user presets, password toggle.

**Acción correctiva:**
- Implementar layout split-panel (lg:grid-cols-5, 3+2 o 60/40)
- Panel izquierdo: gradiente navy-to-dark, logo SyMTickets, ilustración CCTV (cámara/shield/monitor), 3 features del dominio (Monitoreo 24/7, Multi-sucursal, Gestión inteligente)
- Panel derecho: form en card bg-white rounded-2xl shadow-xl ring-1, password toggle, error state mejorado
- User presets para demo: cards clickables con avatar + nombre + rol
- Mobile: stacked con header gradient + form below

---

### SELECT COMPANY

**Objetivo esperado**
- Selector visual de empresas con cards que muestren logo, nombre, plan, cantidad de sucursales
- Flujo claro: "selecciona tu empresa para continuar"

**Estado actual**
- Card grid de empresas clickeables
- Cards simples con nombre y datos básicos
- Funcional pero visualmente plano

**Gap UX/UI**
1. Cards sin logo/imagen de empresa
2. Sin indicador de plan/tier
3. Sin contadores de sucursales/cámaras por empresa
4. Sin estado hover con elevación
5. Fondo plano

**Severidad:** 🟡 ALTA

**Impacto:** Segunda pantalla. Si el login mejora pero esto no, se pierde coherencia.

**Acción correctiva:**
- Cards más grandes con gradiente sutil, logo placeholder, nombre bold, badge de plan, contadores de equipos
- Hover: shadow-lg + translate-y lift
- Fondo: bg-gray-50 con patrón sutil

---

### DASHBOARD

**Objetivo esperado**
- Central de comando CCTV — visión ejecutiva de toda la operación
- KPIs con presencia visual fuerte, colores del dominio, iconos watermark
- Gráficos interactivos con tooltips
- Referencia: Core Associates usa cards con gradiente `bg-gradient-to-br from-[color]-50 to-white`, iconos watermark rotados a 12° con opacity 0.4, valores en `text-3xl font-bold`, hover con translate-y + shadow

**Estado actual**
- 4 cards shadcn/ui estándar `<Card><CardHeader><CardContent>`
- Icon tamaño normal a la derecha del header
- Número grande pero sin gradiente, sin watermark, sin hover lift
- Grid 2-col con "Desglose de Tickets" y "Pólizas" como cards con líneas de texto
- Gráfico de tendencia manual con divs de barra (no Recharts)
- Sin Recharts — gráfico custom con divs y alturas porcentuales

**Gap UX/UI**
1. **Cards KPI sin gradiente** — son rectángulos blancos planos
2. **Sin icono watermark** — los iconos son pequeños en la esquina, no hay presencia visual
3. **Sin hover lift** — no hay `hover:-translate-y-0.5 hover:shadow-md`
4. **Sin colores por tipo** — todas las cards se ven iguales
5. **Gráfico de barras artesanal** — divs animados vs Recharts con tooltips y gradients
6. **Bloques de texto plano** — "Desglose de Tickets" es una lista de StatRow sin estructura visual
7. **Sin narrativa** — no hay "Tu operación hoy: X alarmas, Y% SLA, Z cámaras offline"
8. **Bienvenida genérica** — "Bienvenido, {name}" sin contexto operativo

**Severidad:** 🔴 CRÍTICA

**Impacto:** Pantalla principal post-login. Un dashboard vacío o plano destruye la percepción del producto.

**Referencia deseada:** Grid de StatsCards con gradientes de color (`from-blue-50`, `from-green-50`, `from-amber-50`, `from-red-50`), iconos watermark h-20 w-20 rotados opacity-40, valores 3xl bold, hover lift. Gráficos con Recharts (bar + donut). Bloques de resumen con estructura visual clara.

**Acción correctiva:**
- Crear componente `StatsCard` enterprise con gradiente + watermark icon + hover lift
- Instalar Recharts para gráfico de tendencia y donut de distribución
- Agregar sección "Estado operativo" con indicadores tipo semáforo
- Mejorar bienvenida: "Operación CCTV — {empresa} — {sucursal}" con fecha y turno

---

### SIDEBAR

**Objetivo esperado**
- Navegación enterprise con identidad visual
- Referencia: Core Associates usa fondo navy oscuro (#0f1729), text white/gray, indicator bar en active (h-6 w-[3px] bg-primary-400 left-0), logo+branding en top (h-16), separadores, sections con labels uppercase, skeleton loading, versión en footer

**Estado actual**
- Fondo neutro (bg-background — blanco en light, oscuro en dark)
- Items: `bg-primary/10 text-primary` para active, `hover:bg-accent` para hover
- Sin area de branding/logo en la parte superior
- Sin indicator bar lateral
- Sin secciones con labels uppercase
- Sin separadores visuales
- Sin footer con versión
- Sin skeleton loading
- Grupos con ChevronDown funcionales pero sin estilo diferenciado

**Gap UX/UI**
1. **Sin fondo de identidad** — sidebar se funde con el contenido, no tiene peso visual propio
2. **Sin branding area** — no hay logo ni nombre del producto en la parte superior
3. **Sin indicator bar** — el active state es solo un cambio de background sutil
4. **Sin secciones** — los items del menú son una lista plana
5. **Sin separadores** — no hay líneas divisorias entre grupos funcionales
6. **Sin footer** — no hay versión, ayuda ni link inferior
7. **Collapsed mode genérico** — tooltips funcionan pero no hay transición suave ni icono refinado

**Severidad:** 🔴 CRÍTICA

**Impacto:** El sidebar es visible en TODAS las pantallas. Un sidebar genérico degrada la percepción global del sistema completo.

**Referencia deseada:** Fondo oscuro sólido (navy/slate-900), area de branding top (logo + "SyMTickets CCTV" + "Gestión CCTV"), items con indicator bar izquierdo, secciones con labels uppercase, separadores `border-white/10`, hover con `bg-white/10`, footer con versión.

**Acción correctiva:**
- Fondo: slate-900 / navy dark (variable CSS configurable)
- Top: Logo/icono + nombre producto + subtítulo
- Items: indicator bar left 3px + bg-white/15 active + text white/gray
- Secciones: labels uppercase xs tracking-wide
- Separadores: hr con opacity
- Footer: versión + soporte
- Collapsed: transición suave, tooltips mejorados

---

### HEADER

**Objetivo esperado**
- Barra superior informativa con contexto de navegación
- Referencia: Core Associates usa h-16, breadcrumb con chevron separator, search bar con ⌘K shortcut, notification bell con badge count, dark mode toggle, user dropdown con avatar gradient + name + role
- Backdrop blur: `bg-white/80 backdrop-blur-sm`

**Estado actual**
- h-14 con border-b
- Left: hamburger mobile + sidebar toggle + "SyMTickets CCTV" text + badge empresa
- Right: site selector + theme toggle + company dropdown + user menu con avatar iniciales
- Sin breadcrumb
- Sin search global
- Sin notifications
- Sin backdrop blur
- Badge de empresa a veces hidden

**Gap UX/UI**
1. **Sin breadcrumb** — el usuario no sabe dónde está en la jerarquía
2. **Sin search global** — no hay Command Palette / búsqueda rápida
3. **Sin notifications** — no hay bell icon ni badge de conteo
4. **Sin backdrop blur** — header es opaco, no tiene profundidad visual
5. **Avatar sin gradiente** — fallback de iniciales es un div plano sin gradiente
6. **Contexto de empresa débil** — badge hidden en ciertas resoluciones

**Severidad:** 🟡 ALTA

**Impacto:** Header visible en todas las pantallas. Sin breadcrumb el usuario pierde contexto. Sin search el poder de la plataforma queda oculto.

**Referencia deseada:** h-16, bg-white/80 backdrop-blur-sm, breadcrumb "Panel > Dashboard", search con ⌘K, notification bell, avatar con gradiente, nombre visible.

**Acción correctiva:**
- Breadcrumb dinámico basado en pathname
- Search trigger (visual — funcionalidad en V2)
- Avatar con gradiente de fallback
- Backdrop blur en el header
- Notification bell placeholder (sin endpoint backend — solo UI)
- h-16 con mejor spacing

---

### CONFIGURACIÓN (Settings)

**Objetivo esperado**
- Panel de administración enterprise con tabs por dominio
- Referencia: Core Associates tiene 6 tabs (Usuarios, Roles, Temas, Sistema, Auditoría, IA), cada tab con icon color-coded, container rounded-xl con shadow, mobile dropdown select
- Sensación de centro de control administrativo

**Estado actual**
- **Una sola página plana** con título "Configuración"
- 2 cards: "Información General" (grid 2-col con datos del tenant) + "Tema Visual" (3 color pickers)
- Sin tabs, sin sub-navegación, sin agrupación por dominio
- No incluye Users, Roles, Storage, Intelligence — esos son páginas separadas en el sidebar
- La página settings es solo info de tenant + colores

**Gap UX/UI**
1. **Sin estructura de tabs** — es la brecha más grande con Core Associates
2. **Administración fragmentada** — Users, Roles, Settings, Storage, Intelligence son 5 páginas separadas sin conexión visual entre ellas
3. **Sin jerarquía de módulos** — no queda claro que Settings/Users/Roles/Storage/Intelligence son parte del mismo dominio "Administración"
4. **Cards demasiado simples** — Info General es un grid de labels y valores sin separadores
5. **Color pickers sin contexto** — 3 inputs de color sin demostración de impacto
6. **Sin iconos por sección** — las cards no tienen header con icono

**Severidad:** 🔴 CRÍTICA

**Impacto:** La configuración es donde un administrador pasa más tiempo. Una configuración pobre = el producto se siente incompleto. Un stakeholder que ve esto pensará que el sistema no está terminado.

**Referencia deseada:** Página de Configuración/Admin centralizada con tabs (o sub-nav) que agrupe: General, Tema, Usuarios, Roles, Almacenamiento, IA. Cada tab con icono color-coded. Tab container con shadow y rounded-xl. Contenido dentro de cada tab con cards agrupadas.

**Acción correctiva:**
- Opción A: Crear super-página `/admin` con tabs que hospede Users, Roles, Settings, Storage, Intelligence
- Opción B: Mantener páginas separadas pero crear un header de sub-navegación compartido `/admin/*` con tabs horizontales
- Se recomienda Opción B (menos refactor, misma percepción)
- Agregar header de sección admin con tabs icon-colored
- Cada tab/página debe tener header de sección consistente

---

### TENANTS

**Objetivo esperado**
- Tabla de gestión de empresas con stats cards superiores, toolbar rica, acciones claras
- Referencia: Core Associates Asociados — stats cards con gradientes y watermarks, tabla con avatars, badges de estado color-coded, toolbar con search + filters + export

**Estado actual**
- Título "Tenants" + botón "Nuevo Tenant"
- 2 stats cards: "Total Tenants" y "Activos" — cards shadcn planas
- DataTable con columnas y búsqueda
- Dialog modal para crear/editar

**Gap UX/UI**
1. **Stats cards planas** — sin gradiente, sin watermark, sin hover
2. **Solo 2 stats** — faltan: inactivos, por plan, últimos creados
3. **Toolbar sin filtros** — solo search, sin filter por status/plan
4. **Tabla genérica** — sin avatar/logo de empresa, sin badges de plan con color

**Severidad:** 🟡 ALTA

**Acción correctiva:**
- Stats cards enterprise (4 cards: total, activos, inactivos, con plan premium)
- Badges de estado y plan con color en la tabla
- Toolbar: search + status filter + plan filter
- Logo/avatar placeholder en column de nombre

---

### CLIENTS

**Objetivo esperado**
- Listado de clientes con datos empresariales, contacto, estado

**Estado actual**
- Título + botón crear
- Sin stats cards
- DataTable básica
- Sin avatar/logo de empresa

**Gap UX/UI**
1. **Sin stats cards** — llega directo a la tabla sin contexto
2. **Sin datos enriquecidos** en la tabla — sin badges, sin avatar
3. **Vista demasiado escueta** comparada con otras páginas

**Severidad:** 🟡 ALTA

**Acción correctiva:**
- Agregar stats cards (total clientes, con sitios asignados, nuevos este mes)
- Badges de estado en tabla
- Avatar/icono por empresa

---

### INVENTORY (Dashboard)

**Objetivo esperado**
- Panel ejecutivo de infraestructura CCTV — el centro nervioso del sistema
- Datos operativos: cuántas cámaras, NVRs, almacenamiento, sitios

**Estado actual**
- 4 cards de stats + 2 cards de detalle (Infraestructura + Cobertura)
- Cards shadcn estándar sin gradiente ni watermark
- Datos bien estructurados pero sin impacto visual

**Gap UX/UI**
1. Cards genéricas sin identidad CCTV
2. Sin enlace directo a NVRs/Cameras desde las stats
3. Sin health indicator — no se sabe si la infraestructura está healthy o con problemas

**Severidad:** 🟢 MEDIA

**Acción correctiva:**
- Stats cards enterprise con colores del dominio CCTV
- Links directos desde las cards a sus módulos
- Indicador de salud general

---

### TICKETS

**Estado actual**
- Stats cards (4) + DataTable + Export + múltiples dialogs
- La pantalla mejor lograda del sistema actualmente
- Tiene: stats, búsqueda, export, acciones complejas

**Gap UX/UI**
1. Stats cards sin gradiente/watermark
2. Sin badges de prioridad con colores fuertes
3. Sin indicador visual de SLA vencer pronto

**Severidad:** 🟢 MEDIA

**Acción correctiva:**
- Stats cards enterprise
- Badges de prioridad/estado más prominentes
- Indicador visual de tickets por vencer SLA

---

### FLOOR PLANS

**Estado actual**
- Grid de cards por sitio con estado de plano, botones de acción
- Badges y stats visibles
- Empty state básico (icon + texto)

**Gap UX/UI**
1. Cards de sitio sin imagen preview del plano
2. Empty state demasiado simple
3. Sin indicador de "último editado"

**Severidad:** 🟢 MEDIA

**Acción correctiva:**
- Preview thumbnail del plano si existe
- Empty state enriquecido con CTA guiado
- Metadata "última edición" en card

---

### PÁGINAS CON TABLAS (patrón general)

**Gap transversal:**
1. DataTable funcional pero sin presencia — se siente como `<table>` HTML con borde
2. Sin row striping
3. Sin hover row highlight
4. Sin sticky header
5. Sin responsive card view para mobile
6. Sin column visibility toggle visible
7. Pagination funcional pero sin estilo refinado

**Acción correctiva:**
- Header bg: `bg-gray-50/80` sutil
- Row hover: `hover:bg-gray-50`
- Striped: nth-child(even) sutil
- Responsive: card renderer para mobile

---

### PÁGINAS VACÍAS / SIN DATOS

**Gap transversal:**
1. **La mayoría no tiene empty state definido** — si no hay datos, la tabla muestra "No results"
2. **No hay onboarding visual** — el usuario que entra por primera vez ve tablas vacías
3. **Sin ilustración** ni CTA guiada
4. **Sin seed data** — la primera impresión es de sistema roto

**Acción correctiva:**
- Componente `EmptyState` reutilizable: ilustración/icono grande + título + descripción + CTA botón
- Implementar en todas las tablas como fallback
- Seed visual: mock data o importación guiada

---

## 4. Hallazgos Globales

| # | Problema transversal | Severidad |
|---|---|---|
| G-01 | Login sin peso visual ni identidad de producto | 🔴 Crítica |
| G-02 | Dashboard sin narrativa operativa ni diferenciación visual | 🔴 Crítica |
| G-03 | Sidebar funcional pero sin presencia visual — se funde con el contenido | 🔴 Crítica |
| G-04 | Configuración/Admin fragmentada en 5 páginas sin relación visual | 🔴 Crítica |
| G-05 | Stats cards genéricas en TODAS las pantallas — sin gradientes, watermarks, hover | 🔴 Crítica |
| G-06 | Empty states pobres o inexistentes — primera impresión de sistema vacío | 🟡 Alta |
| G-07 | Header sin breadcrumb, search, notifications — se siente incompleto | 🟡 Alta |
| G-08 | Tablas funcionales pero sin presencia — row hover, striping, responsive cards | 🟡 Alta |
| G-09 | Sin datos demo / seed — sistema vacío en primera visita | 🟡 Alta |
| G-10 | Avatar de usuario sin gradiente — fallback plano | 🟢 Media |
| G-11 | Sin Recharts — gráficos manuales con divs | 🟢 Media |

---

## 5. Priorización

### MUST FIX antes de demo
1. **Login** — split-panel, branding, features, user presets
2. **Dashboard** — stats cards enterprise, narrativa, gráficos
3. **Sidebar** — fondo oscuro, branding, indicator bar, secciones
4. **Header** — breadcrumb, backdrop blur, avatar gradiente
5. **Configuración** — sub-navegación admin con tabs
6. **Stats cards** — componente enterprise reutilizable con gradiente + watermark
7. **Empty states** — componente reutilizable en todas las tablas

### SHOULD FIX
8. Tablas: row hover, header bg, striping
9. Tenants/Clients: stats cards y badges mejorados
10. Seed data o demo fixtures
11. Search global (UI placeholder)

### NICE TO HAVE
12. Notification bell placeholder
13. Recharts para gráficos
14. Responsive card view en DataTable mobile
15. Animaciones de transición suaves

---

## 6. Veredicto

**El producto actual NO está listo para demo.**

La funcionalidad está al ~76% (42/55 sub-tareas completas), pero la capa visual está al ~30% del nivel esperado. El gap principal es que se usaron componentes shadcn/ui default sin customización, mientras que la referencia (Core Associates) demuestra que se pueden alcanzar resultados significativamente más profesionales con el mismo stack.

La buena noticia: el refactor es puramente de presentación. No hay que reescribir lógica, stores, API calls ni flujo de datos. Es cambiar clases CSS, crear 3-4 componentes compartidos enterprise (StatsCard, EmptyState, AdminTabLayout, BrandedSidebar), y rediseñar el login.

**Estimación de impacto del rediseño: el producto pasaría de "prototipo funcional" a "plataforma enterprise demostrable" sin tocar una línea de lógica de negocio.**
