# 13 — Checkpoints V2: Funcionalidad Completa

> Fecha: 2026-04-06
> Última actualización: 2026-04-07
> Estado: **✅ TODOS LOS CHECKPOINTS COMPLETADOS**
> Nota: Se incluye sección de bug-fixes post-implementación al final.

---

## Resumen de Checkpoints

| # | Checkpoint | Esfuerzo | Prioridad | Estado |
|---|---|---|---|---|
| CP-01 | Seed Data + Placeholders para pantallas vacías | Medio | 🔴 CRÍTICO | ✅ Completado |
| CP-02 | Fix CRUD Cámaras (updateCamera) | Bajo | 🔴 CRÍTICO | ✅ Completado |
| CP-03 | Mapa Geográfico con Leaflet (Empresas → Sucursales) | Alto | 🟡 ALTO | ✅ Completado |
| CP-04 | Editor de Planos Enterprise (Konva rewrite) | Muy Alto | 🟡 ALTO | ✅ Completado (Fase 4A) |
| CP-05 | Dashboard CCTV (gráficos de infraestructura) | Medio | 🟢 MEDIO | ✅ Completado |
| CP-06 | Docs clean-up (actualizar docs obsoletos) | Bajo | 🟢 MEDIO | ✅ Completado |

---

## CP-01: Seed Data + Empty States

### Problema
Todas las tablas están vacías. Al navegar a `/cameras`, `/nvrs`, `/clients`, `/tickets`, etc. el usuario ve tablas sin datos. Esto mata cualquier demo.

### Solución: dos frentes

#### A) Seed Script completo (`scripts/seed-demo.ts`)
Script ejecutable que pobla la base de datos con datos realistas.

**Datos a generar:**

| Entidad | Cantidad | Fuente |
|---|---|---|
| Empresas (Tenants) | 3 | Skyworks Security, Vigilancia Norte, CCTV Solutions |
| Clientes por empresa | 5-8 | Nombres ficticios mexicanos (Soriana, OXXO, Coppel, etc.) |
| Sucursales por cliente | 2-4 | Direcciones reales de ciudades MX con lat/lng |
| NVRs por sucursal | 1-3 | Datos del `Inventario Skyworks.xlsx` |
| Cámaras por NVR | 8-32 | Datos del `Inventario Skyworks.xlsx` + modelos Avigilon |
| Tickets | 20-30 | Variados: abiertos, cerrados, en progreso |
| Pólizas | 5-10 | Fechas de vigencia realistas |
| SLA Levels | 3 | Crítico (4h), Alto (8h), Normal (24h) |
| Usuarios | 8-10 | Admin, Supervisores, Técnicos con avatares |
| Roles | 4 | Super Admin, Admin, Supervisor, Técnico |
| Batches de importación | 2-3 | Con items y errores de ejemplo |

**Ejecución:**
```bash
npx tsx scripts/seed-demo.ts
```
El script debe:
- Verificar si ya hay datos y preguntar antes de sobreescribir
- Mostrar progreso con contadores
- Funcionar contra el backend Go en `localhost:8087`

#### B) Empty States para TODAS las pantallas
Cuando una tabla no tiene datos, mostrar un componente `<EmptyState>` con:
- Icono relevante al módulo
- Título descriptivo ("No hay cámaras registradas")
- Subtítulo con acción ("Importa desde Excel o crea una manualmente")
- Botón de acción principal

**Pantallas que necesitan EmptyState:**
- [ ] `/cameras` — "No hay cámaras" → botón "Importar" + "Nueva Cámara"
- [ ] `/nvrs` — "No hay servidores" → botón "Nuevo NVR"
- [ ] `/clients` — "No hay clientes" → botón "Nuevo Cliente"
- [ ] `/tickets` — "No hay tickets" → botón "Nuevo Ticket"
- [ ] `/policies` — "No hay pólizas" → botón "Nueva Póliza"
- [ ] `/sla` — "No hay niveles SLA" → botón "Nuevo SLA"
- [ ] `/imports` — "No hay importaciones" → botón "Importar datos"
- [ ] `/floor-plans` — "No hay planos" → texto informativo
- [ ] `/inventory` → "Sin datos de inventario" → link a importación
- [ ] Settings > Empresas — "No hay empresas" → botón "Nueva Empresa"
- [ ] Settings > Usuarios — "No hay usuarios" → botón "Nuevo Usuario"

