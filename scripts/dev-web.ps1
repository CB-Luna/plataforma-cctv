# dev-web.ps1 — Levantar frontend Next.js en modo desarrollo
# Uso: .\scripts\dev-web.ps1

$ErrorActionPreference = "Stop"
Push-Location $PSScriptRoot\..\cctv_web

Write-Host "=== sistema-camaras-mono: Frontend Dev Server ===" -ForegroundColor Cyan
Write-Host "Puerto: 3010" -ForegroundColor Yellow
Write-Host ""

# Verificar node_modules
if (-not (Test-Path node_modules)) {
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

# Configurar puerto y API URL
$env:PORT = "3010"
if (-not $env:NEXT_PUBLIC_API_URL) {
    $env:NEXT_PUBLIC_API_URL = "http://localhost:8088/api/v1"
}

Write-Host "API URL: $env:NEXT_PUBLIC_API_URL" -ForegroundColor Gray
Write-Host ""

npm run dev -- -p 3010

Pop-Location
