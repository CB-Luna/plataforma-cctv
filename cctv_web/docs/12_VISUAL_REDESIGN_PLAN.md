# 12 — Plan de Rediseño Visual: SyMTickets CCTV

> Fecha: 2026-04-05
> Prerequisito: `docs/11_UX_GAP_ANALYSIS.md`
> Principio rector: "No clonar Core Associates — alcanzar su nivel de calidad con identidad propia CCTV"
>
> ✅ **IMPLEMENTADO (CP-06 cleanup):** Este plan fue ejecutado completamente. Estado actual:
> - CSS Variables CCTV implementadas en `globals.css` (sidebar-bg, colors, gradients)
> - StatsCard, EmptyState, PageHeader componentes enterprise creados
> - Sidebar enterprise dark (#0f172a) con hover states, active indicator teal
> - Login con gradiente y branding
> - Tablas con stats cards, toolbar rica, empty states contextuales
> - Hover effects, transitions, rounded consistent implementados
> - Los tokens y variables propuestos fueron adoptados (con ajustes para Tailwind V4 `@theme inline`)

---

## 1. Objetivo del Rediseño

Transformar SyMTickets CCTV de un scaffold funcional con componentes shadcn default a una **plataforma enterprise de gestión CCTV** con identidad visual propia, sin modificar lógica de negocio, stores, API calls ni flujos de datos.

**Qué cambia:** CSS, clases Tailwind, composición de componentes, layout, colores, tipografía, iconos
**Qué NO cambia:** Endpoints, tipos, stores, hooks, validaciones, rutas, RBAC

---

## 2. Principios Visuales

### 2.1 Identidad CCTV (no SaaS genérico)
- Paleta fría: navy, slate, steel blue, con acentos en teal/cyan para estados activos
- Icono dominante: cámara, shield, monitor, network
- Sensación: centro de comando, control operativo, infraestructura
- NO: pasteles, popups coloridos, ilustraciones cartoon

### 2.2 Enterprise First
- Jerarquía clara: el ojo debe saber dónde ir en < 1 segundo
- Densidad controlada: suficientes datos sin sentir vacío, sin saturar
- Stats prominentes: números grandes, colores de estado, iconos significativos
- Navegación contextual: siempre saber dónde estoy (breadcrumb, active states)

### 2.3 Componentes compartidos
- No repetir estilos inline — crear 3-4 componentes enterprise reutilizables
- StatsCard, EmptyState, PageHeader, AdminTabNav

### 2.4 Consistencia de polish
- Hover effects en TODOS los elementos interactivos
- Transiciones suaves (transition-all duration-200)
- Sombras y bordes consistentes
- Rounded consistent (`rounded-xl` para cards, `rounded-lg` para buttons, `rounded-md` para inputs)

---

## 3. Design Tokens y Variables CSS

### 3.1 Nuevas variables CSS (agregar a globals.css)

```css
/* Sidebar */
--sidebar-bg: #0f172a;           /* slate-900 */
--sidebar-text: #cbd5e1;         /* slate-300 */
--sidebar-text-active: #ffffff;
--sidebar-active-bg: rgba(255, 255, 255, 0.12);
--sidebar-indicator: #38bdf8;    /* sky-400 — acento CCTV */
--sidebar-hover-bg: rgba(255, 255, 255, 0.08);
--sidebar-separator: rgba(255, 255, 255, 0.08);

/* Page & Surface */
--bg-page: #f8fafc;              /* slate-50 */
--bg-surface: #ffffff;
--bg-page-dark: #0b0f19;
--bg-surface-dark: #111827;

/* Table */
--table-header-bg: rgba(248, 250, 252, 0.8);
--table-stripe-bg: rgba(248, 250, 252, 0.5);
--table-hover-bg: rgba(241, 245, 249, 0.8);

/* Stats card colors */
--stats-blue: #3b82f6;
--stats-green: #22c55e;
--stats-amber: #f59e0b;
--stats-red: #ef4444;
--stats-teal: #14b8a6;
--stats-purple: #8b5cf6;
```

### 3.2 Dark mode overrides
Mismas variables con equivalentes dark ya están parcialmente soportadas vía clase `dark`.

---

## 4. Rediseño por Pantalla

---

### 4.1 LOGIN

**Layout:**
```
┌──────────────────────────┬─────────────────┐
│                          │                 │
│   PANEL DE MARCA (60%)   │  FORMULARIO     │
│                          │  (40%)          │
│  gradiente navy→dark     │                 │
│  grid pattern overlay    │  Card blanco    │
│  logo SyMTickets         │  shadow-xl      │
│  ilustración CCTV        │  ring-1         │
│  3 features columns      │                 │
│                          │  Email          │
│  ☐ Monitoreo 24/7        │  Password 👁    │
│  ☐ Multi-sucursal        │  [Login]        │
│  ☐ Gestión inteligente   │                 │
│                          │  ─── o ───      │
│                          │  User presets   │
│                          │  [Admin] [Oper] │
│                          │                 │
└──────────────────────────┴─────────────────┘
```

**Especificaciones:**
- Container: `min-h-screen lg:grid lg:grid-cols-5`
- Panel izquierdo: `col-span-3 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 relative overflow-hidden`
- Grid pattern: pseudo-element con `radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)` background-size 24px
- Logo: icono cámara + "SyMTickets CCTV" en text-white text-2xl font-bold
- Features: grid 3-col con iconos Camera, Shield, Monitor — text white/80, labels sm
- Panel derecho: `col-span-2 flex items-center justify-center bg-gray-50 p-8`
- Card: `bg-white rounded-2xl p-8 shadow-xl ring-1 ring-gray-900/5 w-full max-w-md`
- Title: "Accede a tu cuenta" text-2xl font-bold text-gray-900
- Inputs: `h-11 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500`
- Password: input con `type toggle` — botón Eye/EyeOff
- Botón: `h-11 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold transition-colors`
- Separator: "o accede rápido" con líneas hr
- User presets: 2-3 cards clickeables — `border rounded-xl p-3 hover:border-sky-500 cursor-pointer transition-all` — avatar gradient + nombre + rol

**Mobile (< lg):**
- Stack vertical: header con gradient (h-40 con logo + nombre) → formulario below
- Sin features, sin user presets (solo form directo)

---

### 4.2 DASHBOARD

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  Operación CCTV — Empresa — Sucursal    [fecha] │
├────────┬────────┬────────┬────────┬─────────────┤
│ 🎫     │ ✅     │ 📹     │ 💾     │             │
│Tickets │SLA %   │Cámaras │Almacen.│             │
│ 127    │ 94.2%  │ 1,284  │ 78.5TB │             │
│ +12    │ ↑2.1%  │ 3 off  │ 82%    │             │
├────────┴────────┴────────┴────────┘             │
│                                                  │
│  ┌─── Tendencia 6M ───┐  ┌── Distribución ──┐  │
│  │  ████               │  │    ╭──╮          │  │
│  │  ████ ██            │  │   │    │          │  │
│  │  ████ ██ ████       │  │    ╰──╯          │  │
│  └─────────────────────┘  └──────────────────┘  │
│                                                  │
│  ┌── Tickets recientes ─┐  ┌── Alertas ──────┐  │
│  │  #1234 Alta ...       │  │  🔴 NVR-05 off  │  │
│  │  #1235 Media ...      │  │  🟡 Disco 90%   │  │
│  └───────────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Especificaciones del StatsCard enterprise:**
```tsx
// Componente: src/components/ui/stats-card.tsx
// Props: title, value, subtitle, icon, color, trend
// Layout:
//   ┌───────────────────────────────┐
//   │  [icon-box]  Title       [▲▼] │
//   │              VALUE            │
//   │              subtitle         │
//   │                    🔲 watermark│
//   └───────────────────────────────┘

// Estilos por color:
// blue:  bg-gradient-to-br from-blue-50 to-white, icon: bg-blue-100 text-blue-600
// green: bg-gradient-to-br from-green-50 to-white, icon: bg-green-100 text-green-600
// amber: bg-gradient-to-br from-amber-50 to-white, icon: bg-amber-100 text-amber-600
// red:   bg-gradient-to-br from-red-50 to-white, icon: bg-red-100 text-red-600

// Watermark: icon h-20 w-20 absolute -bottom-3 -right-3 rotate-12 opacity-[0.07]
// Hover: hover:-translate-y-0.5 hover:shadow-md transition-all duration-200
// Value: text-3xl font-bold tracking-tight tabular-nums
// Trend: ▲ green / ▼ red con text-xs
```

**Header del dashboard:**
- "Operación CCTV" text-2xl font-bold + empresa/sucursal text-muted + fecha "Sáb 5 Abr 2026"
- NO "Bienvenido, admin" genérico

**Gráficos:**
- Instalar Recharts: `npm install recharts`
- Bar chart: tendencia de tickets últimos 6 meses (BarChart + tooltip + grid)
- Donut: distribución por tipo (PieChart innerRadius 60%)
- Ambos en cards con header + shadow + rounded-xl

---

### 4.3 SIDEBAR

**Especificaciones:**

```
┌──────────────────────────┐
│  ▣ SyMTickets CCTV       │  ← branding area h-16
│    Gestión CCTV           │
├──────────────────────────┤
│                           │
│  PRINCIPAL                │  ← section label
│  ┃ ⊞ Dashboard            │  ← indicator bar + icon
│    🎫 Tickets             │
│    🗂  Pólizas             │
│                           │
│  ─────────────────────── │  ← separator
│                           │
│  INFRAESTRUCTURA          │
│    📹 Cámaras             │
│    🖥 NVRs                │
│    📊 Inventario          │
│    🏗 Planos              │
│                           │
│  ─────────────────────── │
│                           │
│  ADMINISTRACIÓN           │
│    ⚙ Configuración       │
│    👥 Usuarios            │
│    🔐 Roles               │
│    💾 Almacenamiento      │
│                           │
│  ─────────────────────── │
│                           │
│  v1.0.0 · SyMTickets     │  ← footer
└──────────────────────────┘
```

**Estilos:**
- Container: `bg-[--sidebar-bg] text-[--sidebar-text]` (slate-900 / white)
- Branding area: `h-16 px-4 flex items-center gap-3 border-b border-white/10`
  - Logo: icono Camera en `bg-sky-500/20 text-sky-400 rounded-lg p-1.5`
  - Título: "SyMTickets CCTV" text-white font-semibold
  - Subtítulo: "Gestión CCTV" text-xs text-slate-400
- Section labels: `text-[10px] uppercase tracking-widest text-slate-500 px-3 mt-6 mb-2`
- Nav items: `px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm transition-all duration-150`
  - Default: `text-slate-300 hover:bg-white/8 hover:text-white`
  - Active: `bg-white/12 text-white shadow-sm` + indicator bar: `absolute left-0 h-6 w-[3px] rounded-r-full bg-sky-400`
- Separator: `border-t border-white/8 mx-3 my-2`
- Footer: `text-[11px] text-slate-500 text-center py-3 border-t border-white/8`
- Collapsed: icono solo, tooltip con nombre, branding area muestra solo logo

**Dark mode:**
- Sidebar ya es dark por defecto. Sin cambio adicional.

---

### 4.4 HEADER

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  ☰  Panel > Dashboard             🔍 Buscar... ⌘K   🔔(3) 🌙 👤 │
└─────────────────────────────────────────────────────────────────┘
```

**Especificaciones:**
- Container: `h-16 border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80`
- Left: hamburger (mobile) + breadcrumb (`text-sm text-muted` con ChevronRight separator, último item `font-medium text-foreground`)
- Center/Right: search trigger + notifications + theme + user
- Search trigger: `rounded-lg border px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 gap-4` con "Buscar..." + `<kbd>⌘K</kbd>` (solo visual, search real en V2)
- Notification bell: `relative p-2 rounded-lg hover:bg-muted` + badge count `absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white`
- Avatar: `h-8 w-8 rounded-full bg-gradient-to-br from-sky-500 to-blue-700 text-white text-xs flex items-center justify-center` (iniciales)

**Breadcrumb:**
- Hook `useBreadcrumb()` que parsea `pathname` → array de segmentos
- Lookup table: `/dashboard` → "Dashboard", `/tickets` → "Tickets", etc.
- Formato: "Panel" (root) > "Módulo" > "Sub-página"

---

### 4.5 CONFIGURACIÓN / ADMIN

**Layout con sub-navegación:**
```
┌─────────────────────────────────────────────────┐
│  ⚙ Administración                               │
│                                                  │
│  [General] [Tema] [Usuarios] [Roles] [Almac.] [IA] │
│  ════════                                        │
│                                                  │
│  ┌── Contenido del tab activo ─────────────────┐│
│  │                                              ││
│  │  (varía por tab)                             ││
│  │                                              ││
│  └──────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

**Opción implementada: Layout compartido para `/admin/*`**

Crear `src/app/(dashboard)/admin/layout.tsx` con:
- Header: "Administración" text-2xl font-bold + descripción
- Tab navigation horizontal
- Mover Settings, Users, Roles, Storage, Intelligence bajo `/admin/`
  - `/admin` → General + Tema (actual Settings)
  - `/admin/users` → Usuarios (actual /users)
  - `/admin/roles` → Roles (actual /roles)
  - `/admin/storage` → Almacenamiento (actual /storage)
  - `/admin/intelligence` → Inteligencia (actual /intelligence)

**Tabs:**
```tsx
const adminTabs = [
  { id: 'general', label: 'General', icon: Settings2, color: 'blue', href: '/admin' },
  { id: 'theme', label: 'Tema', icon: Palette, color: 'pink', href: '/admin/theme' },
  { id: 'users', label: 'Usuarios', icon: Users, color: 'indigo', href: '/admin/users' },
  { id: 'roles', label: 'Roles', icon: Shield, color: 'purple', href: '/admin/roles' },
  { id: 'storage', label: 'Almacenamiento', icon: HardDrive, color: 'gray', href: '/admin/storage' },
  { id: 'intelligence', label: 'Inteligencia', icon: Brain, color: 'teal', href: '/admin/intelligence' },
];
```

**Tab estilo:**
- Default: `text-muted-foreground hover:text-foreground`
- Active: `text-[color]-700 border-b-[3px] border-[color]-600`
- Icon container: `h-8 w-8 rounded-lg flex items-center justify-center` con `bg-[color]-50 text-[color]-600`
- Mobile: dropdown Select con icono

**NOTA IMPORTANTE:** NO se mueven las rutas físicamente en esta iteración. Se crea un layout wrapper que renderiza tabs y redirige internamente. Las rutas pueden mantenerse como `/settings`, `/users`, etc. con el tab nav apuntando a esas rutas. Mínimo refactor.

**Alternativa mínima:** Si mover rutas es demasiado invasivo, crear un componente `AdminNav` que se incluya en el layout de todas las páginas admin. Cada página ya existe — solo se les agrega el nav compartido.

---

### 4.6 STATS CARDS (componente global)

**Componente:** `src/components/ui/stats-card.tsx`

```tsx
interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'amber' | 'red' | 'teal' | 'purple';
  trend?: { value: number; label: string };
}
```

**Colores predefinidos:**
| Color | Gradient from | Icon bg | Icon text | Watermark opacity |
|---|---|---|---|---|
| blue | blue-50 | blue-100 | blue-600 | 0.07 |
| green | green-50 | green-100 | green-600 | 0.07 |
| amber | amber-50 | amber-100 | amber-600 | 0.07 |
| red | red-50 | red-100 | red-600 | 0.07 |
| teal | teal-50 | teal-100 | teal-600 | 0.07 |
| purple | purple-50 | purple-100 | purple-600 | 0.07 |

**Dark mode:**
| Color | Gradient from | Icon bg | Icon text |
|---|---|---|---|
| blue | blue-950/40 | blue-900/50 | blue-400 |
| green | green-950/40 | green-900/50 | green-400 |
| amber | amber-950/40 | amber-900/50 | amber-400 |
| red | red-950/40 | red-900/50 | red-400 |

---

### 4.7 EMPTY STATE (componente global)

**Componente:** `src/components/ui/empty-state.tsx`

```tsx
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}
```

**Layout:**
```
┌─────────────────────────────────┐
│            📹 (h-16 w-16)       │
│                                  │
│    No hay cámaras registradas   │
│                                  │
│   Agrega tu primera cámara      │
│   para comenzar a monitorear.   │
│                                  │
│       [+ Agregar cámara]        │
└─────────────────────────────────┘
```

**Estilos:**
- Container: `flex flex-col items-center justify-center py-16 text-center`
- Icon: `h-16 w-16 text-muted-foreground/30 mb-4`
- Title: `text-lg font-semibold text-foreground mb-1`
- Description: `text-sm text-muted-foreground max-w-sm mb-6`
- CTA: Button variant outline

---

### 4.8 TABLAS (mejoras DataTable)

**Cambios al DataTable existente:**
1. Header: `bg-muted/50 sticky top-0` con `text-xs uppercase tracking-wide font-semibold`
2. Row hover: `hover:bg-muted/30 transition-colors`
3. Striped: `even:bg-muted/20`
4. Borders: `divide-y divide-border/50`
5. Pagination: `text-sm` con botones más definidos

**NO se implementa aún:**
- Mobile card view (V2)
- Column visibility toggle en toolbar (V2)

---

## 5. Seed Data / Demo Fixtures

### Datos mínimos para demo
Para que la primera impresión sea de sistema operativo (no vacío):

| Entidad | Cantidad demo | Datos clave |
|---|---|---|
| Tenants | 2-3 | Demo Corp, Vigilancia PRO |
| Clients | 4-5 | Empresas con nombres reales |
| Sites | 6-8 | Oficina Central, Bodega Norte, etc. |
| NVRs | 8-12 | Con IPs, status online/offline |
| Cameras | 20-30 | Con modelo, resolución, status |
| Tickets | 15-20 | Variados: abiertos, cerrados, urgentes |
| Policies | 3-5 | Pólizas con fechas y cobertura |
| Users | 4-5 | Admin, Operador, Técnico, Viewer |

**Implementación:** Script seed o fixture JSON cargable desde UI.
**Alternativa mínima:** Si el backend no soporta seed fácil, crear datos desde la UI como parte del QA.

---

## 6. Quick Wins (< 30 min cada uno)

| # | Quick Win | Impacto |
|---|---|---|
| QW-1 | `suppressHydrationWarning` en html+body | ✅ YA HECHO |
| QW-2 | Stats card con gradiente + watermark (componente) | Alto — se usa en 6+ pantallas |
| QW-3 | Empty state component | Alto — mejora todas las tablas vacías |
| QW-4 | Header backdrop-blur + breadcrumb | Medio — mejora percepción global |
| QW-5 | Avatar con gradiente fallback | Bajo — detalle polish |
| QW-6 | Sidebar fondo oscuro (CSS variables) | Alto — mejora percepción global |

---

## 7. Iteración Propuesta

### Iteración A — Estructura visual core (alto impacto)
1. **Sidebar** — fondo oscuro, branding, indicator bar, secciones
2. **Header** — breadcrumb, backdrop-blur, avatar gradient
3. **StatsCard** — componente enterprise reutilizable
4. **EmptyState** — componente reutilizable
5. **Login** — split-panel completo

**Resultado:** La "cáscara" del producto se transforma. Cualquier pantalla ya se ve mejor.

### Iteración B — Dashboard + Admin
6. **Dashboard** — stats cards enterprise, header operativo, gráficos Recharts
7. **Admin/Config** — sub-navegación con tabs, agrupación de módulos
8. **DataTable** — header bg, row hover, striping

**Resultado:** Las 2 pantallas más visitadas llegan a nivel enterprise.

### Iteración C — Módulos + Polish
9. **Tenants** — stats mejorados, badges
10. **Clients** — stats, badges
11. **Tickets** — stats enterprise, badges prioridad
12. **Inventory** — stats con colores CCTV
13. **Empty states** en todas las tablas
14. **Seed data** si es viable

**Resultado:** Producto demo-ready.

---

## 8. Entregables

| Archivo / Componente | Tipo | Iteración |
|---|---|---|
| `src/components/ui/stats-card.tsx` | Nuevo componente | A |
| `src/components/ui/empty-state.tsx` | Nuevo componente | A |
| `src/components/layout/sidebar.tsx` | Rediseño | A |
| `src/components/layout/header.tsx` | Rediseño | A |
| `src/components/layout/breadcrumb.tsx` | Nuevo componente | A |
| `src/app/login/page.tsx` | Rediseño completo | A |
| `src/app/(dashboard)/page.tsx` (Dashboard) | Rediseño | B |
| `src/components/layout/admin-nav.tsx` | Nuevo componente | B |
| `src/components/ui/data-table.tsx` | Mejoras CSS | B |
| `src/app/(dashboard)/settings/page.tsx` | Integrar admin-nav | B |
| `src/app/(dashboard)/users/page.tsx` | Stats + admin-nav | B |
| `src/app/(dashboard)/roles/page.tsx` | Stats + admin-nav | B |
| `src/app/(dashboard)/tenants/page.tsx` | Stats enterprise | C |
| `src/app/(dashboard)/clients/page.tsx` | Stats enterprise | C |
| `src/app/(dashboard)/tickets/page.tsx` | Stats enterprise | C |
| `src/app/(dashboard)/inventory/page.tsx` | Stats enterprise | C |
| `src/globals.css` | Variables CSS sidebar/table/stats | A |

---

## 9. Riesgos y Mitigaciones

| Riesgo | Mitigación |
|---|---|
| Sidebar dark mode puede conflictuar con theme provider | Variables CSS aisladas, no dependientes de `dark` class |
| Mover rutas a `/admin/*` puede romper RBAC sidebar | Alternativa: AdminNav compartido sin mover rutas |
| Recharts aumenta bundle size | Tree-shaking + dynamic import |
| Login split-panel puede afectar mobile | Diseño responsive: stack vertical en mobile |
| Seed data puede no existir en backend | Crear datos manualmente vía UI como fallback |

---

## 10. Criterio de Aceptación

El rediseño se considera exitoso cuando:

- [ ] Login transmite identidad CCTV enterprise en primeros 3 segundos
- [ ] Dashboard se siente como centro de comando, no como lista de cards
- [ ] Sidebar tiene presencia visual propia y no se funde con el contenido
- [ ] Header muestra contexto de navegación (breadcrumb)
- [ ] Settings/Admin se siente como centro de administración con estructura
- [ ] Tablas vacías muestran empty state guiado, no espacio en blanco
- [ ] Stats cards tienen color, gradiente y hover lift en todas las pantallas
- [ ] El sistema con datos se ve operativo y con datos vacío se ve listo para usar
- [ ] Un stakeholder externo diría "esto es una plataforma, no un prototipo"