### Estado actual — ✅ COMPLETADO

**Seed Script** (`scripts/seed-demo.ts`):
- Operativo con 8 pasos: Login → Clients → Sites (SQL directo) → NVRs → Cameras → SLA → Policies (SQL directo) → Tickets (SQL directo)
- Genera: ~8 clientes, ~24 sucursales con lat/lng, ~37 NVRs, ~312 cámaras, ~22 tickets, ~8 pólizas, 4 SLA
- Sucursales usan 12 ciudades mexicanas con coordenadas reales (Monterrey, CDMX, Guadalajara, etc.)
- Usa `pg` para inserción directa en DB (workaround para bug `toNumeric(float64)` en Go pgx v5.7.2)
- Credenciales: `admin@demo.com` / `Password123!`

**Empty States**: Componente `<EmptyState>` creado y aplicado a las 12 pantallas listadas.

### Definition of Done
- [x] Script seed-demo.ts creado y funcional
- [x] Componente `<EmptyState>` reutilizable creado
- [x] Todas las pantallas listadas tienen empty state
- [x] Al ejecutar el seed, todas las pantallas muestran datos reales

---

## CP-02: Fix CRUD Cámaras

### Problema
La función `updateCamera()` no existe en `src/lib/api/cameras.ts`. Cuando el usuario edita una cámara, el formulario CREA una nueva en vez de actualizar.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/lib/api/cameras.ts` | Agregar `updateCamera(id, data)` → `PUT /cameras/{id}` |
| `src/app/(dashboard)/cameras/page.tsx` | Agregar `updateMutation`, condicionar `handleSubmit` |

### Estado actual — ✅ COMPLETADO
- `updateCamera()` agregada a `src/lib/api/cameras.ts` con `PUT /cameras/{id}`
- `handleSubmit` en `cameras/page.tsx` usa mutation condicional (create vs update)
- Edición funcional verificada

### Definition of Done
- [x] `updateCamera()` exportada en cameras.ts  
- [x] `handleSubmit` distingue crear vs editar  
- [x] Editar una cámara actualiza la existente (no crea nueva)

---

## CP-03: Mapa Geográfico con Leaflet

### Problema
No existe visualización geográfica de empresas/sucursales. El admin necesita ver en un mapa dónde están las sucursales con sus cámaras.

### Dependencias a instalar
```bash
npm install leaflet react-leaflet @types/leaflet
```

### Estructura de archivos a crear

```
src/
  app/(dashboard)/
    map/
      page.tsx                    ← Página principal del mapa
  components/
    map/
      branch-map.tsx              ← Componente Leaflet con markers
      branch-marker.tsx           ← Marker custom con popup de info
      map-filters.tsx             ← Filtros: por empresa, estado, etc.
