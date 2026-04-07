# 05 — Side Menu Propuesto

> Fecha: 2026-04-05
> Estado: ~~PROPUESTA INICIAL~~ → **ARCHIVADO — Sidebar fue reescrito completamente**
>
> ⚠️ **NOTA (CP-06 cleanup):** Este documento está OBSOLETO. El sidebar actual está 100% hardcodeado
> en `src/components/layout/sidebar.tsx` usando `buildMenu()` con arrays estáticos. NO se usa
> la API de menú dinámico (`GET /menu`). La estructura real tiene 3 secciones: RESUMEN (Dashboard, Mapa),
> CCTV (Cámaras, NVRs, Inventario, Tickets, Pólizas, SLA, Planos, Mapa, Importación),
> OPERACIONES (Topología, Inteligencia IA), y ADMINISTRACIÓN colapsable (Usuarios, Empresas, Roles, Tema, Storage).
> Consultar directamente `sidebar.tsx` para la estructura vigente.

---

## Objetivo

Definir la estructura del menú lateral de `symticketscctv-next`, basándose en:
- Los módulos funcionales identificados en el backend (144 endpoints).
- La estructura de menú dinámico de `core-associates`.
- Los features del app Flutter (`webcctv_frontend`).

---

## Mecanismo de Menú

| Aspecto | Decisión | Evidencia |
|---|---|---|
| **Fuente de menú** | API: `GET /api/v1/menu` → retorna árbol de items del usuario autenticado | VERIFICADO en main.go línea 178: `menu.GET("", menuHandler.GetMenu)` |
| **Store** | `menu-store.ts` (Zustand) — carga al inicio, cachea | Patrón de `core-associates/src/stores/menu-store.ts` |
| **Permisos** | Backend filtra items por rol/permisos del user. Frontend muestra lo que recibe. | VERIFICADO: endpoint `GET /menu` retorna menú personalizado |
| **Personalización** | Admin puede configurar menú via `/menu` CRUD (23 endpoints) | VERIFICADO en main.go |
| **Iconos** | Mapeo `icon_name: string → LucideIcon` via `getIcon()` | Patrón de `core-associates` |
| **Temas** | CSS variables cargadas desde `/settings/theme` | VERIFICADO endpoint existe |

---

## Estructura Propuesta

> Esta es la **propuesta de configuración por defecto** para un tenant nuevo.  
> El admin puede reordenar, ocultar y añadir items via el CRUD de menú.

```
📊 RESUMEN
├── Dashboard                → /dashboard            (dashboard endpoints)
├── Mapa de Sucursales       → /maps                 (clients + sites + geocoding)
└── Reportes                 → /reports              (dashboard/reports endpoints)

🎥 OPERACIÓN CCTV
├── Inventario
│   ├── NVR                  → /inventory/nvr        (inventory-nvr endpoints)
│   ├── Cámaras              → /inventory/cameras    (inventory-cameras endpoints)
│   ├── Importación Masiva   → /inventory/import     (inventory-import endpoints)
│   └── Resumen              → /inventory/summary    (inventory-summary endpoint)
├── Tickets                  → /tickets              (tickets endpoints)
│   ├── Lista                → /tickets
│   ├── Crear Ticket         → /tickets/new
│   └── [Detalle]            → /tickets/[id]
└── Mantenimiento Preventivo → /maintenance          ⚠️ GAP: no hay endpoint

📋 CONTRATOS
├── Pólizas                  → /policies             (policies endpoints)
│   ├── Lista                → /policies
│   └── [Detalle]            → /policies/[id]
├── SLA                      → /sla                  (sla_definitions endpoints)
│   ├── Lista                → /sla
│   └── [Detalle]            → /sla/[id]
└── Clientes                 → /clients              (clients endpoints)

🏢 INFRAESTRUCTURA
├── Sucursales (Sites)       → /infrastructure/sites          ⚠️ GAP: CRUD parcial
├── Áreas                    → /infrastructure/areas          ⚠️ GAP: CRUD parcial
├── Planos de Piso           → /infrastructure/floor-plans    (floor-plans endpoints)
└── Topología de Red         → /infrastructure/topology       ⚠️ NUEVO: sin endpoint

⚙️ ADMINISTRACIÓN
├── Usuarios                 → /admin/users          (users endpoints)
├── Roles                    → /admin/roles          (roles endpoints)
├── Menú                     → /admin/menu           (menu endpoints)
├── Temas                    → /admin/themes         (settings/theme endpoints)
├── Almacenamiento           → /admin/storage        (storage endpoints)
├── Modelos IA               → /admin/ai-models      (intelligence endpoints)
└── Configuración            → /admin/settings       (settings endpoints)

🔧 SISTEMA (super-admin)
├── Tenants                  → /system/tenants       (tenants endpoints)
├── Configuración Global     → /system/config        ⚠️ GAP: sin endpoint claro
└── Auditoría                → /system/audit         ⚠️ GAP: sin endpoint
```

