# Plan de Accion v4 — INFRAIX (Mayo 2026)

> Documento vivo. Actualizar estado de cada item conforme se complete.
> Criterio de cierre: la mejora es visible en runtime real, no solo en codigo.
> Plan anterior archivado en `.github/planes_completados/PLAN_DE_ACCION_v3.md`.

---

## Politica de cierre de fase (OBLIGATORIO)

Al terminar cualquier fase:
1. `npm run build` — sin errores TypeScript
2. Verificacion visual en `http://localhost:3011`
3. Commit: `git add -A && git commit -m "fase(FX): descripcion corta del cambio"`
4. Actualizar el estado de la fase en este documento

---

## Resumen de fases

| Fase | Nombre | Prioridad | Estado |
|------|--------|-----------|--------|
| F1 | Correccion critica: PUT de servicios borra logo y colores de empresa | **Critica** | **Completada** |
| F2 | Import Excel: modal mas grande y preview legible | **Alta** | **Completada** |
| F3 | Persistencia de datos importados en /cameras y /nvrs | **Critica** | **Completada** |
| F4 | UUID visible en Select de Empresa (inventory) | **Alta** | **Completada** |
| F5 | Logos de empresa en CompanySelector del header | **Media** | **Completada** |
| F6 | Ocultar tab Plantillas de menu en Configuracion | **Media** | **Completada** |
| F7 | Dashboard: stats por empresa para super_admin | **Alta** | **Completada** |
| F8 | Auditoria global de otros PUT que borren campos | **Alta** | Pendiente |
| F9 | Audit: identificar componentes que muestran UUID como texto | **Alta** | Pendiente |
| F10 | Rediseno del tab Servicios y Paquetes (layout compacto) | **Media** | Pendiente |
| F11 | Portal Tenant: logo de empresa en sidebar | **Media** | Pendiente |
| F12 | Modulo Chatbot IA (icono en header + panel lateral) | **Media** | Pendiente |
| F13 | Gemini Embedding 2 para analisis de inventario | **Baja** | Pendiente |

---

## Fase 1 — Correccion critica: PUT de servicios borra logo y colores (Completada)

**Archivo:** `services-packages-tab.tsx`

**Problema:** Al guardar cambios en Servicios, el mutation llamaba `updateTenant()` con solo `{ name, settings }`. El backend usa PUT (reemplazo completo), por lo que `logo_url`, `primary_color`, `secondary_color`, `tertiary_color`, `domain`, `subscription_plan`, `max_users`, `max_clients` se borraban.

**Solucion:** Incluir todos los campos existentes del tenant en el body del PUT.

---

## Fase 2 — Import Excel: modal mas grande y preview legible (Completada)

**Archivo:** `quick-import-dialog.tsx`

**Cambios:**
- Modal: `max-w-lg` a `max-w-4xl`
- Tabla preview: `max-h-32` a `max-h-72`, headers sticky
- Celdas sin truncamiento, whitespace-nowrap con scroll horizontal
- Muestra 5 filas de preview completas

---

## Fase 3 — Persistencia de datos importados en /cameras y /nvrs (Completada)

**Archivos:** `cameras/page.tsx`, `nvrs/page.tsx`

**Problema:** Datos importados por Excel se guardaban en localStorage pero /cameras y /nvrs solo leian API real.

**Solucion:** Ambas paginas fusionan datos del API con datos locales (`getLocalInventory()`).

---

## Fase 4 — UUID visible en Select de Empresa (Completada)

**Archivo:** `inventory/page.tsx`

**Problema:** Select de Empresa mostraba UUID crudo cuando tenants no habian cargado.

**Solucion:** Render personalizado en SelectValue que resuelve nombre del tenant.

---

## Fase 5 — Logos de empresa en CompanySelector (Completada)

**Archivo:** `company-selector.tsx`

**Problema:** Dropdown mostraba icono generico Building2, no logo real.

**Solucion:** Si `logo_url` existe, renderizar `<img>` en trigger y en items del dropdown.

---

## Fase 6 — Ocultar tab Plantillas de menu (Completada)

**Archivo:** `settings/page.tsx`

**Problema:** Tab confuso, UX solapada con Servicios.

**Solucion:** Campo `hidden: true` en definicion del tab. Filtrado en `visibleTabs`.

---

## Fase 7 — Dashboard: stats por empresa para super_admin (Completada)

**Archivos:** `dashboard.ts`, `cameras.ts`, `nvrs.ts`, `dashboard/page.tsx`

**Problema:** Cuando el super_admin seleccionaba una empresa en el header, el dashboard seguia mostrando todos los stats en cero. El backend usa `GetEffectiveTenantID()` que soporta override via `?tenant_id=X`, pero el frontend nunca pasaba ese parametro.

**Solucion:**
- Funciones API (`getDashboardSummary`, `getDashboardTicketStats`, `getTicketsTrend`, `getPolicyStats`, `getCameraStats`, `getNvrStats`) ahora aceptan `tenantId?: string | null` y lo envian como `?tenant_id=X`.
- Dashboard page calcula `overrideTenantId` basado en si es `hybrid_backoffice` + empresa seleccionada.
- Todas las queries incluyen `overrideTenantId` en queryKey para invalidacion correcta de cache.
- Corregidas tambien las paginas `/cameras`, `/nvrs` e `/inventory` que pasaban la funcion directamente como `queryFn` sin wrapper.

---

## Fase 8 — Auditoria de otros PUT que borren campos

**Objetivo:** Buscar todos los usos de `updateTenant()` y verificar que ningun componente haga PUT parcial que borre campos. Auditar otros `api.put()` similares.

**Estado:** Pendiente

---

## Fase 9 — Componentes que muestran UUID como texto

**Objetivo:** Buscar instancias donde se renderiza UUID sin resolver a nombre legible en Selects, tablas, badges, breadcrumbs, etc.

**Estado:** Pendiente

---

## Fase 10 — Rediseno del tab Servicios y Paquetes

**Problema:** Tab requiere demasiado scroll, paneles expandibles confusos.

**Solucion propuesta:** Layout dos columnas, servicios por modulo colapsables, stats reducidos.

**Estado:** Pendiente

---

## Fase 11 — Portal Tenant: logo de empresa en sidebar

**Problema:** Logo asignado no se muestra en sidebar del tenant admin.

**Estado:** Pendiente

---

## Fase 12 — Modulo Chatbot IA

**Descripcion:** Icono en header con panel lateral de chat. Conecta con backend IA.

**Estado:** Pendiente

---

## Fase 13 — Gemini Embedding 2 para analisis de inventario

**Descripcion:** Embeddings semanticos para busqueda avanzada de inventario.

**Estado:** Pendiente

---

## GAPs de backend relevantes

| GAP | Impacto | Estado |
|-----|---------|--------|
| GAP-01 | Sin CRUD de sucursales (POST/PUT/DELETE /sites) | Activo |
| GAP-04 | Sin refresh token - 401 redirige a login | Activo |
| GAP-05 | Sin switch-company - JWT queda fijo al tenant del login | Activo |
| GAP-08 | Sin upload de avatar/fotos | Workaround localStorage |
| GAP-09 | /inventory/summary 500 sin tenant | Guard EmptyState aplicado |

---

## Criterio de cierre

Una fase se cierra SOLO si:
1. El cambio es visible en `http://localhost:3011`
2. Sin errores de consola relacionados
3. Build exitoso
4. Commit descriptivo realizado
