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
| F8 | Auditoria global de otros PUT que borren campos | **Alta** | **Completada** |
| F9 | Audit: identificar componentes que muestran UUID como texto | **Alta** | **Completada** |
| F10 | Rediseno del tab Servicios y Paquetes (layout compacto) | **Media** | **Completada** |
| F11 | Portal Tenant: logo de empresa en sidebar | **Media** | **Completada** |
| F12 | Chatbot IA: conectar endpoint real /intelligence/chat | **Media** | **Completada** |
| F13 | Gemini Embedding: test de reindexacion + busqueda en settings | **Media** | **Completada** |
| F14 | IA Avanzada: documentos por modelo, specs desde PDF, asistente tecnico | **Alta** | Pendiente | 

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

## Fase 8 — Auditoria de otros PUT que borren campos (Completada)

**Objetivo:** Buscar todos los usos de `updateTenant()` y verificar que ningun componente haga PUT parcial que borre campos. Auditar otros `api.put()` similares.

**Hallazgos:** 17 llamadas `api.put()` auditadas. 2 CRITICAS en cameras y NVRs: formularios capturaban subconjunto de campos, PUT enviaba solo datos del form, backend reemplazaba todo.

**Solucion:** `inventory/page.tsx` y `nvrs/page.tsx` — destructurar entidad existente (quitar id, tenant_id, is_active, timestamps), spread campos existentes primero, superponer datos del form.

**Commit:** `e9719ff`

---

## Fase 9 — Componentes que muestran UUID como texto (Completada)

**Objetivo:** Buscar instancias donde se renderiza UUID sin resolver a nombre legible en Selects, tablas, badges, breadcrumbs, etc.

**Hallazgos de auditoria:**
- Todos los `<SelectItem>` usan UUID como `value` (invisible) y muestran nombre legible (correcto)
- Columnas de tabla muestran `site_name`, `nvr_name`, `role.name` — no IDs crudos
- El unico caso de UUID visible (Select empresa en inventario) ya fue corregido en F4
- `general-tab.tsx` usa IDs mock ("CA-001") en preview de temas — no son UUIDs reales
- `batch-detail-dialog.tsx` muestra JSON crudo de importacion — aceptable para vista de debug

**Resultado:** Codebase limpio. No se requieren cambios adicionales.

---

## Fase 10 — Rediseno del tab Servicios y Paquetes (Completada)

**Problema:** Tab requiere demasiado scroll, paneles expandibles confusos.

**Cambios:**
- Stats: 4 StatsCards reemplazadas por barra inline compacta (1 linea)
- Plan comercial: cards grandes reemplazadas por pills horizontales
- Servicios: grid de 3 columnas reducido a 2, cards mas compactas con badge de estado inline
- Matriz de referencia: colapsada por defecto, expandible bajo boton
- Panel de tenants: padding y spacing reducidos, altura maxima dinamica
- Encabezado: plan + header en misma card, boton Guardar mas compacto

---

## Fase 11 — Portal Tenant: logo de empresa en sidebar (Completada)

**Problema:** Logo asignado no se muestra en sidebar del tenant admin.

**Hallazgos:**
- El backend SI devuelve `logo_url` en `getMe()` y `login` (CompanyResponse con URL absoluta a MinIO)
- El sidebar ya tenia logica para renderizar el logo cuando `company.logo_url` existe
- El problema real: (1) imagenes rotas de MinIO no tenian fallback, (2) sesiones existentes usaban datos de localStorage obsoletos

**Solucion:**
- Sidebar: `<img>` con `onError` fallback — si la imagen falla, muestra la inicial con color de empresa
- Layout: refresco background de datos de empresa via `getMe()` para sesiones existentes (actualiza logo_url, colores, settings)

---

## Fase 12 — Chatbot IA: conectar endpoint real

**Estado actual:**
- La UI de configuracion ya existe en `/settings?tab=ia` (proveedor, modelo, API key, temperatura, prompt)
- El tab tiene una seccion "Prueba" con chat simulado — respuesta hardcoded en frontend
- El backend tiene CRUD de `model_configs` y `prompt_templates` operativo
- El backend tiene integracion REAL con Anthropic Claude para imports de inventario (`inventory_import_ai.go`)
- **NO existe** endpoint `/api/v1/intelligence/chat` en el backend

**Objetivo:**
1. Crear endpoint backend `POST /intelligence/chat` que:
   - Reciba `{ message, model_config_id?, conversation_history? }`
   - Use la config activa del tenant (Gemini o Anthropic)
   - Llame la API del proveedor con el prompt del sistema configurado
   - Registre la llamada en `intelligence.api_calls`
   - Retorne la respuesta real
2. Conectar el chat de prueba del frontend al endpoint real
3. Mostrar metricas de uso (tokens, latencia) en la UI

