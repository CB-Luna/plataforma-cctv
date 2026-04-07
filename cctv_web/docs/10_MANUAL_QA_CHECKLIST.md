# 10 — Manual QA Checklist: SyMTickets CCTV Next.js

> Fecha: 2026-04-05 | Versión: V1-RC1
> Precondición global: Backend Go corriendo en `localhost:8087`, BD poblada con datos de seed.
> Credenciales de prueba: `admin@demo.com` / `Password123!`
> Tenant: `550e8400-e29b-41d4-a716-446655440000`
> Severidades: 🔴 Crítica | 🟡 Alta | 🟢 Media | ⚪ Baja

---

## QA-01: Login

| Campo | Valor |
|---|---|
| Precondiciones | App corriendo en `localhost:3000`, sin sesión activa |
| Pasos | 1. Ir a `localhost:3000` <br> 2. Verificar redirect automático a `/login` <br> 3. Ingresar `admin@demo.com` / `Password123!` <br> 4. Click "Iniciar sesión" |
| Resultado esperado | Redirect a `/select-company` (si multi-tenant) o `/dashboard` (si single-tenant). Cookie `access_token` presente |
| Si falla | 🔴 Crítica — el sistema es inaccesible |

**Casos negativos:**

| # | Paso | Resultado esperado | Severidad |
|---|---|---|---|
| 1a | Email vacío, submit | Validación Zod muestra error inline | 🟡 Alta |
| 1b | Password incorrecta | Toast de error "Credenciales inválidas" o similar | 🟡 Alta |
| 1c | Backend apagado | Error de red, no crash de UI | 🟢 Media |

---

## QA-02: Select Company

| Campo | Valor |
|---|---|
| Precondiciones | Login exitoso, usuario con ≥2 empresas |
| Pasos | 1. Login exitoso <br> 2. Verificar que llega a `/select-company` <br> 3. Click en una empresa (card) <br> 4. Verificar redirect a `/dashboard` |
| Resultado esperado | Header muestra nombre de empresa. `X-Company-ID` en requests subsiguientes. `localStorage['tenant_id']` seteado |
| Si falla | 🔴 Crítica — toda la app depende de contexto de tenant |

---

## QA-03: Dashboard

| Campo | Valor |
|---|---|
| Precondiciones | Login exitoso, empresa seleccionada |
| Pasos | 1. Navegar a `/dashboard` <br> 2. Verificar 4 tarjetas KPI visibles <br> 3. Verificar que los números cargan (no skeleton permanente) <br> 4. Verificar gráfico de tendencia de tickets |
| Resultado esperado | Cards muestran: Tickets abiertos, SLA cumplimiento, Infraestructura total, Pólizas activas. Datos numéricos reales (no 0 si hay seed data) |
| Si falla | 🟡 Alta — dashboard es la primera pantalla visible |

---

## QA-04: Sidebar Dinámico

| Campo | Valor |
|---|---|
| Precondiciones | Dashboard visible |
| Pasos | 1. Verificar que sidebar muestra menú cargado desde API <br> 2. Verificar agrupaciones (e.g., Inventario con sub-items) <br> 3. Click en diferentes items de menú <br> 4. Verificar highlight en item activo <br> 5. Click en botón collapse (desktop) <br> 6. Verificar que muestra solo iconos con tooltips |
| Resultado esperado | Menú refleja la configuración del backend. Navegación funcional. Collapse muestra iconos + tooltips al hover |
| Si falla | 🟡 Alta — navegación principal |

---

## QA-05: Theming (colores empresa)

| Campo | Valor |
|---|---|
| Precondiciones | Dashboard visible, empresa con colores primario/secundario/terciario |
| Pasos | 1. Verificar que elementos UI (botones, badges, links activos) usan el color primario de la empresa <br> 2. Ir a `/settings` <br> 3. Cambiar color primario <br> 4. Click "Guardar Tema" <br> 5. Verificar que el cambio se refleja inmediatamente |
| Resultado esperado | CSS variables `--tenant-primary`, `--tenant-secondary`, `--tenant-tertiary` aplicados. Cambios reflejados en toda la UI |
| Si falla | 🟢 Media — cosmético pero importante para multi-tenant |

---

## QA-06: Tenants

| Campo | Valor |
|---|---|
| Precondiciones | Usuario con permisos de super-admin |
| Pasos | 1. Ir a `/tenants` <br> 2. Verificar tabla con columnas: nombre, slug, plan, estado, acciones <br> 3. Click "+ Nuevo Tenant" → llenar form → crear <br> 4. Verificar que aparece en tabla <br> 5. Click editar → cambiar nombre → guardar <br> 6. Click activar/desactivar <br> 7. Probar búsqueda en tabla |
| Resultado esperado | CRUD completo funcional. Toast de éxito en cada operación. Tabla actualiza tras mutación |
| Si falla | 🟡 Alta — gestión multi-tenant |