```

### Funcionalidad requerida

**Página `/map`:**
1. Mapa fullscreen con Leaflet (tiles OpenStreetMap)
2. Markers por cada sucursal con lat/lng
3. Popup al click mostrando:
   - Nombre sucursal
   - Empresa a la que pertenece
   - Cantidad de cámaras activas / total
   - Cantidad de NVRs
   - Link a "Ver plano" y "Ver cámaras"
4. Filtros laterales:
   - Por empresa
   - Por estado de cámaras (todas online / con alertas)
   - Por ciudad/estado
5. Cluster de markers cuando hay muchos puntos cercanos
6. Sidebar colapsable con lista de sucursales

**Sidebar update:**
- Agregar item "Mapa" al sidebar en la sección CCTV, entre Planos e Importación

### Prerequisitos backend
- `GET /inventory/floor-plans/sites` ya retorna sucursales pero **sin lat/lng**
- **OPCIÓN A:** El backend agrega lat/lng al endpoint existente
- **OPCIÓN B:** Hardcodear coordenadas en el seed script y crear un endpoint mock

### Modelo de datos
```typescript
interface SiteWithLocation extends FloorPlanSite {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
}
```

### Estado actual — ✅ COMPLETADO
- Leaflet + react-leaflet instalados
- `branch-map.tsx` con dynamic import (`ssr: false`)
- Markers con popups mostrando empresa, cámaras activas/total, NVRs
- Lookup de coordenadas desde `city-coordinates.ts` (30 ciudades MX)
- Sidebar: enlace "Mapa" en sección CCTV
- Sucursales del seed tienen lat/lng reales → markers visibles

### Definition of Done
- [x] Leaflet instalado y configurado (SSR: false con dynamic import)
- [x] Página `/map` funcional con mapa interactivo
- [x] Markers con popups informativos
- [x] Filtros por empresa
- [x] Link en sidebar sección CCTV
- [x] Funciona con datos del seed

---

## CP-04: Editor de Planos Enterprise (Konva Rewrite)

### Problema
El editor actual de planos es funcional pero básico. Necesita ser una herramienta enterprise seria con herramientas de dibujo, capas, propiedades, y persistencia completa.

### Estructura de carpetas objetivo

```
src/
  app/(dashboard)/
    floor-plans/
      page.tsx                          ← Lista de sitios (ya existe)
      [id]/
        page.tsx                        ← Wrapper del editor
        topology/
          page.tsx                      ← ReactFlow (ya existe)
  components/
    floor-plan-editor/
      floor-plan-editor-layout.tsx      ← Layout principal (toolbar + panels + canvas)
      floor-plan-toolbar.tsx            ← Barra superior: save, export, undo, redo, zoom, grid
      floor-plan-tools-sidebar.tsx      ← Panel izquierdo: herramientas (select, room, wall, door, text, camera, zone)
      floor-plan-canvas.tsx             ← Lienzo Konva central
      floor-plan-properties-panel.tsx   ← Panel derecho: propiedades del elemento seleccionado
      floor-plan-layers-panel.tsx       ← Panel derecho: capas por tipo
      elements/
        room-element.tsx                ← Render de espacios/habitaciones
        wall-element.tsx                ← Render de muros
        door-element.tsx                ← Render de puertas
        text-element.tsx                ← Render de etiquetas
        zone-element.tsx                ← Render de zonas
        camera-element.tsx              ← Render de cámara + cono de visión
        nvr-element.tsx                 ← Render de NVR
      properties/
        camera-properties-form.tsx      ← Form: nombre, tipo, rotación, FOV, range, link a cámara real
        room-properties-form.tsx        ← Form: nombre, color, dimensiones
        wall-properties-form.tsx        ← Form: grosor, color
        text-properties-form.tsx        ← Form: contenido, tamaño
        zone-properties-form.tsx        ← Form: nombre, color, tipo
  stores/
    floor-plan-editor-store.ts          ← Zustand store del editor
  lib/
    floor-plan/
      serializer.ts                     ← Serializar/deserializar JSON del plano
      exporter.ts                       ← Exportar canvas a PNG
      mock-data.ts                      ← Datos mock para desarrollo
      types.ts                          ← Tipos del editor (Tool, Element, Camera, etc.)
```

### Fase 4A — Infraestructura + Canvas + Elementos básicos

**Store del editor** (`floor-plan-editor-store.ts`):
```typescript
interface FloorPlanEditorState {
  // Plano
  floorPlan: FloorPlan | null;
  elements: FloorPlanElement[];
  cameras: FloorPlanCamera[];
  
  // Editor
  activeTool: ActiveTool;          // 'select' | 'room' | 'wall' | 'door' | 'text' | 'camera' | 'zone' | 'pan'
  selectedElementId: string | null;
  
