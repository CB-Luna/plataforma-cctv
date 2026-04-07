# 15 — Estructura objetivo del monorepo `sistema-camaras-mono`

> Fecha: 2026-04-06 · Actualizado: 2026-04-06
> Estado: **APROBADO CON CONDICIONES — v2 final**

---

## 1. Árbol de carpetas de primer nivel

```
sistema-camaras-mono/
├── .git/                 # ÚNICO repositorio Git (C1)
├── cctv_server/          # Backend Go (copia de symticketscctv/cctv_server, sin .git)
├── cctv_web/             # Frontend Next.js (copia de symticketscctv-next, sin .git)
├── cctv_mobile/          # App Flutter verificada O placeholder README.md (C3)
├── docker/               # Configs de contenedores auxiliares
├── scripts/              # Shell + PowerShell (C5)
├── docs/                 # Documentación unificada del producto
├── .env.example          # Variables de entorno con puertos nuevos (C4)
├── docker-compose.yml    # Compose de desarrollo (puertos distintos)
├── docker-compose.prod.yml # Compose de producción
├── Makefile              # Targets top-level (build, test, up, down, migrate)
├── .gitignore
└── README.md             # Guía de inicio rápido
```

> **Nota (C1)**: Solo hay un `.git/` en la raíz. Las carpetas `.git` de los
> proyectos fuente se excluyen explícitamente en toda copia.
>
> **Nota (C2)**: NO existe `database/` raíz. Las migraciones y queries SQL
> canónicas viven exclusivamente dentro de `cctv_server/internal/database/`.

---

## 2. Detalle de cada carpeta

### 2.1 `cctv_server/` — Backend Go

```
cctv_server/
├── cmd/
│   └── server/
│       └── main.go
├── internal/
│   ├── api/                 # Handlers HTTP (Gin)
│   │   ├── handlers/
│   │   ├── middleware/
│   │   └── routes/
│   ├── config/              # Configuración del servidor
│   ├── database/            # Código generado por sqlc + repositorio (CANÓNICO — C2)
│   │   ├── db.go
│   │   ├── models.go
│   │   ├── queries.sql.go
│   │   ├── migrations/      # ✅ AQUÍ viven las migraciones (Opción A oficial)
│   │   └── queries/         # ✅ AQUÍ viven los .sql fuente para sqlc
│   ├── services/            # Lógica de negocio
│   └── storage/             # Integración MinIO
├── docs/                    # Swagger generado
├── go.mod                   # module github.com/symtickets/cctv_server
├── go.sum
├── sqlc.yaml                # Sin cambios — paths relativos a internal/database/
├── Makefile                 # Targets: build, test, generate, lint
└── Dockerfile
```

**Origen**: `symticketscctv/cctv_server/` — copia directa **excluyendo `.git`
y binarios compilados** (`server`, `cctv_server`, `backfill_media`).

**Sin cambios de imports**: todos los imports usan rutas relativas al módulo
(`github.com/symtickets/cctv_server/internal/...`), que siguen siendo válidas.

**Base de datos (C2)**: Las migraciones (`internal/database/migrations/`) y
queries (`internal/database/queries/`) son el **punto canónico único**.
`sqlc.yaml` permanece aquí sin modificaciones. No se duplica en ninguna
carpeta raíz. Promover a `database/` raíz queda como mejora futura
documentada, no para esta consolidación.

### 2.2 `cctv_web/` — Frontend Next.js

```
cctv_web/
├── src/
│   ├── app/                 # App Router (layouts, pages, route groups)
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   │   ├── inventory/
│   │   │   ├── floor-plans/
│   │   │   ├── capex/
│   │   │   ├── reports/
│   │   │   └── settings/
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/          # Componentes reutilizables (shadcn v4)
│   │   ├── ui/
│   │   ├── forms/
│   │   ├── floor-plan/
│   │   └── inventory/
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utilidades y API client
│   │   └── api/
│   │       ├── client.ts    # ky con NEXT_PUBLIC_API_URL
│   │       ├── cameras.ts
│   │       ├── nvrs.ts
│   │       └── ...
│   ├── stores/              # Estado global (Zustand)
│   ├── types/               # Tipos TypeScript
│   └── __tests__/           # Unit tests (Vitest)
├── e2e/                     # Tests Playwright
├── public/                  # Assets estáticos
├── scripts/                 # seed-demo.ts, verify-api.ps1
├── docs/                    # Docs del frontend (se podría mover a docs/ raíz)
├── next.config.ts           # output: "standalone"
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vitest.config.ts
├── playwright.config.ts
└── Dockerfile               # Multi-stage (node:22-alpine)
```

**Origen**: `symticketscctv-next/` — copia directa **excluyendo `.git/`,
`.next/`, `node_modules/`, `test-results/`**.

**Sin cambios de imports**: todos los imports TypeScript usan alias `@/` que
apunta a `src/`, estructura interna no cambia.

