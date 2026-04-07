# 14 — Plan de Consolidación: Monorepo `sistema-camaras-mono`

> Fecha: 2026-04-06 · Actualizado: 2026-04-06
> Estado: **APROBADO CON CONDICIONES — v2 final**

---

## 0. Condiciones obligatorias previas a ejecución

Estas condiciones fueron impuestas en la revisión y son **de cumplimiento
obligatorio**. No se ejecuta ningún paso de migración sin que todas estén
reflejadas en el plan.

| # | Condición | Estado |
|---|---|---|
| C1 | **Excluir `.git` internos** — Un solo `.git` en la raíz del monorepo. Las carpetas `.git` de los proyectos fuente NO se copian bajo ninguna circunstancia | ✅ Integrado |
| C2 | **Base de datos: Opción A oficial** — Migraciones y queries se mantienen dentro de `cctv_server/internal/database/`. NO se crea `database/` raíz en esta consolidación | ✅ Integrado |
| C3 | **`cctv_mobile/` solo si es verificable** — Se copia únicamente si `symtickets_mobile/` contiene una app Flutter real con `lib/features/`, `pubspec.yaml` y estructura comprobable. Si no, se crea `cctv_mobile/README.md` como placeholder. No se copian carpetas `android/`/`ios/` dudosas | ✅ Integrado |
| C4 | **Puertos distintos para validación en paralelo** — El monorepo usa puertos diferentes a los proyectos originales para poder validar sin apagar nada | ✅ Integrado |
| C5 | **Scripts PowerShell obligatorios** — Además de Makefile y shell scripts, se incluyen `up.ps1`, `down.ps1`, `check-services.ps1`, `dev-web.ps1`, `dev-backend.ps1` porque el entorno principal es Windows | ✅ Integrado |
| C6 | **Ejecución con checkpoints obligatorios** — Cada bloque requiere validación exitosa antes de avanzar al siguiente. No se ejecuta la consolidación de golpe | ✅ Integrado |

---

## 1. Objetivo

Consolidar los artefactos activos del sistema CCTV en un único monorepo
llamado `sistema-camaras-mono`, sin destruir ni modificar los repositorios fuente
originales.

El resultado será un repositorio con un **único `.git`** que cualquier
desarrollador pueda clonar y levantar el sistema completo (backend Go +
frontend Next.js + base de datos + servicios auxiliares) con un solo
`docker compose up`.

---

## 2. Qué entra al monorepo final

| Carpeta destino | Fuente | Descripción |
|---|---|---|
| `cctv_server/` | `symticketscctv/cctv_server/` (sin `.git`) | Backend Go 1.24 (Gin, sqlc, pgx, MinIO, Swagger). Incluye migraciones y queries SQL dentro de `internal/database/` (Opción A) |
| `cctv_web/` | `symticketscctv-next/` (sin `.next/`, `node_modules/`, `.git`) | Frontend Next.js 16 (React 19, Tailwind 4, shadcn v4) |
| `cctv_mobile/` | `symticketscctv/symtickets_mobile/` (sin `.git`) | **Condicional**: solo si se verifica como app Flutter real. Si no, placeholder `README.md` |
| `docker/` | `symticketscctv/docker/` | Configuración de contenedores auxiliares (postgres init, etc.) |
| `scripts/` | Selección de ambos proyectos + **scripts .ps1 nuevos** | Scripts shell + **PowerShell** de build, seed, deploy, salud |
| `docs/` | Merge de documentación relevante de ambos proyectos | Documentación unificada del producto |

> **Eliminado**: `database/` raíz. Las migraciones y queries canónicas viven
> exclusivamente dentro de `cctv_server/internal/database/` (Condición C2).

---

## 3. Qué se queda fuera

| Elemento | Razón |
|---|---|
| **Carpetas `.git` de proyectos fuente** | **CRÍTICO (C1)**: Se excluyen explícitamente. El monorepo tendrá un único `.git` inicializado en su raíz. Copiar `.git` internos crearía nested repos corruptos |
| `core-associates/` completo | Proyecto de otro dominio. Se usa SOLO como referencia de organización. No se copia nada de su código ni lógica de negocio |
| `database/` como carpeta raíz | **C2**: No se duplica esquema. Las migraciones viven en `cctv_server/internal/database/` únicamente |
| `symticketscctv/lib/main.dart` (app raíz Flutter) | Placeholder vacío del monorepo original. La app real está en `symtickets_mobile/` |
| `symticketscctv/android/`, `symticketscctv/ios/` (del root) | Pertenecen al placeholder Flutter vacío, no a la app real |
| `symticketscctv/webcctv_frontend/` | Frontend legacy reemplazado por `symticketscctv-next` |
| `symticketscctv/webcctv-next/` | Carpeta vacía |
| `symticketscctv/build/` | Artefactos de compilación |
| `symticketscctv-next/.next/` | Cache de Next.js |
| `symticketscctv-next/node_modules/` | Dependencias (se regeneran con `npm install`) |
| Binarios compilados (`server`, `cctv_server`, `backfill_media`) | Se reconstruyen con `go build` |
| Datos de volumen Docker | Se recrean al levantar servicios |

---

## 4. Principios de seguridad de la migración

### 4.1 Copia, nunca movimiento
Todos los archivos se **copian** al nuevo monorepo. Los proyectos fuente
(`symticketscctv/`, `symticketscctv-next/`) NO se tocan, no se les borra ni
un archivo.

