# Plan de Accion v3 — INFRAIX (Abril 2026)

> Documento vivo. Actualizar estado de cada item conforme se complete.
> Criterio de cierre: la mejora es visible en runtime real, no solo en codigo.
> Plan anterior archivado en `.github/planes_completados/PLAN_DE_ACCION_v2.md`.

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
| F1 | Limpieza de Admin Sistema: desvincular de Empresa Demo | **Critica** | **Completada** ✅ |
| F2 | Unhide /cameras y /nvrs — usar configurador en vez de hardcode | **Alta** | **Completada** ✅ |
| F3 | Import Excel: validacion de columnas y UX del dialogo | **Alta** | **Completada** ✅ |
| F4 | Inventory unificado: tabs con funcionalidad de /cameras y /nvrs | **Critica** | **Completada** ✅ |
| F5 | Eliminar "Empresa Demo CCTV" de la base de datos | **Alta** | **Completada** ✅ |
| F6 | Rediseno del tab Servicios y Paquetes | **Media** | Pendiente |
| F7 | Reorden de sidebar por empresa | **Media** | Pendiente |
| F8 | Rediseno completo del tab IA (modulos fijos + secciones) | **Alta** | **Completada** ✅ |
| F9 | Modulo Chatbot (icono en header + panel de chat) | **Media** | Pendiente |
| F10 | Gemini Embedding 2 para analisis de inventario | **Baja** | Pendiente |

---

## Diagnostico previo: roles en la base de datos

### Que hay en la DB actual

| Rol | is_system | tenant_id | Permisos clave | Usuarios |
|-----|-----------|-----------|----------------|----------|
| `super_admin` | **true** | NULL (global) | `admin:global` + 41 permisos de plataforma | `mario_super_admin@gmail.com` |
| `tenant_admin` | **true** | NULL (global) | (no revisado) | Admins de Calimax, Bimbo, etc. |
| `Administrador` | **false** | Empresa Demo CCTV | `users.*`, `roles.*`, `clients.*` (CRUD basico de tenant) | `admin@demo.com` |
| `Operador` | false | Empresa Demo CCTV | (permisos operativos) | `operator@demo.com` |
| `Tecnico` | false | Empresa Demo CCTV | (permisos tecnicos) | `tecnico@demo.com` |
| `Visualizador` | false | Empresa Demo CCTV | (solo lectura) | `viewer@demo.com` |

### Diferencia entre `super_admin` y `Administrador`

| Aspecto | `super_admin` | `Administrador` |
|---------|---------------|-----------------|
| `is_system` | **true** — es rol de plataforma | **false** — es rol de tenant |
| Alcance | Global — ve toda la plataforma | Local — solo su empresa |
| Permiso clave | `admin:global` (acceso total) | CRUD basico (users, roles, clients) |
| Frontend lo detecta como | Admin del Sistema (`hybrid_backoffice`) | Usuario regular de tenant (`tenant_portal`) |
| Puede gestionar empresas | Si | No |

### Estado actual de `admin@demo.com`

- **Rol:** `Administrador` (tenant-scoped, is_system=false)
- **tenant_id:** `550e8400-e29b-41d4-a716-446655440000` (Empresa Demo CCTV)
- **Problema:** El frontend lo trata como usuario de tenant, NO como Admin del Sistema
- **El verdadero super admin es:** `mario_super_admin@gmail.com` (tiene `super_admin` con `is_system=true`)

### Solucion propuesta (F1 + F5)

**Opcion A — Promover `admin@demo.com` a super_admin:**
```sql
-- 1. Asignar rol super_admin a admin@demo.com
INSERT INTO auth.user_roles (user_id, role_id)
VALUES ('750e8400-e29b-41d4-a716-446655440001', '9b613eee-362b-4e41-a034-20514cb64bda');

-- 2. Remover rol Administrador de admin@demo.com
DELETE FROM auth.user_roles
WHERE user_id = '750e8400-e29b-41d4-a716-446655440001'
  AND role_id = '550e8400-e29b-41d4-a716-446655440001';

-- 3. Desvincular de empresa (poner tenant_id NULL)
UPDATE auth.users SET tenant_id = NULL WHERE id = '750e8400-e29b-41d4-a716-446655440001';
```

**Opcion B — Usar `mario_super_admin@gmail.com` como admin y eliminar admin@demo.com:**
Desvincular mario de Empresa Demo CCTV y eliminar el usuario admin@demo.com.