**Ajuste de puertos (C4)**: Se actualiza `.env` local con
`NEXT_PUBLIC_API_URL=http://localhost:8088/api/v1` y el dev server arranca en
puerto **3010**.

### 2.3 `cctv_mobile/` — App Flutter (condicional — C3)

**Criterio estricto de inclusión**:
La carpeta solo se copia si `symticketscctv/symtickets_mobile/` cumple TODAS estas condiciones:

1. Existe `pubspec.yaml` con dependencias Flutter reales
2. Existe `lib/features/` con al menos un módulo (auth, home, tickets)
3. Existe `lib/main.dart` con contenido real (no placeholder vacío)

**Si se cumple** → copia completa:

```
cctv_mobile/
├── lib/
│   ├── core/                # DI, red, almacenamiento, tema
│   ├── features/
│   │   ├── auth/            # Login, token management
│   │   ├── home/            # Dashboard móvil
│   │   └── tickets/         # Gestión de tickets CCTV
│   └── main.dart
├── test/
├── pubspec.yaml             # flutter_bloc, dio, go_router, geolocator...
├── pubspec.lock
└── analysis_options.yaml
```

> **EXCLUIR** de la copia: `.git`, carpetas `android/` e `ios/` del root de
> `symticketscctv/` (pertenecen al placeholder Flutter vacío, NO a la app real).
> Solo copiar `android/`/`ios/` si existen **dentro** de `symtickets_mobile/` con
> contenido propio verificable.

**Si NO se cumple** → placeholder:

```
cctv_mobile/
└── README.md    # Documenta: "Pendiente de integración. Ver doc 14 §C3"
```

**Sin cambios de imports**: rutas internas (`package:symtickets_mobile/...`)
se mantienen. NO renombrar el paquete en esta consolidación.

### 2.4 `docker/` — Configuración de contenedores

```
docker/
├── postgres/
│   └── init.sql             # Script de inicialización (create DB, extensions)
├── backend/
│   └── Dockerfile           # (opcional, si se usa Dockerfile central)
└── nginx/                   # (futuro, para reverse proxy en producción)
```

**Origen**: `symticketscctv/docker/` (postgres/, backend/) — **excluyendo `.git`**.
Los Dockerfiles de cada servicio (`cctv_server/Dockerfile`, `cctv_web/Dockerfile`)
quedan junto a su código fuente.

### 2.5 `scripts/` — Shell + PowerShell (C5)

```
scripts/
├── # === Scripts shell (Linux/macOS/WSL) ===
├── build-production.sh      # Build del backend para producción
├── generate-secrets.sh      # Generación de secretos seguros
├── health-check.sh          # Verificación de salud de servicios
├── migrate.sh               # Ejecutar migraciones
├── setup.sh                 # Setup inicial del proyecto
├── start-backend-local.sh   # Levantar backend sin Docker
├── seed-demo.ts             # Seed de datos de demostración (del frontend)
├── verify-api.ps1           # Verificación de endpoints API
│
├── # === Scripts PowerShell (Windows-first — C5) ===
├── up.ps1                   # docker compose up -d (con puertos monorepo)
├── down.ps1                 # docker compose down
├── check-services.ps1       # Health check de todos los servicios
├── dev-web.ps1              # Levantar frontend Next.js en modo dev
└── dev-backend.ps1          # Levantar backend Go en modo dev
```

**Origen shell**: Selección de `symticketscctv/scripts/` + `symticketscctv-next/scripts/`.
**Origen PowerShell**: **Nuevos** — creados durante la consolidación para
garantizar experiencia nativa en Windows.

### 2.6 `docs/`

```
docs/
├── ARQUITECTURA_TECNICA.md
├── GUIA_INICIO_RAPIDO.md
├── GUIA_MULTI_TENANT.md
├── DEPLOYMENT.md
├── ESTRUCTURA_PROYECTO.md   # Actualizado para reflejar el monorepo
├── API_DOCUMENTATION.md     # Referencia a Swagger generado
└── ...                      # Documentos seleccionados de ambos proyectos
```

**Origen**: Merge selectivo de `symticketscctv/documentation/` (35+ archivos) y
`symticketscctv-next/docs/` (15 archivos).

**Criterio de selección**: incluir documentos vigentes, excluir análisis
obsoletos o duplicados.

---

## 3. Archivos raíz

### 3.1 `docker-compose.yml` (desarrollo — puertos nuevos C4)

Servicios consolidados con **puertos distintos** a los proyectos originales
para permitir validación en paralelo:

| Servicio | Imagen | Puerto original | **Puerto monorepo** | Notas |
|---|---|---|---|---|
| `postgres` | `postgres:16-alpine` | 5437 | **5438** | Con healthcheck |
| `migrate` | `migrate/migrate` | — | — | Aplica migraciones al arrancar |
| `valkey` | `valkey/valkey:8-alpine` | 6387 | **6388** | Cache compatible Redis |
| `nats` | `nats:latest` | 4227/8227 | **4228/8228** | Mensajería (API/monitoring) |
| `minio` | `minio/minio` | 9007/9008 | **9009/9010** | Object storage (fotos, planos) |
| `pgadmin` | `dpage/pgadmin4` | 5057 | **5058** | Admin de BD |
| `backend` | Build desde `cctv_server/` | 8087 | **8088** | API Go |
| `frontend` | Build desde `cctv_web/` | 3000 | **3010** | Next.js dev server |

