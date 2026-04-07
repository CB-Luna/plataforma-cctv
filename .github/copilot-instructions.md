# Sistema Camaras CCTV — Instrucciones del Workspace

Responde siempre en **español**. Comentarios en código en español.

## Arquitectura general

Monorepo con tres capas independientes:

| Carpeta | Stack | Estado |
|---------|-------|--------|
| `cctv_server/` | Go 1.24, Gin, sqlc, pgx, MinIO | Completo — **no modificar** |
| `cctv_web/` | Next.js, React 19, Tailwind 4, shadcn/ui | V1 RC1 |
| `cctv_mobile/` | Flutter, BLoC, Clean Architecture | Inicial |

Puertos fijos: backend `:8088`, frontend `:3010`, postgres `:5438`, pgAdmin `:5058`, MinIO `:9010`.

Ver `.github/instructions/cctv-project.instructions.md` para reglas detalladas por capa.

## Regla crítica: backend es inmutable

El backend Go es un contrato de API fijo. **Nunca proponer cambios en `cctv_server/`.**
Si un endpoint no existe, indicarlo como GAP en lugar de inventar soluciones.
Los GAPs conocidos están documentados en `docs copy/07_API_GAPS_Y_PLACEHOLDERS.md`.

## Build y tests

```powershell
# Levantar todo (Windows)
.\scripts\up.ps1

# Solo frontend
cd cctv_web ; npm install ; npm run dev   # puerto 3010

# Tests frontend
cd cctv_web ; npm test          # Vitest (unit)
cd cctv_web ; npm run e2e       # Playwright (e2e)

# Backend Go
cd cctv_server ; go build ./...
```

## Convenciones por capa

**Frontend (`cctv_web/`)**
- HTTP con `ky` vía `src/lib/api/client.ts` — nunca `fetch` directo ni `axios`
- Estado servidor: TanStack Query v5; estado cliente: Zustand (`src/stores/`)
- Reutilizar `DataTable` y `ExportButton` en `src/components/` antes de crear nuevos
- Tests con Vitest; no usar Jest

**Flutter (`cctv_mobile/`)**
- Estructura `data/domain/presentation` obligatoria por cada feature en `lib/features/`
- Estado con BLoC; DI centralizada en `lib/core/di/`; red en `lib/core/network/`