**ADVERTENCIA:** El backend genera el JWT con el `tenant_id` del usuario. Si `tenant_id = NULL`, el backend podria comportarse distinto. Hay que probar que el login siga funcionando despues del cambio.

---

## Fase 1 — Limpieza de Admin del Sistema ✅

**Ejecutado:** Se creo tenant `INFRAIX Platform` (id: `00000000-0000-0000-0000-000000000001`, slug: `infraix-platform`) porque `tenant_id` es NOT NULL en `auth.users`. Se reasigno `mario_super_admin@gmail.com` a este tenant de plataforma.

**Resultado:** mario_super_admin desvinculado de Empresa Demo CCTV. Login funcional con JWT apuntando a INFRAIX Platform.

---

## Fase 2 — Unhide /cameras y /nvrs

### F2-01: Descomentar rutas en runtime-navigation.ts
- **Archivo:** `cctv_web/src/lib/product/runtime-navigation.ts`
- **Problema:** Las entradas `nav-cameras` y `nav-nvrs` estan comentadas como "ocultas temporalmente"
- **Solucion:** Descomentar ambas entradas. Ya tienen `service: "cctv"` y `screenKey: "cameras"` / `"nvrs"` — el configurador de servicios/pantallas controla si se muestran o no por empresa.
- **Impacto:** Empresas con CCTV habilitado veran Camaras y NVR en el sidebar. Si el admin deshabilita esas pantallas en el configurador, desaparecen automaticamente.

---

## Fase 3 — Import Excel: validacion y UX

### F3-01: Plantilla solo con encabezados (sin datos de demo)
- **Archivo:** `cctv_web/src/app/(dashboard)/inventory/quick-import-dialog.tsx`
- **Problema:** Los botones "Plantilla camaras" y "Plantilla NVR" descargan un Excel con 6 filas de datos de ejemplo. Esto confunde al usuario porque parecen datos reales exportados.
- **Solucion:** Las plantillas deben contener SOLO la fila de encabezados (nombres de columnas) sin datos. Asi queda claro que es una plantilla para llenar.

### F3-02: Mostrar solo la plantilla relevante al tipo seleccionado
- **Problema:** Ambos botones (Plantilla camaras + Plantilla NVR) siempre son visibles. El usuario puede presionar el incorrecto por accidente.
- **Solucion:** Mostrar solo el boton de plantilla correspondiente al tipo seleccionado (cameras o nvrs).

### F3-03: Validacion de columnas del Excel importado
- **Problema:** Se puede importar cualquier Excel sin relacion con camaras/NVRs. Si no hay columna "nombre" se generan registros "Camera 1 (importado)", "Camera 2 (importado)", etc.
- **Solucion:**
  1. Al parsear el Excel, comparar los nombres de las columnas del archivo con las columnas esperadas
  2. Columnas esperadas para camaras: `nombre`, `codigo`, `tipo`, `modelo`, `ip`, `zona`, `ubicacion`, `serie`, `estado`, `notas` (+ variantes en ingles)
  3. Si NINGUNA columna coincide → rechazar con error: "El archivo no contiene columnas reconocidas para [camaras/NVR]"
  4. Si ALGUNAS coinciden → importar solo las que coinciden, ignorar las extras
  5. Mostrar mensaje: "X de Y columnas reconocidas. Columnas ignoradas: [lista]"

### F3-04: Preview antes de guardar (en vez de "Limpiar importados")
- **Problema:** Los datos se importan directamente. El boton "Limpiar importados" permite borrar despues, pero no hay preview.
- **Solucion:**
  1. Al seleccionar archivo, parsear y mostrar una tabla preview con las primeras N filas
  2. Indicar cuantos registros se importaran y que columnas se reconocieron
  3. Boton "Confirmar importacion" para guardar
  4. Si el usuario cancela, no se guarda nada
  5. Mantener "Limpiar importados" como opcion de deshacer post-importacion

### F3-05: Mostrar columnas esperadas en el dialogo
- **Problema:** El usuario no sabe que columnas debe tener su Excel.
- **Solucion:** Agregar un bloque informativo debajo del selector de tipo que muestre la lista de columnas esperadas. Ejemplo:
  ```
  Columnas esperadas para Camaras:
  nombre, codigo, tipo, modelo, ip, zona, ubicacion, serie, estado, notas
  ```

---

## Fase 4 — Inventory unificado con tabs funcionales

