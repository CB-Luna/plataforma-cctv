# 02 — Nomenclatura y Modelo de Negocio

> Fecha: 2026-04-05
> Estado: BORRADOR — requiere validación de stakeholders.

---

## Objetivo

Definir de forma inequívoca la nomenclatura del dominio para evitar confusión entre conceptos similares que aparecen en la base de datos, la API y la documentación legada.

---

## Glosario de Entidades

### Tenant (Empresa Proveedora)

| Atributo | Valor |
|---|---|
| **Tabla** | `public.tenants` |
| **Definición** | Organización proveedora de servicios CCTV que usa la plataforma. Es la raíz del multi-tenancy. Cada tenant opera como si tuviera su propia instancia del sistema. |
| **Ejemplos** | "SymTickets", "ACME Security", "VigilaMX" |
| **Campos clave** | `code`, `name`, `legal_name`, `logo_url`, `primary_color`, `plan_type` |
| **Estatus** | ✅ VERIFICADO en migración `000002_tenants.up.sql` |
| **Notas** | Tiene configuración de marca blanca (logo, colores). Define límites (`max_users`, `max_clients`, `max_assets`). El header de la API usa `X-Company-ID` (históricamente) o `X-Tenant-ID` para identificar este nivel. |

### Cliente (Empresa Contratante)

| Atributo | Valor |
|---|---|
| **Tabla** | `cctv.clients` |
| **Definición** | Empresa que contrata servicios CCTV al tenant. Tiene su propia infraestructura de cámaras, sitios y pólizas. Un tenant tiene N clientes. |
| **Ejemplos** | "Farmacias del Norte", "Hotel Plaza", "Centro Comercial Antea" |
| **Campos clave** | `code`, `company_name`, `legal_name`, `tax_id`, `industry`, `company_size` |
| **Relación** | `tenant_id → public.tenants(id)` |
| **Estatus** | ✅ VERIFICADO en migración `000004_cctv_clients.up.sql` |

### Sitio / Sucursal (Ubicación Física)

| Atributo | Valor |
|---|---|
| **Tabla** | `cctv.sites` |
| **Definición** | Ubicación física donde el cliente tiene infraestructura CCTV instalada. Puede ser una sucursal, bodega, oficina, fábrica o punto de venta. |
| **Ejemplos** | "Sucursal Centro", "Bodega Norte", "Corporativo Polanco" |
| **Campos clave** | `code`, `name`, `site_type`, `latitude`, `longitude`, `address_*`, `contact_*`, `operation_hours` |
| **Relación** | `tenant_id → public.tenants(id)`, `client_id → cctv.clients(id)` |
| **Tipos válidos** | `headquarters`, `branch`, `warehouse`, `factory`, `office`, `retail`, `other` |
| **Estatus** | ✅ VERIFICADO en migración `000005_cctv_sites.up.sql` |
| **Notas** | Las coordenadas (`latitude`, `longitude`) permiten visualización en mapa. El campo `access_instructions` es para técnicos de campo. |

> **Convención de uso UI:** En el sidebar y headers se usa el término **"Sucursal"** (más familiar en español). En la API y código se usa **"site"** (consistente con el backend Go).

### Área

| Atributo | Valor |
|---|---|
| **Tabla** | `cctv.areas` |
| **Definición** | Subdivisión lógica dentro de un sitio. Representa una zona física donde se agrupan equipos CCTV. |
| **Ejemplos** | "Estacionamiento", "Entrada principal", "Almacén Piso 2", "Perímetro norte" |
| **Campos clave** | `code`, `name`, `area_type`, `floor_number` |
| **Relación** | `tenant_id → tenants`, `site_id → cctv.sites(id)` |
| **Tipos válidos** | `entrance`, `parking`, `warehouse`, `office`, `production`, `perimeter`, `general`, `other` |
| **Estatus** | ✅ VERIFICADO en migración `000005_cctv_sites.up.sql` |
| **Notas** | `floor_number` es clave para los planos interactivos (un plano por piso). |

### Asset / Equipo CCTV

| Atributo | Valor |
|---|---|
| **Tabla** | `cctv.assets` |
| **Definición** | Equipo físico de videovigilancia: cámara, NVR, DVR, switch de red, etc. |
| **Campos clave** | `asset_tag`, `serial_number`, `brand`, `model`, `ip_address`, `mac_address`, `specifications` (JSONB), `status`, `condition` |
| **Relación** | `tenant_id → tenants`, `client_id → clients`, `site_id → sites`, `area_id → areas` (opcional), `asset_type_id → asset_types` |
| **Estados** | `active`, `inactive`, `maintenance`, `decommissioned` |
| **Condiciones** | `excellent`, `good`, `fair`, `poor` |
| **Estatus** | ✅ VERIFICADO en migración `000006_cctv_assets.up.sql` |

### Tipo de Asset

| Atributo | Valor |
|---|---|
| **Tabla** | `cctv.asset_types` |
| **Definición** | Catálogo de tipos de equipo, configurable por tenant. |
| **Categorías** | `camera`, `recorder`, `network`, `storage`, `accessory`, `other` |
| **Estatus** | ✅ VERIFICADO |

