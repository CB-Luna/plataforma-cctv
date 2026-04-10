# Auditoria Visual Playwright — Fase 0

> Generada automaticamente via `e2e/audit-visual.spec.ts`
> Fecha: Abril 2026
> Capturas: `cctv_web/audit-screenshots/`
> Usuarios auditados: Admin (admin@demo.com) + Calimax (calimax@gmail.com)

---

## Resumen ejecutivo

Se capturaron **17 paginas** por usuario (34 capturas totales + screenshots de login).
El resultado revela **1 crash critico**, **3 problemas arquitecturales**, **6 bugs funcionales** y **8 problemas de polish**.

### Estadisticas rapidas

| Metrica | Admin | Calimax |
|---------|-------|---------|
| Paginas con datos reales | 12/17 | 1/17 |
| Paginas vacias (sin datos) | 4/17 | 16/17 |
| Paginas con crash/error | 1/17 | 0/17 |
| Acentos rotos visibles | 2 paginas | 0 |

---

## CRITICO — Runtime Crashes

### AUD-01: Inventario crash con datos reales
- **Pagina:** `/inventory` (Admin)
- **Screenshot:** `admin_08_inventory.png`
- **Error:** `Objects are not valid as a React child (found: object with keys {inventory_camera_type, valid})`
- **Causa probable:** Una columna o celda renderiza un objeto completo en vez de extraer la propiedad string. El campo `inventory_camera_type` contiene un objeto `{inventory_camera_type: "...", valid: true/false}` y se pasa directo como children de JSX.
- **Severidad:** CRITICO — la pagina completa se cae. Solo se ve el stack trace de React.
- **Accion:** Localizar en el componente de inventario donde se renderiza `camera_type` y extraer la propiedad string: `item.inventory_camera_type.inventory_camera_type` o equivalente.

---

## ALTO — Problemas Arquitecturales

### AUD-02: Admin del Sistema entra como tenant
- **Paginas afectadas:** TODAS (Admin)
- **Screenshots:** `admin_00e_dashboard.png`, `admin_01_dashboard.png`
- **Evidencia:** Dashboard muestra "Portal de Empresa Demo CCTV". Tags visibles: "Portal tenant", "Plan: basic", "Rol: Administrador", "Tenant: demo". Sidebar dice "Empresa Demo CCTV" + "Administrador".
- **Causa:** El backend retorna la empresa "demo" asociada al usuario admin@demo.com. El frontend auto-selecciona esa empresa y entra en modo tenant_portal.
- **Impacto:** No existe experiencia de "Plataforma global" real. El Admin del Sistema ve todo como si fuera un tenant. Esto contradice la arquitectura documentada.
- **Relacion:** BUG-01 del plan de accion. F1 (Shell Admin del Sistema) no se ha implementado.

### AUD-03: Filtro de mapa dice "Todas las empresas"
- **Pagina:** `/map` (Admin)
- **Screenshot:** `admin_05_map.png`
- **Evidencia:** Dropdown arriba-derecha del mapa muestra "Todas las empresas" como label.
- **Problema:** Si el usuario esta dentro de un tenant, no debe ver un filtro de "empresas" — deberia filtrar por sucursal. El concepto "empresa" solo aplica al Admin del Sistema en modo plataforma.
- **Relacion:** BUG-17 — pantallas de operacion no estan encapsuladas por tenant.

### AUD-04: Texto con acentos rotos (encoding)
- **Paginas afectadas:** `/settings` (Usuarios), `/settings` (Roles y Permisos)
- **Screenshots:** `admin_14_users.png`, `admin_15_roles.png`
- **Evidencia:** "Carlos T??cnico" (deberia ser "Tecnico"), "Mar??a Visualizadora" (deberia ser "Maria"), "T??cnico de campo" (descripcion de rol).
- **Causa:** Los datos vienen del backend (seed SQL). El SQL probablemente usa caracteres UTF-8 pero el encoding se rompe en algun punto de la cadena (seed → DB → API → frontend rendering).
- **Relacion:** BUG-08 del plan de accion. F0-03 no implementada.
- **Nota:** Este es un problema de datos en el backend/seed, no de frontend. El frontend los renderiza tal cual llegan de la API.

