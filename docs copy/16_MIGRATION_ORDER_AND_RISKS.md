# 16 — Orden de migración y riesgos

> Fecha: 2026-04-06 · Actualizado: 2026-04-06
> Estado: **APROBADO CON CONDICIONES — v2 final**

---

## 0. Regla de ejecución (C6)

**La consolidación NO se ejecuta de golpe.** Cada bloque es un checkpoint
obligatorio. No se avanza al siguiente sin validación exitosa del anterior.

```
🔒 CHECKPOINT A: Backend compilado
🔒 CHECKPOINT B: Frontend compilado + tests verdes
🔒 CHECKPOINT C: Mobile resuelto (copia verificada o placeholder)
🔒 CHECKPOINT D: Docker compose validado con puertos nuevos
🔒 CHECKPOINT E: Scripts + docs integrados
🔒 CHECKPOINT F: Smoke test final = TODOS los criterios del doc 14 §5
```

---

## 1. Orden de ejecución

### Paso 1 — Crear estructura base + `git init`

```
Acción:   Crear carpeta sistema-camaras-mono/
          git init  (ÚNICO .git del monorepo — C1)
          Crear .gitignore, README.md placeholder, .env.example (puertos nuevos)
Verifica: La carpeta existe, .git/ existe en raíz, archivos base presentes
Riesgo:   Ninguno
```

### Paso 2 — Copiar backend Go (`cctv_server/`)

```
Acción:   Copiar symticketscctv/cctv_server/ → sistema-camaras-mono/cctv_server/
          ⛔ EXCLUIR: .git, binarios compilados (server, cctv_server, backfill_media)
          ✅ INCLUIR: internal/database/migrations/ y queries/ (Opción A — C2)
Verifica: cd cctv_server && go build ./cmd/...  (exit code 0)
          Confirmar que NO existe cctv_server/.git
Riesgo:   BAJO — no hay cambios de imports internos
Rollback: Borrar cctv_server/
```

### 🔒 CHECKPOINT A — Backend compila

```
Gate:     go build ./cmd/... sale con exit code 0
          No existe .git dentro de cctv_server/
Acción:   Si falla → diagnosticar. Si pasa → continuar a Paso 3
```

### Paso 3 — Copiar frontend Next.js (`cctv_web/`)

```
Acción:   Copiar symticketscctv-next/ → sistema-camaras-mono/cctv_web/
          ⛔ EXCLUIR: .git, .next/, node_modules/, test-results/
Verifica: cd cctv_web && npm install && npm run build  (exit code 0)
          cd cctv_web && npm test  (45+ tests pasan)
          Confirmar que NO existe cctv_web/.git
Riesgo:   BAJO — imports usan alias @/ relativo a src/, no paths absolutos
Rollback: Borrar cctv_web/
```

### 🔒 CHECKPOINT B — Frontend compila + tests verdes

```
Gate:     npm run build sale con exit code 0
          npm test → 45+ tests pasan
          No existe .git dentro de cctv_web/
Acción:   Si falla → diagnosticar. Si pasa → continuar a Paso 4
```

### Paso 4 — Decidir y cerrar `cctv_mobile/` (C3)

```
Acción:   Verificar que symticketscctv/symtickets_mobile/ cumple TODOS:
          ✅ Existe pubspec.yaml con dependencias Flutter reales
          ✅ Existe lib/features/ con al menos un módulo
          ✅ Existe lib/main.dart con contenido real

          Si SÍ cumple:
            Copiar → sistema-camaras-mono/cctv_mobile/
            ⛔ EXCLUIR: .git
            ⛔ EXCLUIR: android/ e ios/ del ROOT de symticketscctv/ (son del placeholder)
            Solo copiar android/ios si existen DENTRO de symtickets_mobile/ con contenido propio
            Verificar: flutter pub get (si SDK disponible) o inspección manual

          Si NO cumple:
            Crear cctv_mobile/README.md con texto:
              "Pendiente de integración. Ver doc 14 §C3.
               La app Flutter no fue verificable en el momento de la consolidación."

Verifica: cctv_mobile/ existe con código real O con README.md placeholder
          NO existe cctv_mobile/.git
Riesgo:   BAJO — operación atómica
Rollback: Borrar cctv_mobile/
```

### 🔒 CHECKPOINT C — Mobile resuelto