  // Canvas
  zoom: number;
  panOffset: { x: number; y: number };
  gridEnabled: boolean;
  snapToGrid: boolean;
  gridSize: number;
  
  // History
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];
  
  // Actions
  setActiveTool: (tool: ActiveTool) => void;
  selectElement: (id: string | null) => void;
  addElement: (element: FloorPlanElement) => void;
  updateElement: (id: string, updates: Partial<FloorPlanElement>) => void;
  deleteElement: (id: string) => void;
  addCamera: (camera: FloorPlanCamera) => void;
  updateCamera: (id: string, updates: Partial<FloorPlanCamera>) => void;
  deleteCamera: (id: string) => void;
  undo: () => void;
  redo: () => void;
  setZoom: (zoom: number) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  loadDocument: (doc: SerializedFloorPlanDocument) => void;
  serializeDocument: () => SerializedFloorPlanDocument;
}
```

**Tipos del editor** (`lib/floor-plan/types.ts`):
```typescript
type ActiveTool = 'select' | 'room' | 'wall' | 'door' | 'text' | 'camera' | 'zone' | 'pan';

type FloorPlanElementType = 'room' | 'wall' | 'door' | 'text' | 'zone';

interface FloorPlanElement {
  id: string;
  type: FloorPlanElementType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  zIndex?: number;
  locked?: boolean;
  visible?: boolean;
  // Room
  name?: string;
  fillColor?: string;
  strokeColor?: string;
  // Wall
  points?: number[];     // Para líneas
  thickness?: number;
  // Text
  text?: string;
  fontSize?: number;
  // Zone
  zoneType?: 'restricted' | 'critical' | 'coverage' | 'evacuation';
}

type CameraIconType = 'bullet' | 'dome' | 'ptz';

interface FloorPlanCamera {
  id: string;
  floorPlanId: string;
  linkedCameraId?: string | null;    // Vinculada a cámara real
  name: string;
  iconType: CameraIconType;
  x: number;
  y: number;
  rotation: number;                   // Grados 0-360
  fovAngle: number;                   // Ángulo de visión en grados
  range: number;                      // Alcance en píxeles
  status?: 'online' | 'offline' | 'warning';
  color?: string;
  notes?: string;
}

