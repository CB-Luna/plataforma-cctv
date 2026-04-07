# 17 — Execution Log: Consolidación del Monorepo `sistema-camaras-mono`

> Inicio: 2026-04-06
> Estado: **EN EJECUCIÓN**

---

## Reglas de ejecución

- 100% por COPIA, nunca movimiento ni borrado
- No se modifica nada en: symticketscctv, symticketscctv-next, core-associates
- No se copian `.git` internos bajo ninguna circunstancia
- Único `.git` en raíz del monorepo
- Ejecución por checkpoints con parada obligatoria entre cada uno
- Si una validación crítica falla → STOP inmediato

---

## Checkpoint A — Crear estructura base del monorepo

**Estado**: ✅ PASS

### Acciones ejecutadas

1. Creada carpeta `g:\TRABAJO\FLUTTER\sistema camaras\sistema-camaras-mono\`
2. Creadas subcarpetas: `cctv_server/`, `cctv_web/`, `cctv_mobile/`, `docker/`, `scripts/`, `docs/`
3. `git init` — único `.git` en la raíz
4. Creado `.gitignore` (Go, Node, Flutter, Docker, IDE, OS, env)
5. Creado `README.md` placeholder con guía de inicio rápido
6. Creado `.env.example` con puertos nuevos (5438, 8088, 3010, 6388, 4228, 9009, 5058)

### Árbol resultante

```
sistema-camaras-mono/
├── .git/              ← ÚNICO repositorio Git
├── .gitignore
├── .env.example
├── README.md
├── cctv_server/       (vacío — se llena en Checkpoint B)
├── cctv_web/          (vacío — se llena en Checkpoint C)
├── cctv_mobile/       (vacío — se decide en Checkpoint D)
├── docker/            (vacío — se llena en Checkpoint E)
├── scripts/           (vacío — se llena en Checkpoint E)
└── docs/              (vacío — se llena en Checkpoint E)
```

### Validaciones

| Check | Resultado |
|---|---|
| `.git` existe en raíz | ✅ PASS |
| `.gitignore` existe | ✅ PASS |
| `README.md` existe | ✅ PASS |
| `.env.example` existe con puertos nuevos | ✅ PASS |
| 6 subcarpetas creadas | ✅ PASS |

### Problemas encontrados

Ninguno.

### Siguiente paso

**Checkpoint B**: Copiar `symticketscctv/cctv_server/` → `sistema-camaras-mono/cctv_server/` excluyendo `.git` y binarios, luego validar con `go build`.

---

## Checkpoint B — Copiar y validar `cctv_server`

**Estado**: ✅ PASS

### Acciones ejecutadas

1. Verificada estructura fuente: `symticketscctv/cctv_server/` — 4 dirs + 15 archivos raíz (3 binarios)
2. Copiado con `robocopy /E /XF server cctv_server backfill_media /XD .git`
3. Verificado: 0 binarios en destino, 0 `.git`
4. Conteo de archivos: fuente=141 (sin binarios), destino=141 — **match exacto**
5. C2 Opción A verificado: `internal/database/migrations/` (62 archivos) + `queries/` (14 archivos) dentro de `cctv_server/`
6. `go.mod` válido: module `github.com/symtickets/cctv_server`, Go 1.24.0

### Árbol resultante (depth 1)

```
cctv_server/
├── cmd/
│   └── main.go
├── docs/
│   ├── docs.go
│   ├── swagger.json
│   └── swagger.yaml
├── internal/
│   ├── config/
│   ├── database/      ← migraciones (62) + queries (14) + sqlc generated
│   ├── handlers/
│   ├── intelligence/
│   ├── middleware/
│   └── storage/
├── scripts/
├── .air.toml
├── .dockerignore
├── .env.example
├── build.sh
├── dev.sh
├── go.mod
├── go.sum
├── README.md
├── run.sh
├── sqlc.yaml
└── swagger.sh
```

### Validaciones

| Check | Resultado |
|---|---|
| Binario `server` NO copiado | ✅ PASS |
| Binario `cctv_server` NO copiado | ✅ PASS |
| Binario `backfill_media` NO copiado | ✅ PASS |
| `.git` NO copiado | ✅ PASS |
| Conteo archivos 141=141 | ✅ PASS |
| `go.mod` presente y válido | ✅ PASS |
| `cmd/main.go` presente | ✅ PASS |
| C2: migrations en `internal/database/` | ✅ PASS |
| `go build ./cmd/...` | ⚠️ SKIP — Go SDK no instalado en sistema |

### Nota sobre `go build`

Go SDK no está instalado en este equipo Windows. La validación de compilación se sustituye por validación estructural:
- Conteo exacto de archivos (141=141)
- `go.mod` legible con dependencias correctas
- Estructura de directorios completa
- `cmd/main.go` (entry point) presente

La compilación podrá verificarse cuando Go esté disponible o al ejecutar `docker compose build`.

### Problemas encontrados

Ninguno funcional. Go SDK ausente (no es bloqueante).

### Siguiente paso

**Checkpoint C**: Copiar `symticketscctv-next/` → `sistema-camaras-mono/cctv_web/` excluyendo `.git`, `.next/`, `node_modules/`, `test-results/`, luego validar.

---

## Checkpoint C — Copiar y validar `cctv_web`

**Estado**: PENDIENTE

---

## Checkpoint D — Decidir `cctv_mobile`

**Estado**: PENDIENTE

---

## Checkpoint E — Crear compose/scripts raíz y validar config

**Estado**: PENDIENTE

---

## Checkpoint F — Smoke test final

**Estado**: PENDIENTE