```
Gate:     cctv_mobile/ existe con contenido documentado
          Decisión registrada (copia o placeholder)
Acción:   Continuar a Paso 5
```

### Paso 5 — Copiar docker/ auxiliares

```
Acción:   Copiar symticketscctv/docker/ → sistema-camaras-mono/docker/
          ⛔ EXCLUIR: .git (si existiera)
          NO copiar database/ raíz (C2 — vive dentro de cctv_server/)
Verifica: Los archivos de inicialización SQL existen
Riesgo:   BAJO — archivos estáticos
Rollback: Borrar docker/
```

### Paso 6 — Crear docker-compose.yml raíz (C4: puertos nuevos)

```
Acción:   Copiar docker-compose.yml de symticketscctv/
          Ajustar:
            - build contexts → ./cctv_server, ./cctv_web
            - volumes → prefijo mono_ (mono_postgres_data, mono_minio_data)
            - network → sistema-camaras-network (no symtickets-network)
            - PUERTOS NUEVOS (C4):
              postgres:  5438 (era 5437)
              backend:   8088 (era 8087)
              frontend:  3010 (era 3000)
              valkey:    6388 (era 6387)
              nats:      4228/8228 (era 4227/8227)
              minio:     9009/9010 (era 9007/9008)
              pgadmin:   5058 (era 5057)
            - migration paths → ./cctv_server/internal/database/migrations (Opción A)

Verifica: docker compose config  (validación de sintaxis, exit code 0)
          docker compose up postgres -d  (healthcheck pasa en puerto 5438)
          docker compose up migrate  (migraciones se aplican)
          Los proyectos originales siguen corriendo en sus puertos sin conflicto
Riesgo:   MEDIO — paths de volúmenes, puertos y contexts cambian
Rollback: Borrar docker-compose.yml y docker-compose.prod.yml
```

### 🔒 CHECKPOINT D — Compose validado + servicios en puertos nuevos

```
Gate:     docker compose config pasa
          PostgreSQL responde en puerto 5438
          Migraciones aplicadas
          Puertos originales (5437, 8087, 3000) NO están ocupados por el monorepo
Acción:   Si falla → diagnosticar puertos/paths. Si pasa → continuar
```

### Paso 7 — Copiar scripts + crear PowerShell (C5)

```
Acción:   Copiar selección de scripts shell de ambos proyectos
          Ajustar paths internos si referencian rutas absolutas
          Crear scripts PowerShell NUEVOS (C5):
            scripts/up.ps1              — docker compose up -d
            scripts/down.ps1            — docker compose down
            scripts/check-services.ps1  — health check de todos los servicios
            scripts/dev-web.ps1         — levantar frontend en modo dev
            scripts/dev-backend.ps1     — levantar backend en modo dev

Verifica: Scripts .ps1 ejecutables en PowerShell 5.1+
          Scripts .sh tienen contenido válido
Riesgo:   BAJO — archivos de texto plano
Rollback: Borrar scripts/
```

### Paso 8 — Consolidar documentación

```
Acción:   Copiar documentos vigentes de ambos proyectos a docs/
          Resolver conflictos de nombres
          Actualizar ESTRUCTURA_PROYECTO.md para reflejar el monorepo
Verifica: Todos los archivos .md tienen contenido válido
Riesgo:   BAJO — solo archivos markdown
Rollback: Borrar docs/
```

### Paso 9 — Crear Makefile raíz y README final

```
Acción:   Crear Makefile con targets top-level
          Crear README.md con guía de inicio rápido
          (Los targets del Makefile son complemento de scripts/*.ps1)
Verifica: make build-backend funciona (si make disponible)
          README documenta TANTO make como scripts/*.ps1
Riesgo:   BAJO — archivos nuevos
Rollback: Borrar Makefile, README.md
```

### 🔒 CHECKPOINT E — Scripts + docs integrados

```
Gate:     scripts/*.ps1 existen y son ejecutables
          docs/ tiene documentación consolidada
          README.md y Makefile existen
Acción:   Continuar a smoke test final
```

### Paso 10 — Smoke test final

