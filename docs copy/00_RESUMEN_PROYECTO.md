# 00 — Resumen del Proyecto

> Fecha: 2026-04-05 | Reconciliado: 2026-04-05
> Estado: RECONCILIADO — contradicciones internas resueltas tras auditoría cruzada.

---

## Qué es symticketscctv-next

**Plataforma web multi-tenant de gestión de infraestructura CCTV por empresa y sucursal.**

Permite a un proveedor de servicios CCTV (y a sus clientes) administrar inventario de cámaras/NVR, ticketes de servicio, pólizas de mantenimiento, SLA, planos interactivos y mapa geográfico de sitios, todo desde una interfaz web moderna con aislamiento de datos por tenant.

---

## Origen

| Proyecto | Rol en esta iniciativa |
|---|---|
| `symticketscctv` (legado) | Aporta el **dominio de negocio CCTV**, el **backend Go completo**, los **contratos API**, el **esquema de base de datos** y la **documentación funcional**. La parte web (Flutter Web + Next.js incompleto) **no se reutiliza como código**, solo como referencia funcional. |
| `core-associates` | Aporta **patrones de UX enterprise**: login, shell administrativo (sidebar dinámico + header), RBAC dinámico, theming/branding por tenant, menú por visibilidad de rol. **No se reutiliza dominio** (abogados, casos legales, CRM). |
| `symticketscctv-next` (este proyecto) | **Nuevo producto web** que se construye desde cero, consumiendo el backend Go existente sin modificarlo. |

---

## Alcance funcional

### Incluido en esta versión

- Login con JWT (⚠️ refresh token NO implementado en backend — ver `07_API_GAPS` GAP-04)
- Selector de empresa (tenant) y selector de sucursal (site)
- Dashboard con KPIs (tickets, inventario, pólizas, facturación)
- Mapa geográfico de sucursales (Leaflet)
- Inventario CCTV: cámaras, NVR/DVR, importación masiva, fichas técnicas
- Tickets de servicio con timeline, comentarios, asignación, SLA
- Pólizas y coberturas
- SLA definitions
- Clientes
- Planos interactivos de sitios (react-konva)
- Topología NVR → cámaras
- Administración: usuarios, roles, permisos, menú dinámico, theming/branding
- Configuración: storage (MinIO), modelos IA, settings globales
- Gestión de tenants (empresas proveedoras)
- Internacionalización (es/en)

### Excluido / Diferido

- Modificación del backend Go
- App móvil
- Facturación y cobranza (existe en DB pero no es prioridad Fase 1-6)
- Módulo de WhatsApp/email → ticket automático
- Firma electrónica de contratos
- Módulos de Core Associates que no apliquen a CCTV

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | React 19 + TypeScript |
| Estilos | Tailwind CSS 4 + shadcn/ui |
| Estado cliente | Zustand |
| Estado servidor | TanStack Query v5 |
| Formularios | React Hook Form + Zod |
| Tablas | TanStack Table |
| HTTP | ky |
| Gráficas | Recharts |
| Mapas | react-leaflet + Leaflet |
| Planos | react-konva |
| i18n | next-intl |
| Testing | Vitest + Playwright |

Backend (existente, sin cambios): **Go + Gin + SQLC + PostgreSQL 16 + MinIO + pgvector**

---

## Estructura del workspace

```
SISTEMA_CAMARAS/
  core-associates/          ← referencia UX/admin/config (no se modifica)
  symticketscctv/           ← legado completo, intacto (no se modifica)
  symticketscctv-next/      ← NUEVO producto web (este proyecto)
  Inventario skyworks.xlsx  ← datos de referencia
```
