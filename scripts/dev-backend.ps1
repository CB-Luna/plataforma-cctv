# dev-backend.ps1 — Levantar backend Go en modo desarrollo
# Uso: .\scripts\dev-backend.ps1
# Requiere: Go SDK instalado, infraestructura Docker corriendo (postgres, valkey, nats, minio)

$ErrorActionPreference = "Stop"
Push-Location $PSScriptRoot\..\cctv_server

Write-Host "=== sistema-camaras-mono: Backend Dev Server ===" -ForegroundColor Cyan
Write-Host "Puerto: 8088 (mapeado desde 8080 interno)" -ForegroundColor Yellow
Write-Host ""

# Verificar Go
if (-not (Get-Command go -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Go SDK no encontrado. Instale Go 1.24+ desde https://go.dev/dl/" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Cargar .env si existe
$envFile = Join-Path $PSScriptRoot ".." ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^\s*([^#][^=]+)=(.+)$") {
            [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
        }
    }
    Write-Host "Variables de entorno cargadas desde .env" -ForegroundColor Gray
}

# Defaults para desarrollo local
if (-not $env:DATABASE_URL) {
    $env:DATABASE_URL = "postgres://postgres:joselo1341@localhost:5438/symtickets?sslmode=disable"
}
if (-not $env:SERVER_PORT) {
    $env:SERVER_PORT = "8080"
}
if (-not $env:REDIS_HOST) {
    $env:REDIS_HOST = "localhost"
    $env:REDIS_PORT = "6388"
}

Write-Host "DATABASE_URL: $($env:DATABASE_URL -replace 'joselo1341','***')" -ForegroundColor Gray
Write-Host ""

# Si Air está disponible, usar hot-reload
if (Get-Command air -ErrorAction SilentlyContinue) {
    Write-Host "Usando Air (hot-reload)..." -ForegroundColor Green
    air
} else {
    Write-Host "Usando go run (sin hot-reload)..." -ForegroundColor Yellow
    go run ./cmd/main.go
}

Pop-Location