### 4.2 Exclusión explícita de `.git` (C1)
Cada copia recursiva **excluye** la carpeta `.git` del proyecto fuente.
El monorepo final tiene un único `git init` propio en su raíz.

### 4.3 Rollback trivial
Si la consolidación falla, se borra `sistema-camaras-mono/` y todo queda
exactamente como estaba. Los originales nunca fueron modificados.

### 4.4 Sin cambio de dominio
El monorepo sigue siendo un sistema CCTV. No se renombra a Core Associates ni
se importa lógica de negocio de terceros.

### 4.5 Ajustes mínimos de paths
Solo se modifican paths en archivos de configuración que lo requieran:
- `docker-compose.yml` (rutas de volúmenes, build contexts y **puertos**)
- `.env.example` (API URL, **puertos nuevos**)
- `next.config.ts` (sin cambios previstos)
- `go.mod` (sin cambios — module path stays `github.com/symtickets/cctv_server`)
- `sqlc.yaml` (sin cambios — se mantiene dentro de `cctv_server/`, Opción A)

Los imports internos de Go y TypeScript **no cambian** porque las carpetas
internas mantienen su estructura.

### 4.6 Puertos distintos para validación en paralelo (C4)
El monorepo usa puertos **diferentes** a los proyectos originales para
permitir validación sin apagar el entorno actual:

| Servicio | Puerto original | Puerto monorepo |
|---|---|---|
| PostgreSQL | 5437 | **5438** |
| Backend API | 8087 | **8088** |
| Frontend | 3000 | **3010** |
| Valkey | 6387 | **6388** |
| NATS API | 4227 | **4228** |
| NATS Monitor | 8227 | **8228** |
| MinIO API | 9007 | **9009** |
| MinIO Console | 9008 | **9010** |
| pgAdmin | 5057 | **5058** |

### 4.7 Validación con checkpoints obligatorios (C6)
La ejecución NO se hace de golpe. Cada bloque de copia requiere una
validación exitosa documentada antes de avanzar al siguiente paso.
Si un checkpoint falla, se detiene y se diagnostica.

---

## 5. Criterios de éxito

La consolidación se considera **exitosa** cuando:

| # | Criterio | Verificación |
|---|---|---|
| 1 | `sistema-camaras-mono/` existe con un único `.git` en la raíz | `Test-Path .git` + `!(Test-Path cctv_server\.git)` |
| 2 | `cctv_web/`: `npm install && npm run build` compila sin errores | Exit code 0 |
| 3 | `cctv_web/`: `npm test` — todos los unit tests pasan | 45+ tests pass |
| 4 | `cctv_server/`: `go build ./cmd/...` compila sin errores | Exit code 0 |
| 5 | `docker compose up postgres` levanta en **puerto 5438** | Health check pass |
| 6 | `docker compose up migrate` aplica migraciones | Exit code 0 |
| 7 | Backend responde en **puerto 8088** | `curl http://localhost:8088/api/v1/health` |
| 8 | Frontend responde en **puerto 3010** | `curl http://localhost:3010` |
| 9 | Los archivos fuente originales siguen intactos | `git status` = clean en ambos repos |
| 10 | Los proyectos originales pueden seguir corriendo en sus puertos originales sin conflicto | Verificación manual |
| 11 | `cctv_mobile/` tiene código Flutter verificado O placeholder `README.md` documentado | Verificación manual |
| 12 | Un README raíz explica cómo levantar todo | Existe y es legible |
| 13 | `.env.example` documenta todas las variables con puertos nuevos | Verificación manual |
| 14 | Existen scripts `.ps1` funcionales para Windows | `Test-Path scripts/*.ps1` |

---

## 6. Fases de ejecución (con checkpoints obligatorios)

| Fase | Contenido | Checkpoint de salida | Gatillo |
|---|---|---|---|
| **Fase 1** ✅ | Generar 3 documentos de planificación | Docs entregados | Completada |
| **Fase 2** ✅ | Revisión y ajustes obligatorios | Condiciones C1-C6 integradas | Completada (este doc) |
| **Fase 3** | **Crear carpeta base + copiar backend** | `go build ./cmd/...` pasa | Aprobación del usuario |
| **🔒 CHECKPOINT A** | *Validar backend compilado antes de continuar* | | |
| **Fase 4** | **Copiar frontend** | `npm run build` + `npm test` pasan | Post-Checkpoint A |
| **🔒 CHECKPOINT B** | *Validar frontend compilado y tests verdes* | | |
| **Fase 5** | **Decidir y cerrar `cctv_mobile/`** | Flutter verificado o placeholder creado | Post-Checkpoint B |
| **🔒 CHECKPOINT C** | *Mobile resuelto* | | |
| **Fase 6** | **Crear compose raíz con puertos nuevos** | `docker compose config` pasa + servicios levantan | Post-Checkpoint C |
| **🔒 CHECKPOINT D** | *Compose validado, servicios responden en puertos nuevos* | | |
| **Fase 7** | **Integrar scripts (shell + PS1), docs, Makefile, README** | Scripts ejecutables, docs completos | Post-Checkpoint D |
| **Fase 8** | **Smoke test final** | TODOS los criterios de §5 cumplen | Cierre |

**No se ejecuta Fase 3 sin aprobación explícita del usuario.**
**No se avanza de un checkpoint al siguiente sin validación exitosa.**