### F4-01: Objetivo general
- **Problema:** `/inventory` actualmente muestra datos mergeados (API + localStorage) en tablas simples. Las pantallas `/cameras` y `/nvrs` tienen funcionalidad mas rica (crear manual, stats, filtros, exportar, etc.) pero son paginas separadas.
- **Solucion:** Unificar en `/inventory` la funcionalidad de ambas pantallas con tabs:
  - Tab "Camaras" → tabla con funcionalidad de `/cameras` (CRUD, stats, filtros, busqueda, exportar)
  - Tab "Servidores NVR" → tabla con funcionalidad de `/nvrs` (CRUD, stats, filtros, busqueda, exportar)
  - Boton "Importar Excel" dentro de cada tab que importa segun la tab activa
  - Boton "Nueva camara" / "Nuevo NVR" dentro de cada tab para alta manual con modal (incluye foto opcional)

### F4-02: Stats por tab
- Tab Camaras: mostrar stats de camaras (total, activas, por tipo, conteo habilitado)
- Tab NVR: mostrar stats de NVR (total, activos, canales declarados, almacenamiento)

### F4-03: CRUD manual con foto
- Modal de creacion/edicion de camara: incluir campo de imagen (file picker → base64/localStorage como workaround GAP-08)
- Modal de creacion/edicion de NVR: incluir campo de imagen

### F4-04: Importar Excel por tab
- Si la tab activa es "Camaras" → el boton "Importar Excel" abre el dialogo pre-seleccionado en tipo "cameras"
- Si la tab activa es "NVR" → pre-seleccionado en tipo "nvrs"
- Eliminaria la confusion de tener que elegir tipo manualmente

---

## Fase 5 — Eliminar Empresa Demo CCTV ✅

**Ejecutado:** Limpieza masiva de 32 FK constraints (NO ACTION) en tablas de inventory, tickets, intelligence, policies, billing, collection y storage. Luego `DELETE FROM public.tenants` con CASCADE eliminando los 5 usuarios demo y sus roles/sessions.

**Resultado:** Empresa Demo CCTV eliminada. Tenants restantes: Bimbo, Calimax, Soriana, INFRAIX Platform.

---

## Fase 6 — Rediseno del tab Servicios y Paquetes

### F6-01: Simplificar layout y reducir scroll

**Archivo:** `cctv_web/src/app/(dashboard)/settings/tabs/services-packages-tab.tsx`

**Problema:** El tab actual require demasiado scroll y la logica de servicios + pantallas individuales en paneles expandibles confunde al usuario. Demasiada informacion a la vista.

**Solucion:**
1. Reorganizar en dos columnas: lista de empresas (izquierda) + editor compacto (derecha)
2. Agrupar los servicios por modulo en secciones colapsables (como ConfAITab)
3. Mostrar solo el plan y los servicios principales sin expandir pantallas por defecto
4. Boton explicito "Ver pantallas" por servicio si el admin quiere granularidad fina
5. Stats cards reducidos: solo total empresas + distribucion de planes

**Estado:** Pendiente

---

## Fase 7 — Reorden de sidebar por empresa

### F7-01: Determinar si tab separado o merge en Servicios

**Problema:** El tab "Plantilla menu" actual (`menu-templates-tab.tsx`) gestiona CRUD de plantillas de menu + asignar items + asignar tenants. Pero ahora que Servicios ya controla que pantallas ve cada empresa, la unica funcionalidad pendiente del tab Menu es el **orden de items en el sidebar por empresa**.

**Opciones:**
- **A) Merge en Servicios:** Agregar un mini-panel de drag-and-drop para reordenar items del sidebar dentro del tab Servicios, al final del editor de cada empresa.
- **B) Tab simplificado:** Mantener tab "Menu" pero simplificarlo a SOLO ordenamiento (sin CRUD de plantillas).

**Solucion elegida:** Pendiente de decision del usuario.

### F7-02: Implementar reordenamiento drag-and-drop

**Funcionalidad:**
1. Mostrar la lista de items del sidebar de la empresa seleccionada
2. Agrupar por modulo/seccion
3. Drag-and-drop para cambiar orden de modulos y orden de items dentro de cada modulo
4. Guardar el orden via endpoint existente (`replaceTemplateItems`)

**Estado:** Pendiente

---

## Fase 8 — Rediseno completo del tab IA ✅

### F8-01: Layout basado en modulos fijos (estilo ConfAITab)

**Archivo:** `cctv_web/src/app/(dashboard)/settings/tabs/intelligence-tab.tsx`