**Cambios clave respecto al compose original**:
```yaml
# Red propia del monorepo (no colisiona con symtickets-network)
networks:
  sistema-camaras-network:
    driver: bridge

# Volúmenes con prefijo mono_ para no compartir datos
volumes:
  mono_postgres_data:
  mono_minio_data:

backend:
  build:
    context: ./cctv_server
    dockerfile: Dockerfile
  ports:
    - "8088:8087"          # Puerto host distinto, interno igual
  networks:
    - sistema-camaras-network

frontend:
  build:
    context: ./cctv_web
    dockerfile: Dockerfile
  ports:
    - "3010:3000"          # Puerto host distinto, interno igual
  environment:
    - NEXT_PUBLIC_API_URL=http://localhost:8088/api/v1
  networks:
    - sistema-camaras-network
```

### 3.2 `.env.example` (puertos actualizados — C4)

```env
# Base de datos
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=symtickets
POSTGRES_PASSWORD=change_me
POSTGRES_DB=symtickets_cctv

# Puertos host (distintos a originales para validación en paralelo)
POSTGRES_HOST_PORT=5438
BACKEND_HOST_PORT=8088
FRONTEND_HOST_PORT=3010
VALKEY_HOST_PORT=6388
NATS_HOST_PORT=4228
NATS_MONITOR_PORT=8228
MINIO_HOST_PORT=9009
MINIO_CONSOLE_PORT=9010
PGADMIN_HOST_PORT=5058

# Backend
API_PORT=8087
JWT_SECRET=change_me
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
NATS_URL=nats://nats:4222
VALKEY_URL=valkey:6379

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8088/api/v1
```

### 3.3 `Makefile` (raíz)

```makefile
# === Monorepo top-level targets ===
.PHONY: up down build test migrate seed

up:
	docker compose up -d

down:
	docker compose down

build-backend:
	cd cctv_server && go build -o bin/server ./cmd/server

build-web:
	cd cctv_web && npm install && npm run build

test-backend:
	cd cctv_server && go test ./...

test-web:
	cd cctv_web && npm test

migrate-up:
	docker compose up migrate

seed:
	cd cctv_web && npx tsx scripts/seed-demo.ts

sqlc-generate:
	cd cctv_server && sqlc generate
```

> **Nota (C5)**: Todos estos targets también están disponibles como scripts
> PowerShell en `scripts/*.ps1` para uso directo en Windows sin Make.

---

## 4. Mapa de origen → destino

| Archivo/Carpeta fuente | Destino en monorepo | Acción | Exclusiones |
|---|---|---|---|
| `symticketscctv/cctv_server/` | `cctv_server/` | Copia recursiva | **`.git`**, binarios (`server`, `cctv_server`, `backfill_media`) |
| (incluye `internal/database/migrations/` y `queries/`) | (se mantiene dentro de `cctv_server/`) | Incluido en copia anterior | — |
| `symticketscctv-next/` | `cctv_web/` | Copia recursiva filtrada | **`.git`**, `.next/`, `node_modules/`, `test-results/` |
| `symticketscctv/symtickets_mobile/` | `cctv_mobile/` | **Condicional** (C3) | **`.git`**, `android/`/`ios/` dudosos |
| `symticketscctv/docker/` | `docker/` | Copia recursiva | **`.git`** |
| `symticketscctv/scripts/*.sh` | `scripts/` | Copia selectiva | — |
| `symticketscctv-next/scripts/*` | `scripts/` | Copia selectiva | — |
| — | `scripts/*.ps1` | **Nuevos** (C5) | — |
| `symticketscctv/docker-compose.yml` | `docker-compose.yml` (raíz) | Copia + ajuste paths + **puertos nuevos** (C4) | — |
| `symticketscctv/docker-compose.prod.yml` | `docker-compose.prod.yml` (raíz) | Copia + ajuste paths | — |
| `symticketscctv/documentation/` (selección) | `docs/` | Copia selectiva | — |
| `symticketscctv-next/docs/` (selección) | `docs/` | Copia selectiva | — |
| — | `Makefile` (raíz) | Nuevo (basado en original) | — |
| — | `.env.example` | Nuevo (puertos nuevos) | — |
| — | `README.md` | Nuevo | — |
| — | `.gitignore` | Nuevo (unión de ambos) | — |
| — | `git init` | Nuevo repositorio (C1) | — |

> **Eliminados del plan original**: `database/` raíz (C2), `database/sqlc.yaml`
> raíz, `database/README.md`. Todo vive dentro de `cctv_server/`.
