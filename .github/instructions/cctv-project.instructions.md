---
description: "Use when working on any part of the sistema-camaras-mono monorepo: cctv_server (Go backend), cctv_web (Next.js frontend), or cctv_mobile (Flutter app). Covers monorepo conventions, port assignments, API contract rules, frontend stack patterns, and Flutter Clean Architecture rules."
---
# Sistema Camaras — Instrucciones del Monorepo

## Lenguaje

Responde siempre en **español**. Comentarios en código también en español.

---

## Estructura del monorepo

```
sistema-camaras-mono/
├── cctv_server/   — Backend Go 1.24 (Gin, sqlc, pgx, MinIO)
├── cctv_web/      — Frontend Next.js (React 19, Tailwind 4, shadcn/ui)
├── cctv_mobile/   — App Flutter (BLoC, Clean Architecture)
├── docker/        — Configuración de contenedores auxiliares
├── scripts/       — Scripts PowerShell (.ps1) y shell
└── docs/          — Documentación unificada
```

Puertos del monorepo (no cambiar):

| Servicio    | Puerto |
|-------------|--------|
| Backend API | 8088   |
| Frontend    | 3010   |
| PostgreSQL  | 5438   |
| pgAdmin     | 5058   |
| MinIO       | 9010   |

---

## `cctv_server` — Backend Go (SOLO LECTURA)

- **NUNCA modificar** el backend Go. Se trata como contrato de API fijo.
- El módulo Go es `github.com/symtickets/cctv_server`.
- Las migraciones y queries SQL viven **exclusivamente** en `cctv_server/internal/database/`. No crear una carpeta `database/` en la raíz.
- Si un endpoint no existe, documéntalo como GAP en lugar de modificar el backend.

### Gaps de API conocidos (no implementar en frontend como si existieran)

| GAP | Endpoint faltante | Consecuencia |
|-----|-------------------|--------------|
| GAP-01 | `POST/PUT/DELETE /sites` | No hay CRUD de sitios; solo listar |
| GAP-04 | `POST /auth/refresh` | Sin refresh token silencioso; redirigir a login al expirar |
| GAP-05 | `POST /auth/switch-company` | Cambiar empresa = clearAuth + re-login |
| GAP-06 | `CRUD /preventive-maintenance/*` | Tabla en BD pero sin endpoints |
| GAP-07 | `GET /audit/logs` | Sin historial de auditoría |
| GAP-03 | Sites sin lat/lng expuesto | Mapa geográfico bloqueado; react-leaflet no instalado |

---

## `cctv_web` — Frontend Next.js

### Stack

- **Framework**: Next.js con App Router (carpeta `src/app/`)
- **HTTP**: `ky` — nunca usar `fetch` directo ni `axios`
- **Estado servidor**: TanStack Query v5 (React Query)
- **Estado cliente**: Zustand — stores en `src/stores/`
- **Formularios**: React Hook Form + Zod
- **UI**: shadcn/ui sobre Tailwind 4 — no instalar librerías de UI alternativas
- **Tablas**: TanStack Table, usando el componente `DataTable` existente en `src/components/data-table/`
- **Exportar**: `ExportButton` existente en `src/components/shared/` (xlsx + jspdf-autotable)
- **Planos**: react-konva (componentes en `src/components/floor-plan-editor/`)
- **Topología**: React Flow (ya instalado)

### Stores Zustand disponibles

| Archivo | Propósito |
|---------|-----------|
| `auth-store.ts` | JWT, usuario, clearAuth |
| `tenant-store.ts` | Empresa activa (multi-tenant) |
| `site-store.ts` | Sucursal activa |
| `sidebar-store.ts` | Estado del sidebar |
| `theme-store.ts` | light / dark / system |

### Capa de API

- Todos los wrappers de API van en `src/lib/api/<recurso>.ts`.
- El cliente HTTP base está en `src/lib/api/client.ts` — siempre usarlo, nunca crear instancias de `ky` sueltas.
- Nunca hacer llamadas HTTP directamente en componentes o stores.

### Convenciones de rutas (App Router)

- Rutas de la app en `src/app/(dashboard)/` (layout compartido) o `src/app/login/`, `src/app/select-company/`.
- Los archivos de página se llaman `page.tsx`.

### Tests

- Unit tests con **Vitest** en `src/__tests__/`.
- E2E con **Playwright** en `e2e/`.
- No usar Jest.

---

## `cctv_mobile` — App Flutter

### Arquitectura

Clean Architecture por feature, sin excepciones:

```
lib/
├── core/          — DI, red, router, tema, utils, constantes (transversal)
└── features/
    └── <feature>/
        ├── data/         — DataSources, modelos, implementaciones de repositorios
        ├── domain/       — Entities, repositorios (abstract), UseCases
        └── presentation/ — BLoC/Cubit, páginas, widgets
```

### Features existentes

- `auth/` — Login
- `home/` — Pantalla principal
- `tickets/` — Gestión de tickets

Al agregar una feature nueva, respetar la misma estructura `data/domain/presentation/`.

### Patrones

- Gestión de estado con **BLoC** (no Provider, no Riverpod, no setState para lógica de negocio).
- Inyección de dependencias centralizada en `core/di/`.
- Capa de red centralizada en `core/network/`.
- Nunca importar directamente `http` o `dio` sustituto fuera de `core/network/`.

---

## Scripts y levantamiento

En Windows usar los scripts PowerShell de `scripts/`:

```powershell
.\scripts\up.ps1            # Levantar todos los servicios
.\scripts\down.ps1          # Bajar servicios
.\scripts\dev-web.ps1       # Solo frontend en modo dev
.\scripts\dev-backend.ps1   # Solo backend en modo dev
.\scripts\check-services.ps1 # Verificar estado de servicios
```

También disponible `docker compose up -d` desde la raíz.