---

## MEDIO — Bugs Funcionales

### AUD-05: Clientes con filas duplicadas
- **Pagina:** `/clients` (Admin)
- **Screenshot:** `admin_07_clients.png`
- **Evidencia:** "Aeropuerto MTY" aparece 2 veces, "Banco Banorte" 3 veces, "Cemex Planta Norte" 3 veces. Mismo RFC, email y telefono en cada duplicado.
- **Causa:** Posible join en backend que multiplica registros por sucursal. O seed con datos duplicados.
- **Impacto:** Total Clientes marca "20" pero son ~8 empresas unicas con registros multiplicados.

### AUD-06: CAPEX — garantias siempre "Sin info"
- **Pagina:** `/capex` (Admin)
- **Screenshot:** `admin_11_capex.png`
- **Evidencia:** 1149 equipos totales. Garantia Vigente: 0, Por Vencer (12m): 0, Por Vencer (6m): 0, Garantia Vencida: 0. Tabla muestra todo como "Sin info" en columna ESTADO GARANTIA. Columna Estado muestra punto gris sin label.
- **Causa:** Los equipos no tienen fecha de garantia (`warranty_date` null). `classifyWarranty()` retorna `sin_info` para todos.
- **Relacion:** BUG-06 del plan de accion. F4 no implementada.

### AUD-07: Filtros muestran "__all__" como texto visible
- **Paginas:** `/tickets` (Admin), `/policies` (Admin)
- **Screenshots:** `admin_06_tickets.png`, `admin_12_policies.png`
- **Evidencia:** Dropdowns de filtro muestran el string raw `__all__` en vez de "Todos" o "Todas las empresas/sucursales".
- **Impacto visual:** Se ve como codigo interno expuesto al usuario.

### AUD-08: Toast "1 Issue" persistente sin explicacion
- **Paginas:** `/cameras` (Admin, Calimax), `/imports` (Admin)
- **Screenshots:** `admin_02_cameras.png`, `admin_09_imports.png`
- **Evidencia:** Toast rojo en esquina inferior izquierda "1 Issue" con X para cerrar.
- **Causa:** Probablemente un error de consola o un issue tracker embebido (Next.js dev overlay). No es claro para el usuario que significa.
- **Nota:** Esto puede ser un artifact del modo development de Next.js (Turbopack) y no aparecer en produccion.

### AUD-09: Routing /settings y /storage muestran lo mismo
- **Paginas:** `/settings`, `/storage` (Calimax)
- **Screenshots:** `calimax_16_settings.png`, `calimax_17_storage.png`
- **Evidencia:** Ambas URLs renderizan la misma pagina de Configuracion con tab "Usuarios" activa. No se navega automaticamente al tab "Storage" cuando la URL es /storage.
- **Causa:** Posible fallo en el routing — /storage deberia abrir Configuracion con tab "Storage" pre-seleccionada.

### AUD-10: NVRs duplicados en tabla
- **Pagina:** `/nvrs` (Admin)
- **Screenshot:** `admin_03_nvrs.png`
- **Evidencia:** "NVR-AVI-007" aparece dos veces con diferentes sitios (uno "Sin sitio", otro "Farmacias Guadalajara — Sucursal Sur"). Posiblemente datos duplicados en seed o falta de key unica.

---

## BAJO — Polish / Cosmetico

### AUD-11: Font sigue siendo Inter
- **Paginas:** TODAS
- **Evidencia:** Fuente visible es Inter (sans-serif por defecto de Next.js). No se ha cambiado a Plus Jakarta Sans o DM Sans.
- **Relacion:** F0-01 no implementada.