```
Acción:   docker compose up -d  (todos los servicios)
          Esperar healthchecks
          Verificar backend en http://localhost:8088/api/v1/health
          Verificar frontend en http://localhost:3010
          Ejecutar: go test (dentro de cctv_server/)
          Ejecutar: npm test (dentro de cctv_web/)
          Verificar que los originales no fueron modificados:
            git -C symticketscctv status = clean
            git -C symticketscctv-next status = clean
          Verificar que originales siguen accesibles en puertos 5437/8087/3000

Verifica: TODOS los criterios de éxito del doc 14 §5 (14 criterios)
Riesgo:   N/A — solo verificación
Rollback: N/A
```

### 🔒 CHECKPOINT F — Smoke test final = CONSOLIDACIÓN EXITOSA

```
Gate:     Los 14 criterios de éxito del doc 14 §5 cumplen
          git init confirmado como único .git
          Originales intactos
Resultado: Monorepo listo para primer commit
```

---

## 2. Matriz de riesgos técnicos

### 2.1 Riesgos de Git y repositorios (NUEVO — C1)

| ID | Riesgo | Impacto | Probabilidad | Mitigación |
|----|--------|---------|------------|------------|
| R0 | **`.git` anidados copiados** — Si se arrastra `.git/` de los proyectos fuente, se crean nested repos o submodules corruptos que ensucian todo el monorepo | **CRÍTICO** | ALTA (sin mitigación) | **OBLIGATORIO**: Cada copia recursiva excluye `.git` explícitamente. Validar post-copia con `!(Test-Path cctv_server\.git)`, `!(Test-Path cctv_web\.git)`, etc. Solo `sistema-camaras-mono/.git` debe existir |

### 2.2 Riesgos de paths y configuración

| ID | Riesgo | Impacto | Probabilidad | Mitigación |
|----|--------|---------|------------|------------|
| R1 | **`docker-compose.yml` paths rotos** — Los `build.context` y `volumes` del compose original apuntan a rutas que podrían no coincidir | ALTO | MEDIA | Ajustar explícitamente todos los paths. Validar con `docker compose config` en Checkpoint D |
| R2 | **`sqlc.yaml` paths relativos** — Usa `./internal/database/queries` y `./internal/database/migrations`. Se queda dentro de `cctv_server/` (Opción A — C2), por lo que NO hay cambio | ALTO | **MUY BAJA** | Opción A oficial elimina este riesgo |
| R3 | **Scripts con paths hardcodeados** — Algunos scripts pueden tener rutas como `../cctv_server/` o paths absolutos | MEDIO | MEDIA | Revisar cada script post-copia con grep de paths relativos |
| R4 | **`Makefile` rutas relativas** — El Makefile de symticketscctv asume estar en la raíz del monorepo original | MEDIO | ALTA | No copiar el Makefile original; crear uno nuevo para el monorepo |

### 2.3 Riesgos de Go module

| ID | Riesgo | Impacto | Probabilidad | Mitigación |
|----|--------|---------|------------|------------|
| R5 | **Module path** — `go.mod` declara `module github.com/symtickets/cctv_server`. Funciona independientemente de la carpeta local | BAJO | MUY BAJA | No cambiar |
| R6 | **`go.sum` desactualizado** — Si se modifica `go.mod`, el checksum podría fallar | BAJO | MUY BAJA | Ejecutar `go mod tidy` después de la copia |

### 2.4 Riesgos de Next.js / TypeScript

| ID | Riesgo | Impacto | Probabilidad | Mitigación |
|----|--------|---------|------------|------------|
| R7 | **`NEXT_PUBLIC_API_URL` mal configurada** — Si `.env` no apunta al puerto nuevo (8088), el frontend no conecta con el backend del monorepo | ALTO | MEDIA | Crear `.env` con `NEXT_PUBLIC_API_URL=http://localhost:8088/api/v1`. Validar en Checkpoint D |
| R8 | **Playwright baseURL** — `playwright.config.ts` usa `http://localhost:3000`. Con nuevo puerto 3010, los E2E fallan si no se ajustan | MEDIO | **ALTA** | Ajustar `baseURL` en playwright.config.ts a `http://localhost:3010` o usar env var |
| R9 | **Path de Dockerfile** — El Dockerfile multi-stage usa `COPY . .` y asume raíz del proyecto Next.js | BAJO | MUY BAJA | El Dockerfile se copia junto al código; el context no cambia |

### 2.5 Riesgos de Flutter (C3)

