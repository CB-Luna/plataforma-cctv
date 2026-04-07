# sistema-camaras-mono

Monorepo consolidado del sistema CCTV. Contiene backend Go, frontend Next.js,
app móvil Flutter y configuración de infraestructura.

> **Estado**: En consolidación inicial.

## Estructura

```
cctv_server/   — Backend Go 1.24 (Gin, sqlc, pgx, MinIO)
cctv_web/      — Frontend Next.js 16 (React 19, Tailwind 4, shadcn v4)
cctv_mobile/   — App Flutter (BLoC, Clean Architecture)
docker/        — Configuración de contenedores auxiliares
scripts/       — Scripts shell + PowerShell
docs/          — Documentación unificada
```

## Inicio rápido

### Con Docker (recomendado)

```bash
cp .env.example .env
docker compose up -d
```

### Con PowerShell (Windows)

```powershell
Copy-Item .env.example .env
.\scripts\up.ps1
```

### Servicios (puertos del monorepo)

| Servicio | Puerto |
|----------|--------|
| Backend API | http://localhost:8088 |
| Frontend | http://localhost:3010 |
| PostgreSQL | localhost:5438 |
| pgAdmin | http://localhost:5058 |
| MinIO Console | http://localhost:9010 |

## Desarrollo individual

```bash
# Backend
cd cctv_server && go run ./cmd/server

# Frontend
cd cctv_web && npm install && npm run dev

# Tests frontend
cd cctv_web && npm test
```