interface SerializedFloorPlanDocument {
  floorPlan: {
    name: string;
    width: number;
    height: number;
    backgroundImageUrl?: string | null;
  };
  elements: FloorPlanElement[];
  cameras: FloorPlanCamera[];
  editorConfig: {
    gridEnabled: boolean;
    snapToGrid: boolean;
    gridSize: number;
    zoom: number;
  };
}
```

**Entregables Fase 4A:**
- [ ] Store Zustand completo (`floor-plan-editor-store.ts`)
- [ ] Tipos del editor (`lib/floor-plan/types.ts`)
- [ ] Layout: toolbar + tools sidebar + canvas + properties panel
- [ ] Canvas con grid, zoom, pan
- [ ] Herramientas: Select, Room, Wall, Text
- [ ] Render de elementos: habitaciones (rectángulos), muros (líneas), textos
- [ ] Panel de propiedades básico (nombre, color, tamaño)
- [ ] Serialización JSON

### Fase 4B — Cámaras + Cono de visión

**Entregables:**
- [ ] Herramienta "Cámara" — click en canvas coloca una cámara
- [ ] Render: ícono de cámara según tipo (bullet/dome/ptz)
- [ ] Cono de visión semitransparente: origen en cámara, ángulo=FOV, largo=range
- [ ] Rotación de cámara (drag handle o input numérico)
- [ ] Edición de FOV y range en panel de propiedades
- [ ] Label "CAM-001" junto al ícono
- [ ] Vinculación con cámara real de la sucursal (select en panel)

**Fórmula del cono de visión:**
```
Point A = cámara (x, y)
Point B = (x + range * cos(rotation - fovAngle/2), y + range * sin(rotation - fovAngle/2))
Point C = (x + range * cos(rotation + fovAngle/2), y + range * sin(rotation + fovAngle/2))
→ Renderizar como Konva.Wedge o Konva.Line con fill semitransparente
```

### Fase 4C — Capas + Puertas + Zonas + Export

**Entregables:**
- [ ] Herramienta "Puerta" — representación visual clara
- [ ] Herramienta "Zona" — área resaltada con tipo (restringida, crítica, cobertura)
- [ ] Panel de capas: toggle visibility por tipo (rooms, walls, cameras, zones, text)
- [ ] Exportar PNG del canvas (botón en toolbar)
- [ ] Undo / Redo (stack en store)
- [ ] Duplicar elemento
- [ ] Bloquear elemento (no se puede mover)

### Fase 4D — Polish + Mock data + Integración

**Entregables:**
- [ ] Mock data realista: plano precargado con 3-4 habitaciones, 5-6 cámaras, muros
- [ ] Guardar/cargar desde API (saveFloorPlan + getFloorPlanBySite)
- [ ] Keyboard shortcuts: Del=eliminar, Ctrl+Z=undo, Ctrl+Shift+Z=redo, Ctrl+S=guardar
- [ ] Snap to grid toggle
- [ ] Responsive: collapsar paneles en pantallas pequeñas

### Estado actual — ✅ FASE 4A COMPLETADA
- Zustand store completo (`floor-plan-editor-store.ts`)
- Tipos del editor (`lib/floor-plan/types.ts`)
- Layout enterprise: toolbar + tools sidebar + canvas + properties panel
- 6 componentes creados: layout, toolbar, tools-sidebar, canvas, properties-panel, layers-panel
- Konva con dynamic import SSR: false
- Fases 4B-4D pendientes para iteración futura

### Definition of Done
- [x] Store Zustand completo con undo/redo, zoom, grid, snap
- [x] Tipos del editor definidos
- [x] Layout enterprise funcional
- [ ] Fases 4B-4D pendientes (cámaras con cono de visión, zonas, export PNG)

---

## CP-05: Dashboard CCTV

### Problema
El dashboard actual está enfocado 100% en tickets. Para un sistema CCTV, necesita gráficos de infraestructura.

### Gráficos a agregar

| Gráfico | Tipo | Datos |
|---|---|---|
| Health NVRs | Donut/Pie | Online vs Offline vs Mantenimiento |
| Cámaras por tipo | Bar horizontal | Dome, Bullet, PTZ, LPR, etc. |
| Almacenamiento | Gauge/Progress | TB usados vs TB disponibles |
| Cámaras por sucursal | Bar chart | Top 10 sucursales por cantidad de cámaras |
| Timeline alertas | Line chart | Alertas de desconexión últimos 30 días |

### Reestructuración del Dashboard

```
Dashboard CCTV
├── Stats Row (4 cards): Cámaras activas, NVRs, Almacenamiento, Tickets abiertos
├── Row 2 (2 cols):
│   ├── Gráfico: Health NVRs (pie)
│   └── Gráfico: Cámaras por tipo (bar)
├── Row 3 (2 cols):
│   ├── Gráfico: Cámaras por sucursal (bar horizontal)
│   └── Gráfico: Tickets por estado (pie) — ya existe
└── Row 4 (full):
    └── Gráfico: Trend tickets + alertas últimos 30 días (line chart)