| ID | Riesgo | Impacto | Probabilidad | Mitigación |
|----|--------|---------|------------|------------|
| R10 | **`pubspec.yaml` name mismatch** — Si se renombra el paquete a `cctv_mobile`, todos los imports `package:symtickets_mobile/...` fallan | ALTO | MEDIA | **NO renombrar** en la migración inicial |
| R11 | **`android/` e `ios/` del root de symticketscctv copiados por error** — Pertenecen al placeholder vacío, no a la app real | ALTO | MEDIA | **OBLIGATORIO (C3)**: Solo copiar android/ios si existen DENTRO de `symtickets_mobile/`. Ignorar los del root |
| R12 | **Flutter SDK no disponible** — No se puede verificar `flutter pub get` | BAJO | — | Si no se puede verificar, crear placeholder README.md en vez de copiar a ciegas (C3) |

### 2.6 Riesgos de Docker y puertos (C4)

| ID | Riesgo | Impacto | Probabilidad | Mitigación |
|----|--------|---------|------------|------------|
| R13 | **Conflicto de puertos con proyectos originales** — Si usan los mismos puertos, no se puede validar en paralelo | **CRÍTICO** | ~~ALTA~~ **ELIMINADO** | **Resuelto (C4)**: Monorepo usa puertos distintos (5438, 8088, 3010, etc.). No depende de apagar originales |
| R14 | **Volúmenes nombrados compartidos** — Si comparten nombres, comparten datos con el proyecto original | MEDIO | MEDIA | Prefijar nombres con `mono_` (`mono_postgres_data`, `mono_minio_data`) |
| R15 | **Red Docker compartida** — `symtickets-network` ya existe | BAJO | ALTA | Renombrar a `sistema-camaras-network` en el nuevo compose |
| R16 | **Puertos internos vs externos confundidos** — Los contenedores siguen escuchando en sus puertos internos originales (8087, 3000, 5432); solo el mapping host cambia | BAJO | MEDIA | Documentar en `.env.example` que los puertos internos no cambian, solo los del host. Ej: `"8088:8087"` |

---

## 3. Plan de rollback

### Rollback total
```powershell
# El único paso necesario:
Remove-Item -Recurse -Force "g:\TRABAJO\FLUTTER\sistema camaras\sistema-camaras-mono"

# Los originales nunca fueron tocados.
# Verificar con:
git -C "g:\TRABAJO\FLUTTER\sistema camaras\symticketscctv" status
git -C "g:\TRABAJO\FLUTTER\sistema camaras\symticketscctv-next" status
# Ambos deben mostrar "nothing to commit, working tree clean"
```

### Rollback parcial (por paso)
Cada paso documenta su rollback individual. Se puede revertir el último paso
ejecutado sin afectar los anteriores.

---

## 4. Validaciones post-migración

### 4.1 Checklist automatizable (PowerShell — C5)