### AUD-12: Avatar "N" en sidebar sin contexto
- **Paginas:** TODAS
- **Evidencia:** Esquina inferior izquierda del sidebar muestra avatar circular con letra "N" y texto "v1.0.0".
- **Causa:** El avatar muestra la inicial del usuario loggeado (nombre backend). "N" podria ser "Nadie" o un nombre incorrecto. El "v1.0.0" es un version label de desarrollo.

### AUD-13: "Accesos rapidos del portal" en dashboard
- **Paginas:** Dashboard (Admin, Calimax)
- **Screenshots:** `admin_00e_dashboard.png`, `calimax_01_dashboard.png`
- **Evidencia:** Seccion lateral derecha "Accesos rapidos del portal" con links a Tickets, Clientes y sitios, Mi equipo, Roles internos, Branding y empresa, Storage.
- **Relacion:** BUG-02 — el usuario quiere que se elimine o redisene.

### AUD-14: Faltan tildes en labels del sidebar
- **Paginas:** TODAS
- **Evidencia:** "Fichas tecnicas" (deberia ser "Fichas tecnicas" — aunque en espanol sin tilde es aceptable), "Importacion", "Operacion cotidiana". Es consistente pero informal.

### AUD-15: Calimax sin datos — 16 de 17 paginas vacias
- **Paginas:** Todas menos Dashboard (Calimax)
- **Causa:** Calimax es un tenant real creado por UI pero no tiene datos de operacion en el backend (no tiene camaras, NVRs, tickets, clientes, polizas, etc. asociados). Las sucursales dependen de localStorage (GAP-01) que esta vacio en contexto Playwright.
- **Impacto:** No se puede auditar la funcionalidad real de operacion para tenants que no sean "demo".

### AUD-16: Planos muestra columna "EMPRESA" sin filtrar por tenant
- **Pagina:** `/floor-plans` (Admin)
- **Screenshot:** `admin_10_floor-plans.png`
- **Evidencia:** La tabla muestra registros de multiples empresas (Aeropuerto MTY, Banco Banorte, Cemex, etc.) con columna "EMPRESA" visible. No hay filtro activo por empresa.
- **Relacion:** BUG-17 — sin encapsulamiento por tenant.

### AUD-17: Roles — "T??cnico" con encoding roto
- **Pagina:** `/settings` tab Roles y Permisos (Admin)
- **Screenshot:** `admin_15_roles.png`
- **Evidencia:** Card de rol muestra "T??cnico" y descripcion "T??cnico de campo".
- **Relacion:** AUD-04 (misma causa raiz: datos del seed backend).

### AUD-18: Configuracion — tabs de plataforma visibles para Admin como tenant
- **Pagina:** `/settings` (Admin)
- **Screenshot:** `admin_14_users.png`
- **Evidencia:** Tabs visibles: Usuarios, Roles y Permisos, Temas, **Empresas**, **Servicios y paquetes**, **Plantillas de menu**, IA del sistema, Storage.
- **Problema:** "Empresas", "Servicios y paquetes" y "Plantillas de menu" son tabs de administracion de plataforma, no de operacion tenant. Al estar el Admin entrando como tenant, estas tabs estan fuera de contexto.
- **Relacion:** F1-01 — separacion limpia de contexto no implementada.

---

## Matriz de hallazgos vs Plan de Accion

| Hallazgo | Fase relacionada | Estado de la fase |
|----------|-----------------|-------------------|
| AUD-01 (Inventario crash) | F3 | **Pendiente** |
| AUD-02 (Admin como tenant) | F1 | **Pendiente** |
| AUD-03 (Mapa "empresas") | F9 / F14 | Marcada "Completado" pero **NO verificada** |
| AUD-04 (Encoding) | F0-03 | **Pendiente** |
| AUD-05 (Clientes duplicados) | F7 | Marcada "Completado" pero **bug visible** |
| AUD-06 (CAPEX sin info) | F4 | **Pendiente** |
| AUD-07 (Filtros __all__) | F8 | Marcada "Auditado" pero **bug visible** |
| AUD-08 (Toast 1 Issue) | — | Posible artifact dev mode |
| AUD-09 (Routing settings) | F8 | **No documentado** |
| AUD-10 (NVRs duplicados) | F7 | Marcada "Completado" pero **bug visible** |
| AUD-11 (Font Inter) | F0-01 | **Pendiente** |
| AUD-12 (Avatar N) | F8 | **No documentado** |
| AUD-13 (Accesos rapidos) | F1-03 | **Pendiente** |
| AUD-14 (Tildes faltantes) | F0-02 | **Pendiente** |
| AUD-15 (Calimax vacio) | — | Limitacion de datos |
| AUD-16 (Planos sin tenant) | F9 / F14 | Marcada "Completado" pero **NO verificada** |
| AUD-17 (Roles encoding) | F0-03 | **Pendiente** (datos de seed) |
| AUD-18 (Tabs fuera contexto) | F1 | **Pendiente** |