---

## QA-07: Clients

| Campo | Valor |
|---|---|
| Precondiciones | Dashboard visible |
| Pasos | 1. Ir a `/clients` <br> 2. Verificar tabla con clientes <br> 3. Click "+ Nuevo Cliente" → llenar form (company_name, rfc, email, etc.) → crear <br> 4. Verificar que aparece en tabla <br> 5. Verificar que **no hay botones editar/eliminar** (limitación conocida de backend) |
| Resultado esperado | Listado y creación funcional. Sin opciones de edit/delete (documentado en `09_RELEASE_STATUS.md`) |
| Si falla | 🟡 Alta si listado falla. ⚪ Baja si solo falta edit/delete (esperado) |

---

## QA-08: Inventory Dashboard

| Campo | Valor |
|---|---|
| Precondiciones | Dashboard visible, hay NVRs y cámaras en el sistema |
| Pasos | 1. Ir a `/inventory` <br> 2. Verificar tarjetas resumen: Total NVRs, Total Cámaras, Almacenamiento, Sitios <br> 3. Verificar que los números no son 0 (si hay seed data) |
| Resultado esperado | Resumen ejecutivo con datos reales del backend |
| Si falla | 🟢 Media — resumen informativo |

---

## QA-09: NVRs

| Campo | Valor |
|---|---|
| Precondiciones | Dashboard visible |
| Pasos | 1. Ir a `/nvrs` <br> 2. Verificar tabla con NVRs y stats cards superiores <br> 3. Click "+ Nuevo NVR" → llenar form → crear <br> 4. Click editar → cambiar datos → guardar <br> 5. Click eliminar → confirmar <br> 6. Probar export Excel/PDF |
| Resultado esperado | CRUD completo. Stats actualizan. Export genera archivo descargable |
| Si falla | 🔴 Crítica — inventario core |

---

## QA-10: Cámaras

| Campo | Valor |
|---|---|
| Precondiciones | Al menos 1 NVR creado |
| Pasos | 1. Ir a `/cameras` <br> 2. Verificar stats cards + tabla <br> 3. Probar búsqueda semántica (escribir término descriptivo) <br> 4. Click "+ Nueva Cámara" → llenar form → crear <br> 5. Click en una cámara → verificar redirect a `/cameras/[id]` <br> 6. Probar export Excel/PDF |
| Resultado esperado | CRUD + búsqueda semántica funcional. Stats actualizan. Export funcional |
| Si falla | 🔴 Crítica — inventario core |

---

## QA-11: Ficha Técnica Cámara (Detail)

| Campo | Valor |
|---|---|
| Precondiciones | Al menos 1 cámara creada |
| Pasos | 1. Ir a `/cameras/[id]` (click desde lista) <br> 2. Verificar secciones: info general, specs técnicas, resolución, FOV <br> 3. Verificar breadcrumb / botón "volver" |
| Resultado esperado | Ficha completa con datos del backend. Cards por sección con specs |
| Si falla | 🟡 Alta — es la vista de detalle principal de equipos |

---

## QA-12: Importación Masiva

| Campo | Valor |
|---|---|
| Precondiciones | Dashboard visible |
| Pasos | 1. Ir a `/imports` <br> 2. Verificar tabla de batches + stats cards <br> 3. Click "+ Nuevo Lote" → configurar → crear <br> 4. Click en un batch → verificar detalle modal con items y errores <br> 5. Procesar batch si está pendiente |
| Resultado esperado | CRUD de batches. Detalle muestra items validados vs errores. Procesamiento funcional |
| Si falla | 🟡 Alta — operación bulk importante |

---

## QA-13: Tickets

| Campo | Valor |
|---|---|
| Precondiciones | Dashboard visible, hay usuarios en el sistema |
| Pasos | 1. Ir a `/tickets` <br> 2. Verificar tabla + export buttons <br> 3. Click "+ Nuevo Ticket" → llenar form → crear <br> 4. Click en un ticket → ir a `/tickets/[id]` <br> 5. En detalle: verificar timeline, agregar comentario, cambiar estado, asignar técnico <br> 6. Probar export Excel/PDF |
| Resultado esperado | CRUD completo. Timeline muestra historial. Comentarios se guardan. Cambio de estado actualiza badge. Asignación funcional |
| Si falla | 🔴 Crítica — módulo operativo principal |

