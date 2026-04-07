# down.ps1 — Detener servicios Docker del monorepo
# Uso: .\scripts\down.ps1 [-Volumes]

param(
    [switch]$Volumes
)

$ErrorActionPreference = "Stop"
Push-Location $PSScriptRoot\..

Write-Host "=== sistema-camaras-mono: Deteniendo servicios ===" -ForegroundColor Cyan

if ($Volumes) {
    Write-Host "Eliminando contenedores Y volumenes..." -ForegroundColor Yellow
    docker compose down -v --remove-orphans
} else {
    docker compose down --remove-orphans
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Servicios detenidos." -ForegroundColor Green
} else {
    Write-Host "[ERROR] Fallo al detener servicios." -ForegroundColor Red
    exit 1
}

Pop-Location