---

## Estado HONESTO de fases marcadas como "Completado"

| Fase | Marcada como | Evidencia real en screenshots |
|------|-------------|-------------------------------|
| F6 (Portal Tenant sidebar) | Completado | **PARCIAL** — sidebar muestra nombre de empresa correctamente, pero logo no se renderiza (solo inicial con color) |
| F7 (Modulo Operaciones) | Completado | **FALSO** — Clientes con duplicados (AUD-05), NVRs con duplicados (AUD-10), filtros con __all__ (AUD-07) |
| F9 (Encapsulamiento tenant) | Completado | **FALSO** — Mapa muestra "Todas las empresas" (AUD-03), Planos muestra todas las empresas (AUD-16), CAPEX sin filtro por empresa |
| F10 (Roles filtrados) | Completado | **CORRECTO** — super_admin y tenant_admin NO aparecen en cards de roles del Admin ✅ |
| F11 (Temas CSS) | Completado | **NO VERIFICABLE** — Las capturas usan tema default. No se puede confirmar si otros temas se aplican visualmente. |
| F12 (Empresas en dropdowns) | Completado | **NO VERIFICABLE** — El Admin entra como tenant "demo", no se ve un dropdown de seleccion de empresa global. |
| F13 (Sucursales CRUD) | Completado | **CORRECTO PARCIAL** — Tabla de sucursales muestra datos backend (Admin). Calimax sin datos (localStorage vacio en Playwright). Banner "Modo preparacion" visible. |
| F14 (Coherencia Admin vs Empresa) | Completado | **FALSO** — Admin opera como tenant, no como Admin del Sistema. No existe diferenciacion visual. |

---

## Prioridades recomendadas de correccion

### Inmediato (bloquea uso basico)
1. **AUD-01** — Fix crash de Inventario (objeto renderizado como child)
2. **AUD-04** — Encoding de acentos (dato de backend/seed)
3. **AUD-07** — Filtros "__all__" → "Todos"

### Corto plazo (afecta percepcion profesional)
4. **AUD-11** — Cambiar font a Plus Jakarta Sans (F0-01)
5. **AUD-13** — Remover/redisenar "Accesos rapidos" del dashboard
6. **AUD-05** — Investigar clientes duplicados (posible join en API)
7. **AUD-06** — Mejorar UX de CAPEX (garantias sin info menos prominentes)

### Medio plazo (requiere cambio arquitectural)
8. **AUD-02** — Separar contexto Admin del Sistema vs tenant (F1 completa)
9. **AUD-03/16/18** — Encapsulamiento real por tenant en todas las pantallas

---

## Notas tecnicas del audit

- **Playwright config:** `baseURL` debe usar `localhost` (no `127.0.0.1`) para evitar CORS con backend en `localhost:8088`.
- **Login en Playwright:** Click en boton de demo user (usa RHF `setValue()` internamente). `page.fill()` no garantiza update del estado de React Hook Form.
- **Selector Admin:** Usar `.first()` en locator para evitar ambiguedad entre card "Admin" y card "Tenant Admin" de Calimax.
- **Script:** `e2e/audit-visual.spec.ts` — ejecutar con `npx playwright test e2e/audit-visual.spec.ts`.