### Póliza / Contrato

| Atributo | Valor |
|---|---|
| **Tabla** | `cctv.policies` |
| **Definición** | Contrato de servicio entre el tenant y un cliente. Vincula cobertura, vigencia, monto y SLA. |
| **Campos clave** | `policy_number`, `start_date`, `end_date`, `cameras_covered`, `monthly_amount`, `billing_cycle`, `covered_sites` (UUID array) |
| **Estados** | `draft`, `active`, `suspended`, `expired`, `cancelled` |
| **Relación** | `tenant_id → tenants`, `client_id → clients`, `coverage_id → coverages` |
| **Estatus** | ✅ VERIFICADO en migración `000007_cctv_policies.up.sql` |

### Cobertura

| Atributo | Valor |
|---|---|
| **Tabla** | `cctv.coverages` |
| **Definición** | Catálogo de planes de cobertura con rangos de cámaras, precios y niveles de SLA incluidos. |
| **Campos clave** | `min_cameras`, `max_cameras`, `monthly_price`, `sla_response_hours`, `sla_resolution_hours`, `includes_preventive`, `includes_corrective`, `includes_parts` |
| **Estatus** | ✅ VERIFICADO |

### Ticket

| Atributo | Valor |
|---|---|
| **Tabla** | `cctv.tickets` |
| **Definición** | Solicitud de servicio generada por un evento (falla, mantenimiento preventivo, instalación). |
| **Tipos** | `corrective`, `preventive`, `installation`, `consultation`, `other` |
| **Prioridades** | `low`, `medium`, `high`, `urgent` |
| **Estados** | `open → assigned → in_progress → pending_parts/pending_client → resolved → closed` (también `cancelled`) |
| **Fuentes** | `web`, `mobile`, `email`, `phone`, `whatsapp`, `other` |
| **Campos SLA** | `sla_response_due_at`, `sla_resolution_due_at`, `first_response_at`, `sla_response_met`, `sla_resolution_met` |
| **Estatus** | ✅ VERIFICADO en migración `000008_cctv_tickets.up.sql` |

### SLA Definition

| Atributo | Valor |
|---|---|
| **Tabla** | `cctv.sla_definitions` |
| **Definición** | Definición de tiempos de respuesta y resolución por prioridad/tipo de ticket. |
| **Campos clave** | `name`, `ticket_priority`, `ticket_type`, `response_time_hours`, `resolution_time_hours`, `business_hours` (JSONB) |
| **Estatus** | ✅ VERIFICADO (tabla referenciada en RLS, handler `sla.go` implementado) |

---

## Jerarquía de Entidades

```
Tenant (Proveedor CCTV)
 └── Cliente (Empresa contratante)
      └── Sitio/Sucursal (Ubicación física)
           ├── Área (Zona dentro del sitio)
           │    └── Asset/Equipo (Cámara, NVR, etc.)
           ├── Plano interactivo (Floor plan del sitio)
           └── Ticket (Solicitud de servicio)
                └── Comentarios + Worklogs + Timeline

Tenant
 └── Póliza/Contrato
      ├── vinculada a: Cliente
      ├── basada en: Cobertura
      └── cubre: Sitios (UUID array)

Tenant
 └── SLA Definition (tiempos por prioridad/tipo)

Tenant
 └── Factura (billing.invoices) → asociada a Cliente y Póliza
```

---

## Aislamiento Multi-Tenant

| Capa | Mecanismo | Estatus |
|---|---|---|
| **Base de datos** | Todas las tablas tienen `tenant_id` (excepto `public.tenants` que es la raíz) | ✅ VERIFICADO |
| **RLS PostgreSQL** | Políticas `tenant_isolation` en TODAS las tablas multi-tenant. Usa `current_setting('app.current_tenant_id')` | ✅ VERIFICADO en `000010_rls_policies.up.sql` |
| **Middleware Go** | `TenantMiddleware()` extrae tenant del JWT y establece `SET app.current_tenant_id` en PostgreSQL | ✅ VERIFICADO en `cmd/main.go` |
| **Header HTTP** | `X-Company-ID` o `X-Tenant-ID` enviado por frontend | ✅ VERIFICADO en CORS config |
| **Frontend** | Store Zustand `tenant-store` con el ID activo, interceptor ky inyecta header | 🔨 POR IMPLEMENTAR |

---

## Nomenclatura en Código vs UI

| Código (API/DB) | UI (Español) | UI (Inglés) |
|---|---|---|
| `tenant` | Empresa / Proveedor | Company / Provider |
| `client` | Cliente | Client |
| `site` | Sucursal / Sitio | Site / Branch |
| `area` | Área | Area |
| `asset` | Equipo | Equipment / Asset |
| `policy` | Póliza | Policy |
| `coverage` | Cobertura | Coverage |
| `ticket` | Ticket | Ticket |
| `sla_definition` | Nivel de Servicio | SLA Policy |
| `invoice` | Factura | Invoice |
| `floor_plan` | Plano interactivo | Floor Plan |