---

## QA-14: Pólizas

| Campo | Valor |
|---|---|
| Precondiciones | Dashboard visible |
| Pasos | 1. Ir a `/policies` <br> 2. Verificar tabla + export <br> 3. Click "+ Nueva Póliza" → llenar form → crear <br> 4. Click en póliza → ir a `/policies/[id]` <br> 5. En detalle: verificar assets vinculados, condiciones, vigencia <br> 6. Editar póliza, eliminar póliza <br> 7. Probar export Excel/PDF |
| Resultado esperado | CRUD completo. Detalle muestra assets y condiciones. Export funcional |
| Si falla | 🟡 Alta — gestión contractual |

---

## QA-15: SLA

| Campo | Valor |
|---|---|
| Precondiciones | Dashboard visible |
| Pasos | 1. Ir a `/sla` <br> 2. Verificar tabla de definiciones SLA <br> 3. Crear nueva regla SLA <br> 4. Editar regla existente <br> 5. Eliminar regla |
| Resultado esperado | CRUD completo. Respuestas rápidas, toasts de confirmación |
| Si falla | 🟡 Alta — definiciones SLA afectan tickets |

---

## QA-16: Usuarios

| Campo | Valor |
|---|---|
| Precondiciones | Usuario admin logueado |
| Pasos | 1. Ir a `/users` <br> 2. Verificar tabla con columnas: nombre, email, rol, estado <br> 3. Click editar usuario → cambiar datos → guardar <br> 4. Click "Cambiar contraseña" → ingresar nueva → guardar <br> 5. Click "Asignar rol" → seleccionar rol → guardar <br> 6. Click "Cambiar avatar" → seleccionar imagen → upload |
| Resultado esperado | Todas las operaciones exitosas con toasts. Tabla se refresca tras cada mutación |
| Si falla | 🔴 Crítica — gestión de accesos |

---

## QA-17: Roles y Permisos

| Campo | Valor |
|---|---|
| Precondiciones | Usuario admin logueado |
| Pasos | 1. Ir a `/roles` <br> 2. Verificar tabla de roles <br> 3. Crear nuevo rol → asignar nombre y descripción <br> 4. Click en "permisos" → seleccionar/deseleccionar permisos → guardar <br> 5. Verificar que los cambios persisten (refrescar página) |
| Resultado esperado | CRUD roles funcional. Permisos asignables por checkbox. Cambios persisten |
| Si falla | 🔴 Crítica — RBAC del sistema |

---

## QA-18: Settings

| Campo | Valor |
|---|---|
| Precondiciones | Usuario admin logueado |
| Pasos | 1. Ir a `/settings` <br> 2. Verificar sección "Información General" (nombre, slug, plan, estado) <br> 3. Verificar sección "Tema Visual" con 3 color pickers <br> 4. Cambiar color primario → click "Guardar Tema" <br> 5. Verificar que el color se refleja inmediatamente en la UI |
| Resultado esperado | Info general muestra datos del tenant. Color picker funciona. Cambios se aplican en real-time |
| Si falla | 🟢 Media — configuración cosmética |

---

## QA-19: Storage

| Campo | Valor |
|---|---|
| Precondiciones | Usuario admin logueado |
| Pasos | 1. Ir a `/storage` <br> 2. Verificar stats cards (archivos, tamaño, proveedores) <br> 3. Verificar tabla de configuraciones <br> 4. Crear nueva configuración → seleccionar provider → guardar <br> 5. Editar configuración existente <br> 6. Eliminar configuración |
| Resultado esperado | CRUD configuraciones. Stats muestran datos del backend |
| Si falla | 🟢 Media — funcionalidad admin avanzada |

---

## QA-20: Intelligence (IA)

| Campo | Valor |
|---|---|
| Precondiciones | Usuario admin logueado |
| Pasos | 1. Ir a `/intelligence` <br> 2. Verificar 4 cards de usage stats (llamadas, tokens, costo, plantillas) <br> 3. Verificar tabla de modelos <br> 4. Crear nuevo modelo → llenar form → guardar <br> 5. Editar modelo, eliminar modelo, set as default <br> 6. Verificar sección de plantillas de prompts (solo lectura) <br> 7. Click "Re-indexar Embeddings" → verificar feedback |
| Resultado esperado | CRUD modelos funcional. Templates visibles en grid de cards. Re-index muestra loading + toast resultado |
| Si falla | 🟢 Media — funcionalidad avanzada |

---

## QA-21: Floor Plans