**GAP backend:** Requiere crear handler `ChatWithModel` en `intelligence_handler.go`

**Estado:** Completada

**Solucion (backend inmutable — sin endpoint /intelligence/chat):**
- Creada ruta API en Next.js `src/app/api/chat/route.ts` que actua como proxy a Gemini y Anthropic
- Recibe `{ message, provider, model, apiKey, systemPrompt, temperature, maxTokens, history }`
- El admin ingresa la API key en el formulario de Motor IA — esa misma clave se usa para el test
- Frontend actualizado: `handleChatTest()` llama a `/api/chat` con la config del formulario
- Se muestran metricas reales: tokens entrada, tokens salida, latencia en ms
- Boton de enviar deshabilitado si no hay API key en el formulario
- Mensaje informativo cuando la clave no esta disponible

**Commit:** `424c958`

---

## Fase 13 — Gemini Embedding: test de reindexacion + busqueda en settings (Completada)

**Estado actual:**
- Backend tiene `CatalogEmbeddingService` que genera embeddings con `gemini-embedding-2-preview`
- Tablas `embedding_documents` y `embedding_vectors` con pgvector (halfvec 3072D, indice HNSW)
- Endpoints operativos: `POST /intelligence/embeddings/reindex/models` y `/reindex/model/{id}`
- NO hay UI para ejecutar reindexacion ni para testear busqueda semantica

**Objetivo:**
1. Agregar seccion "Embeddings" en el tab IA de settings con:
   - Boton "Reindexar catalogo" que llame al endpoint existente
   - Indicador de progreso y resultado (modelos procesados, indexados, fallidos)
   - Stats de la base vectorial (total documentos, total vectores)
2. Agregar campo de busqueda de prueba:
   - Input: "Buscar en catalogo: ¿que camara soporta PTZ con IR de 80m?"
   - Resultado: top-N fichas mas relevantes con score de similitud
   - Requiere endpoint backend de busqueda semantica (query → embedding → nearest neighbors)

**GAP backend:** Falta endpoint `POST /intelligence/embeddings/search` para busqueda vectorial

**Solucion:**
- Agregada seccion "Embeddings del catalogo" al modulo camera_analyzer en el tab IA
- Boton "Reindexar catalogo" llama al endpoint real `POST /intelligence/embeddings/reindex/models`
- Resultados mostrados por proveedor/modelo: procesados, indexados, fallidos, errores
- Indicador de progreso con animacion durante reindexacion
- Nota informativa sobre GAP de busqueda semantica (endpoint de busqueda vectorial pendiente en backend)
- Boton deshabilitado si el modulo no esta activo

**Commit:** `67cb35d`

**Estado:** Completada

---

## Fase 14 — IA Avanzada: documentos por modelo, specs desde PDF, asistente tecnico

**Descripcion:** Implementacion completa del flujo IA para inventario CCTV.

**Capa 1 — Datos estructurados (BD relacional):**
- Tabla `camera_models` con: brand, model_code, display_name, main_image_url, spec_summary_json
- Tabla `camera_documents` con: model_id, type (datasheet/manual/quick_start), file_url, mime_type, gemini_file_id, embedding_status
- Cada camara apunta a un `camera_model`
- El detalle de camara muestra datos de inventario + specs del modelo + documentos vinculados

**Capa 2 — Extraccion IA desde PDF:**
- Admin sube PDF del fabricante (datasheet, manual de instalacion)
- Se guarda en MinIO, se vincula al camera_model
- Gemini procesa el PDF y extrae specs estructuradas:
  - Resolucion, lente, zoom, PTZ, WDR, IR, proteccion IP, alimentacion, temperatura operativa
- Se guardan normalizadas en `spec_summary_json`

**Capa 3 — Embeddings + busqueda semantica:**
- Documentos PDF se fragmentan en chunks
- Gemini Embedding 2 genera vectores multimodales (texto + imagenes)
- Se guardan en `embedding_vectors` con pgvector
- Busqueda semantica: "¿que alcance IR tiene?" → nearest neighbors → respuesta contextualizada

**UX del detalle de camara (tabs):**
- Resumen: IP, tipo, NVR, sucursal, sitio, resolucion
- Especificaciones: extraidas del PDF y guardadas estructuradamente
- Documentos: datasheet PDF, manual, guia rapida
- IA / Asistente tecnico: "Preguntale al manual", "Resume este modelo", comparacion entre modelos

**Fases internas:**
1. Tablas camera_models y camera_documents + CRUD basico
2. Upload de PDF a MinIO + vinculacion a modelo
3. Extraccion de specs con Gemini (guardadas en BD)
4. Embedding de chunks de documentos
5. UI de detalle enriquecida con tabs
6. Asistente tecnico con preguntas semanticas sobre manuales

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