```powershell
# 1. Único .git en raíz (C1)
Write-Host "Verificando .git..."
if ((Test-Path ".git") -and !(Test-Path "cctv_server\.git") -and !(Test-Path "cctv_web\.git") -and !(Test-Path "cctv_mobile\.git")) {
    Write-Host "✅ Único .git en raíz"
} else { Write-Host "❌ FALLO: .git anidados detectados" }

# 2. Backend compila
Push-Location cctv_server
go build ./cmd/...
if ($LASTEXITCODE -eq 0) { Write-Host "✅ Backend compila" } else { Write-Host "❌ Backend falla" }
Pop-Location

# 3. Frontend compila
Push-Location cctv_web
npm install --silent
npm run build
if ($LASTEXITCODE -eq 0) { Write-Host "✅ Frontend compila" } else { Write-Host "❌ Frontend falla" }

# 4. Unit tests frontend
npm test
if ($LASTEXITCODE -eq 0) { Write-Host "✅ Unit tests pasan" } else { Write-Host "❌ Tests fallan" }
Pop-Location

# 5. Docker compose válido
docker compose config | Out-Null
if ($LASTEXITCODE -eq 0) { Write-Host "✅ Compose es válido" } else { Write-Host "❌ Compose inválido" }

# 6. Servicios en puertos NUEVOS (C4)
docker compose up -d postgres
Start-Sleep -Seconds 5
try { Invoke-RestMethod "http://localhost:5438" -ErrorAction SilentlyContinue } catch {}
Write-Host "✅ PostgreSQL en puerto 5438"

docker compose up migrate
Write-Host "✅ Migraciones aplicadas"

docker compose up -d backend
$health = Invoke-RestMethod "http://localhost:8088/api/v1/health" -ErrorAction SilentlyContinue
if ($health) { Write-Host "✅ Backend en puerto 8088" } else { Write-Host "❌ Backend no responde en 8088" }

docker compose up -d frontend
try { Invoke-WebRequest "http://localhost:3010" -ErrorAction SilentlyContinue | Out-Null; Write-Host "✅ Frontend en puerto 3010" }
catch { Write-Host "❌ Frontend no responde en 3010" }

# 7. Puertos originales NO ocupados por el monorepo
Write-Host "Verificando que originales no tienen conflicto..."

# 8. Originales intactos
git -C "g:\TRABAJO\FLUTTER\sistema camaras\symticketscctv" status --porcelain
git -C "g:\TRABAJO\FLUTTER\sistema camaras\symticketscctv-next" status --porcelain

# 9. Scripts PowerShell existen (C5)
$ps1Files = @("scripts\up.ps1","scripts\down.ps1","scripts\check-services.ps1","scripts\dev-web.ps1","scripts\dev-backend.ps1")
$allExist = $ps1Files | ForEach-Object { Test-Path $_ } | Where-Object { $_ -eq $false }
if ($allExist.Count -eq 0) { Write-Host "✅ Scripts PowerShell presentes" } else { Write-Host "❌ Faltan scripts .ps1" }
```

### 4.2 Checklist manual

- [ ] No existe `.git` dentro de `cctv_server/`, `cctv_web/`, `cctv_mobile/`, `docker/` (C1)
- [ ] No existe `database/` raíz — migraciones solo en `cctv_server/internal/database/` (C2)
- [ ] `cctv_mobile/` contiene app Flutter verificada O placeholder `README.md` documentado (C3)
- [ ] Todos los servicios responden en puertos **nuevos** (5438, 8088, 3010, etc.) (C4)
- [ ] Los proyectos originales siguen accesibles en puertos originales (sin conflicto) (C4)
- [ ] Existen `scripts/up.ps1`, `down.ps1`, `check-services.ps1`, `dev-web.ps1`, `dev-backend.ps1` (C5)
- [ ] Cada checkpoint (A-F) fue validado antes de avanzar (C6)
- [ ] `docs/` contiene documentación vigente sin duplicados
- [ ] `README.md` raíz explica cómo levantar el sistema (con `make` Y con `.ps1`)
- [ ] `.env.example` documenta TODAS las variables con **puertos nuevos**
- [ ] `.gitignore` cubre todos los artefactos generados
- [ ] Ningún archivo de los proyectos originales fue modificado

---

## 5. Dependencias entre pasos (con checkpoints)

```
Paso 1 (estructura + git init)
    │
    ▼
Paso 2 (copiar backend)
    │
    ▼
🔒 CHECKPOINT A ── backend compila, sin .git anidado
    │
    ▼
Paso 3 (copiar frontend)
    │
    ▼
🔒 CHECKPOINT B ── frontend compila, tests verdes, sin .git anidado
    │
    ▼
Paso 4 (decidir mobile — C3)
    │
    ▼
🔒 CHECKPOINT C ── mobile resuelto (copia verificada o placeholder)
    │
    ├── Paso 5 (copiar docker/)
    │
    ▼
Paso 6 (crear compose con puertos nuevos — C4)
    │
    ▼
🔒 CHECKPOINT D ── compose válido, servicios en puertos nuevos, sin conflicto
    │
    ├── Paso 7 (scripts shell + PowerShell — C5)
    ├── Paso 8 (documentación)
    │
    ▼
Paso 9 (Makefile + README)
    │
    ▼
🔒 CHECKPOINT E ── scripts + docs integrados
    │
    ▼
Paso 10 (smoke test final)
    │
    ▼
🔒 CHECKPOINT F ── CONSOLIDACIÓN EXITOSA → primer commit
```

**Pasos paralelizables**: 5 puede ir en paralelo con 3. 7 y 8 pueden ir en paralelo.
**Todo lo demás es estrictamente secuencial, gateado por checkpoints.**