| Campo | Valor |
|---|---|
| Precondiciones | Al menos 1 sitio existe en el sistema |
| Pasos | 1. Ir a `/floor-plans` <br> 2. Verificar grid de cards por sitio <br> 3. Click en un sitio → ir a editor `/floor-plans/[id]` <br> 4. En editor: verificar canvas Konva con grid <br> 5. Drag de cámara al canvas <br> 6. Seleccionar cámara → verificar panel de propiedades (FOV, ángulo) <br> 7. Click "Guardar" → verificar persistencia <br> 8. Recargar página → verificar que se mantiene |
| Resultado esperado | Canvas interactivo. Drag-and-drop funcional. FOV cono visible. JSON se guarda y restaura del backend |
| Si falla | 🟡 Alta — funcionalidad diferenciadora del producto |

---

## QA-22: Topología de Red

| Campo | Valor |
|---|---|
| Precondiciones | Sitio con NVRs y cámaras asignadas |
| Pasos | 1. Desde floor-plan de un sitio, ir a "Topología" (o navegar a `/floor-plans/[id]/topology`) <br> 2. Verificar grafo: nodo Site → nodos NVR → nodos Camera <br> 3. Verificar colores por estado (verde=online, rojo=offline) <br> 4. Verificar que se puede hacer zoom y pan <br> 5. Verificar layout automático |
| Resultado esperado | Grafo React Flow con estructura correcta. Colores reflejan estado real. Interacción fluida |
| Si falla | 🟢 Media — visualización informativa |

---

## QA-23: Export PDF/Excel

| Campo | Valor |
|---|---|
| Precondiciones | Una lista con datos (cameras, nvrs, tickets, policies) |
| Pasos | 1. Ir a cualquier listado con botón "Exportar" (e.g., `/cameras`) <br> 2. Click "Exportar" → seleccionar "Excel (.xlsx)" <br> 3. Verificar que se descarga archivo .xlsx con datos <br> 4. Click "Exportar" → seleccionar "PDF" <br> 5. Verificar que se descarga archivo .pdf con tabla formateada |
| Resultado esperado | Ambos formatos se descargan. Excel tiene todas las columnas. PDF tiene encabezado con fecha |
| Si falla | 🟢 Media — funcionalidad de reportes |

---

## QA-24: Responsive Básico

| Campo | Valor |
|---|---|
| Precondiciones | App cargada en cualquier página del dashboard |
| Pasos | 1. Resize browser a ≤768px (mobile) <br> 2. Verificar que sidebar desaparece <br> 3. Verificar botón hamburguesa en header <br> 4. Click hamburguesa → sidebar se abre como Sheet (overlay) <br> 5. Click en item del menú → sheet se cierra, navega <br> 6. Resize a ≥1024px → verificar sidebar normal visible <br> 7. Click botón collapse en desktop → sidebar muestra solo iconos |
| Resultado esperado | Mobile: sheet overlay con menú completo. Desktop: toggle collapse/expand. Transiciones suaves |
| Si falla | 🟡 Alta — usabilidad en dispositivos móviles |

---

## QA-25: Dark Mode

| Campo | Valor |
|---|---|
| Precondiciones | App cargada |
| Pasos | 1. Click en icono de tema en header (sol/luna/monitor) <br> 2. Seleccionar "Oscuro" → verificar fondo oscuro, texto claro <br> 3. Seleccionar "Claro" → verificar fondo blanco, texto oscuro <br> 4. Seleccionar "Sistema" → verificar que sigue preferencia del OS <br> 5. Refrescar página → verificar que la preferencia persiste |
| Resultado esperado | Transición entre temas sin flicker. Todos los componentes adaptan colores. Preferencia persiste en localStorage |
| Si falla | 🟢 Media — cosmético pero visible |

---

## Resumen de Severidades

| Severidad | Cantidad | Tests |
|---|---|---|
| 🔴 Crítica | QA-01, QA-02, QA-09, QA-10, QA-13, QA-16, QA-17 | 7 |
| 🟡 Alta | QA-03, QA-04, QA-07, QA-11, QA-12, QA-14, QA-15, QA-21, QA-24 | 9 |
| 🟢 Media | QA-05, QA-08, QA-18, QA-19, QA-20, QA-22, QA-23, QA-25 | 8 |
| ⚪ Baja | (subcasos en QA-07) | 1 |

**Total: 25 tests de QA manual.**

---

## Ejecución

| Campo | Valor |
|---|---|
| Ejecutado por | (nombre) |
| Fecha | (fecha) |
| Resultado | __ / 25 pasaron |
| Bloqueantes encontrados | (listar) |
| Notas | (observaciones) |