```

### Estado actual — ✅ COMPLETADO
- Dashboard reescrito con enfoque CCTV
- Gráficos: NVR Health (donut), Camera Types (bar), SLA Compliance, Trend 30 días (line)
- Stats cards: Cámaras activas, NVRs, Almacenamiento, Tickets abiertos
- Funciona con datos del seed

### Definition of Done
- [x] Dashboard muestra datos de infraestructura CCTV (no solo tickets)
- [x] Al menos 3 gráficos nuevos con Recharts
- [x] Stats cards muestran KPIs de CCTV
- [x] Funciona con datos del seed

---

## CP-06: Docs Clean-up

### Documentos a actualizar/retirar

| Doc | Estado actual | Acción |
|---|---|---|
| `05_SIDEMENU_PROPUESTO.md` | Obsoleto — sidebar fue reescrito 2 veces | Archivar o actualizar con estructura actual |
| `11_UX_GAP_ANALYSIS.md` | Obsoleto — login, settings, dashboard ya arreglados | Marcar como RESUELTO con notas |
| `12_VISUAL_REDESIGN_PLAN.md` | Parcialmente obsoleto | Actualizar con estado actual |
| `01_PLAN_ACCION.md` | Desactualizado — settings reestructurado, sidebar changed | Actualizar clasificaciones |

### Estado actual — ✅ COMPLETADO
- `05_SIDEMENU_PROPUESTO.md` actualizado con estructura actual (flat pattern)
- `11_UX_GAP_ANALYSIS.md` marcado como RESUELTO
- `12_VISUAL_REDESIGN_PLAN.md` actualizado con estado real
- `01_PLAN_ACCION.md` actualizado

### Definition of Done
- [x] Cada doc refleja el estado real del código
- [x] No hay información contradictoria entre docs

---

## Orden de ejecución recomendado

```
CP-01 (Seed + Empty States)     ← PRIMERO — sin esto todo se ve vacío
  └─ CP-02 (Fix updateCamera)   ← Quick fix, se hace junto con CP-01
      └─ CP-05 (Dashboard CCTV) ← Con datos del seed, los gráficos tienen sentido
          └─ CP-03 (Mapa Leaflet) ← Requiere sucursales con lat/lng del seed
              └─ CP-04 (Floor Plans) ← El más grande, se hace por fases
                  └─ CP-06 (Docs)    ← Al final, actualizar todo