---

## Mapeo de Ítems a Endpoints del Backend

| Ítem de Menú | Ruta Next.js | Endpoint(s) Principal(es) | Estado |
|---|---|---|---|
| Dashboard | `/dashboard` | `GET /dashboard/summary`, `GET /dashboard/stats/by-*` | ✅ VERIFICADO |
| Mapa de Sucursales | `/maps` | `GET /clients` + relación a sites | ⚠️ PARCIAL (no hay endpoint de sites listado con coordenadas dedicado) |
| Reportes | `/reports` | `GET /dashboard/reports/*` | ✅ VERIFICADO |
| Inventario NVR | `/inventory/nvr` | `GET /inventory/nvr`, `POST`, `PUT`, `DELETE` | ✅ VERIFICADO |
| Inventario Cámaras | `/inventory/cameras` | `GET /inventory/cameras`, `POST`, `PUT`, `DELETE` | ✅ VERIFICADO |
| Importación Masiva | `/inventory/import` | `POST /inventory/import/preview`, `POST /inventory/import` | ✅ VERIFICADO |
| Resumen Inventario | `/inventory/summary` | `GET /inventory/summary` | ✅ VERIFICADO (main.go) |
| Tickets | `/tickets` | `GET /tickets`, `POST`, `PUT`, notas, fotos | ✅ VERIFICADO |
| Mantenimiento | `/maintenance` | *Ninguno* | ⚠️ GAP |
| Pólizas | `/policies` | `GET /policies`, `POST`, `PUT`, `DELETE`, `/coverages` | ✅ VERIFICADO (main.go) |
| SLA | `/sla` | `GET /sla`, `POST`, `PUT`, `DELETE` | ✅ VERIFICADO (main.go) |
| Clientes | `/clients` | `GET /clients`, `POST`, `PUT` | ✅ VERIFICADO |
| Sucursales | `/infrastructure/sites` | *No hay CRUD dedicado* | ⚠️ GAP |
| Áreas | `/infrastructure/areas` | *No hay CRUD dedicado* | ⚠️ GAP |
| Planos de Piso | `/infrastructure/floor-plans` | `GET /floor-plans/sites`, `GET /floor-plans/:id`, `POST /floor-plans` | ✅ VERIFICADO (main.go) |
| Topología | `/infrastructure/topology` | *Ninguno* | ⚠️ NUEVO |
| Usuarios | `/admin/users` | `GET /users`, `POST`, `PUT`, `DELETE` | ✅ VERIFICADO |
| Roles | `/admin/roles` | `GET /roles`, `POST`, `PUT`, `DELETE`, `GET /permissions` | ✅ VERIFICADO |
| Menú | `/admin/menu` | `GET /menu`, `POST`, `PUT`, `DELETE`, reorder, toggle | ✅ VERIFICADO |
| Temas | `/admin/themes` | `GET /settings/theme`, `PUT /settings/theme` | ✅ VERIFICADO |
| Almacenamiento | `/admin/storage` | `POST /storage/upload`, `GET /storage/*`, `DELETE` | ✅ VERIFICADO |
| Modelos IA | `/admin/ai-models` | `GET /intelligence/*`, `POST /intelligence/reindex` | ✅ VERIFICADO |
| Configuración | `/admin/settings` | `GET /settings`, `PUT /settings` | ✅ VERIFICADO |
| Tenants | `/system/tenants` | `GET /tenants`, `POST`, `PUT`, `DELETE`, stats | ✅ VERIFICADO |
| Config Global | `/system/config` | *No hay endpoint específico* | ⚠️ GAP |
| Auditoría | `/system/audit` | *No hay endpoint* | ⚠️ GAP |

---

## Selector de Contexto (Header / Sidebar Superior)

```
┌─────────────────────────────────────────┐
│  🏢 Acme Corp (tenant)                  │ ← Selector tenant (super-admin)
│  📍 Sucursal Centro  ▾                  │ ← Selector de sucursal (site)
│  ─────────────────────                  │
│  📊 Dashboard                           │
│  ...                                    │
└─────────────────────────────────────────┘
```

- **Selector tenant:** Visible solo para super-admin. Usa `POST /auth/login` → `companies[]`.
- **Selector sucursal (site):** Filtra inventario, tickets, dashboard por sucursal. Es un filtro UI, no cambia header HTTP.

---

## Notas

1. **El menú NO es hardcoded.** Se carga de la API. Esta estructura es la propuesta para el "seed" inicial de configuración.
2. **La jerarquía del menú soporta:** items tipo `link`, tipo `section` (grupo sin enlace), tipo `separator`.
3. **Los ítems marcados ⚠️ GAP** necesitan decisiones previas documentadas en `07_API_GAPS_Y_PLACEHOLDERS.md`.
4. **Los permisos determinan visibilidad.** Un usuario con rol "operador" no verá "Sistema" ni "Administración" (el backend ya filtra en `/menu/user`).