**Problema:** El tab actual es un CRUD generico de modelos IA con DataTable + grid de prompt templates. No tiene estructura por modulo, no diferencia entre chatbot y analizador, y el UX no es intuitivo.

**Referencia de diseno:** `referencia_desing/tabs/ConfAITab.tsx`

**Solucion:**
1. Layout 1/3 + 2/3: panel izquierdo con lista de modulos fijos, panel derecho con editor en secciones colapsables
2. **Modulos fijos** (no creados por usuario):
   - `chatbot_assistant` — Asistente CCTV (chatbot con acceso a DB, icono en header)
   - `camera_analyzer` — Analisis de infraestructura (Gemini Embedding 2 para detalles de camaras/inventario)
3. Card de resumen: proveedor, modelo, estado de API key, ultima actualizacion
4. Seccion "Motor IA": toggle proveedor (Google Gemini / Anthropic), selector de modelo, campo API key con show/hide
5. Seccion "Reglas del modulo": configuracion especifica por modulo (chatbot: activo/avanzado/rate limit; analyzer: temperatura/embeddings)
6. Seccion "Avanzado": temperatura slider, max tokens
7. Seccion "Prueba": chat de prueba para chatbot; (placeholder para analyzer)
8. Boton "Guardar cambios" + toggle activar/desactivar modulo

### F8-02: Proveedores y modelos soportados

```
Google Gemini:
  - gemini-2.5-flash (recomendado)
  - gemini-2.5-pro
  - gemini-2.0-flash
  - gemini-2.0-flash-lite

Anthropic:
  - claude-sonnet-4-20250514
  - claude-3-5-haiku-latest
```

### F8-03: API key segura

- La API key se almacena via el endpoint existente `PUT intelligence/models/:id` (campo `api_key_encrypted`)
- El backend se encarga del cifrado
- El frontend NUNCA debe hardcodear API keys en archivos commiteados
- Mostrar indicador "Registrada" / "Sin registrar" sin exponer el valor

### F8-04: Integracion con TanStack Query

- Reutilizar queries existentes: `listModelConfigs`, `updateModelConfig`, `createModelConfig`
- Cada modulo se mapea a un `ModelConfig` existente (buscar por nombre o campo `settings.module_key`)
- Si no existe config para un modulo, mostrar estado "Sin configurar" con boton para inicializar

**Estado:** Pendiente

---

## Fase 9 — Modulo Chatbot (icono en header)

### F9-01: Icono de chat en el header global
- Icono tipo `MessageCircle` en la barra de header (junto a notificaciones/perfil)
- Al clickear, abre un panel lateral (sheet) con interfaz de chat
- Solo visible si el modulo `chatbot_assistant` esta activo para el tenant

### F9-02: Interfaz de chat
- Historial de mensajes (user/assistant)
- Input con envio por Enter
- Indicador de "escribiendo..."
- Conexion al backend via endpoint de IA existente o futuro

### F9-03: Acceso a datos del sistema
- El chatbot puede responder preguntas sobre inventario, camaras, NVRs, tickets
- Depende de endpoints backend (posible GAP futuro)

**Estado:** Pendiente

---

## Fase 10 — Gemini Embedding 2 para analisis de inventario

### F10-01: Investigacion de Gemini Embedding 2
- Documentacion: https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini-embedding
- Modelo: `gemini-embedding-exp-03-07` o version estable
- Uso: generar embeddings de detalles de camaras (modelo, marca, specs, PDF de fichas tecnicas)
- Busqueda semantica sobre el inventario

### F10-02: Integracion en inventario
- Boton "Analizar con IA" en detalle de camara/NVR
- Subida de PDF de ficha tecnica → embedding → busqueda semantica
- Requiere backend que soporte embedding storage (posible GAP)

**Estado:** Pendiente (requiere F8 + investigacion backend)

---

## GAPs de backend relevantes

| GAP | Impacto | Estado |
|-----|---------|--------|
| GAP-05 | Sin switch-company — JWT queda fijo al tenant del login | Activo |
| GAP-08 | Sin upload de avatar/fotos al backend | Workaround localStorage |
| GAP-09 | /inventory/summary 500 sin tenant | Guard EmptyState aplicado |

---

## Criterio de cierre

Una fase se cierra SOLO si:
1. El cambio es visible en `http://localhost:3011`
2. Sin errores de consola relacionados
3. Build exitoso
4. Commit descriptivo realizado