```

---

## Reglas técnicas a respetar

| Regla | Detalle |
|---|---|
| **Tailwind V4** | `@theme inline { --color-name: var(--css-var) }` luego `bg-name`. NUNCA `bg-[--var]` |
| **shadcn v4** | NO usar `asChild`. Usar Zod v4 con `z.number()` + `valueAsNumber` |
| **Font** | Inter con `subsets: ["latin", "latin-ext"]` — soporta español completo |
| **Konva** | Siempre `dynamic import` con `ssr: false` |
| **Leaflet** | Siempre `dynamic import` con `ssr: false` (DOM dependency) |
| **React 19** | `renderIcon` usa `createElement` — no crear componentes durante render |
| **Sidebar** | 100% hardcoded en `sidebar.tsx` — NO depende del API de menú |
| **Settings** | Todo admin va dentro de tabs en `/settings` — NO páginas standalone |
| **Empty States** | Toda página con DataTable debe tener `<EmptyState>` cuando `data.length === 0` |

---

## Stack de referencia

| Capa | Librería | Versión |
|---|---|---|
| Framework | Next.js (App Router, standalone) | 16.2.2 |
| UI | React + shadcn/ui v4 | 19.2.4 / 4.1.2 |
| Estilos | Tailwind CSS | 4 |
| Estado | Zustand + TanStack Query v5 | 5.0.12 / 5.96.2 |
| Tablas | TanStack Table v8 | 8.21.3 |
| Forms | React Hook Form + Zod v4 | 7.72.1 / 4.3.6 |
| Canvas | react-konva + konva | 19.2.3 / 10.2.3 |
| Grafos | @xyflow/react | 12.10.2 |
| Charts | Recharts | 3.8.1 |
| Mapas | leaflet + react-leaflet | 1.9.4 / 5.0.2 |
| DB directo (seed) | pg | 8.x |
| Export | xlsx + jspdf + jspdf-autotable | 0.18.5 / 4.2.1 / 5.0.7 |
| Tests | Vitest + happy-dom + Testing Library | 4.1.2 / 20.8.9 / 16.3.2 |

---

## Bug-Fixes Post-Implementación (2026-04-07)

Bugs descubiertos durante revisión de calidad después de completar CP-01 a CP-06.

### BF-01: Hydration Error — `<button>` nested inside `<button>`

**Problema:** `DropdownMenuTrigger` (shadcn v4) renderiza un `<button>`. El componente `DataTable` envolvía un `<Button>` dentro, causando hydration error en React 19.

**Fix:** Removido `<Button>` de dentro de `DropdownMenuTrigger` en `data-table.tsx`. Se aplican estilos inline directamente al trigger.

**Regla:** NUNCA poner `<Button>` dentro de `<DropdownMenuTrigger>` en shadcn v4.

### BF-02: MenuGroupContext Error — Header User Menu

**Problema:** `DropdownMenuLabel` en shadcn v4 usa `MenuPrimitive.GroupLabel` internamente, que REQUIERE un padre `MenuPrimitive.Group`. Sin `DropdownMenuGroup` envolviendo, crashea con "MenuGroupContext not found".

**Fix:** Envuelto todos los `DropdownMenuLabel` en `DropdownMenuGroup` en:
- `src/components/layout/header.tsx`
- `src/components/layout/site-selector.tsx`

**Regla:** SIEMPRE envolver `DropdownMenuLabel` en `DropdownMenuGroup` en shadcn v4.

### BF-03: Sin Logout / Configuración en Header

**Problema:** El menú de usuario del header no tenía opciones de navegación útiles.

**Fix:** Agregados items al dropdown del header:
- "Configuración" → `router.push("/settings")` (icono Building2)
- "Cerrar sesión" → variant destructive (icono LogOut)

### BF-04: Breadcrumbs faltantes

**Fix:** Agregadas entradas `map: "Mapa"` e `imports: "Importación"` al objeto de breadcrumbs en `header.tsx`.

### BF-05: Seed Script — Sites sin endpoint HTTP

**Problema:** No existe endpoint HTTP para crear sucursales. `policies.sites` solo es accesible vía SQL.

**Fix:** Instalado `pg` como devDependency. El seed usa INSERT directo a `policies.sites` con lat/lng de 12 ciudades mexicanas.

### BF-06: Seed Script — Go backend `toNumeric(float64)` bug

**Problema:** pgx v5.7.2 `pgtype.Numeric.Scan(float64)` falla para TODOS los valores float. La API de pólizas es inutilizable para `monthly_payment`.

**Fix/Workaround:** Pólizas se crean vía INSERT directo a `policies.policies`. Reportar como bug al equipo backend Go.

### BF-07: Seed Script — Enum values incorrectos

**Problema:** Los CHECK constraints en migraciones SQL difieren de los ENUM types reales en PostgreSQL. El seed usaba valores incorrectos (`consultation`, `other`, `urgent`).

**Fix:** Corregido a valores reales de `models.go`:
- `ticket_type`: preventive, corrective, emergency, installation, uninstallation, inspection
- `ticket_priority`: low, medium, high, critical
- `ticket_status`: open, assigned, in_progress, on_hold, pending_parts, pending_approval, completed, cancelled

### BF-08: Seed Script — Duplicados en re-ejecución

**Problema:** Re-ejecutar el seed generaba conflictos en unique constraints (`uq_tickets_tenant_number`, `uq_policies_tenant_number`).

**Fix:** Policies y tickets ahora leen el MAX número existente de la DB antes de generar nuevos números secuenciales.

---

## Siguiente Iteración (Propuesta)

| # | Tarea | Prioridad |
|---|---|---|
| CP-04B | Floor Plan Editor — Fase 4B (cámaras + cono de visión) | 🟡 ALTO |
| CP-04C | Floor Plan Editor — Fase 4C (capas, zonas, export PNG) | 🟡 ALTO |
| CP-04D | Floor Plan Editor — Fase 4D (mock data, keyboard shortcuts) | 🟢 MEDIO |
| CP-07 | Importación batch mejorada (soporte para sites) | 🟢 MEDIO |
| CP-08 | Reportar bug Go backend `toNumeric(float64)` y fix | 🟡 ALTO |
