# up.ps1 — Levantar servicios Docker del monorepo
# Uso: .\scripts\up.ps1 [-All] [-Detach]

param(
    [switch]$All,
    [switch]$Detach
)

$ErrorActionPreference = "Stop"
Push-Location $PSScriptRoot\..

Write-Host "=== sistema-camaras-mono: Levantando servicios ===" -ForegroundColor Cyan

$args_compose = @("up")
if ($Detach -or -not $All) { $args_compose += "-d" }

if ($All) {
    Write-Host "Modo: TODOS los servicios (incluye migrate + frontend)" -ForegroundColor Yellow
    docker compose --profile tools --profile frontend @args_compose
} else {
    Write-Host "Modo: Infraestructura base (postgres, valkey, nats, minio, pgadmin, backend)" -ForegroundColor Yellow
    docker compose @args_compose
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[OK] Servicios levantados." -ForegroundColor Green
    docker compose ps
} else {
    Write-Host "`n[ERROR] Fallo al levantar servicios." -ForegroundColor Red
    exit 1
}

Pop-Location
