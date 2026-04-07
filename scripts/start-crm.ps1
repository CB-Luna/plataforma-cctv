# start-crm.ps1 — Verificar servicios Docker, levantarlos si faltan, y abrir el CRM en el navegador
# Uso: .\scripts\start-crm.ps1

$ErrorActionPreference = "Continue"
Push-Location $PSScriptRoot\..

$CRM_URL = "http://localhost:3010"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   sistema-camaras-mono — Iniciar CRM                ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── 1. Verificar que Docker esté corriendo ──────────────────────────
Write-Host "[1/4] Verificando Docker Desktop..." -ForegroundColor White
try {
    docker info *>$null
    if ($LASTEXITCODE -ne 0) { throw "Docker no responde" }
    Write-Host "       Docker OK" -ForegroundColor Green
} catch {
    Write-Host "       Docker Desktop no está corriendo. Inícialo y vuelve a ejecutar este script." -ForegroundColor Red
    Pop-Location
    exit 1
}

# ── 2. Definir contenedores requeridos ──────────────────────────────
$requeridos = @(
    @{ Container = 'mono-postgres'; Nombre = 'PostgreSQL';      Puerto = 5438 },
    @{ Container = 'mono-valkey';   Nombre = 'Valkey (cache)';   Puerto = 6388 },
    @{ Container = 'mono-nats';     Nombre = 'NATS (mensajes)';  Puerto = 4228 },
    @{ Container = 'mono-minio';    Nombre = 'MinIO (storage)';  Puerto = 9009 },
    @{ Container = 'mono-pgadmin';  Nombre = 'pgAdmin';          Puerto = 5058 },
    @{ Container = 'mono-backend';  Nombre = 'Backend API (Go)'; Puerto = 8088 }
)

# ── 3. Verificar y levantar infraestructura base ───────────────────
Write-Host "[2/4] Verificando infraestructura base..." -ForegroundColor White

$algunoFalta = $false
foreach ($svc in $requeridos) {
    $estado = $null
    $inspJson = docker inspect $svc.Container 2>$null
    if ($inspJson -and $LASTEXITCODE -eq 0) {
        $estado = ($inspJson | ConvertFrom-Json)[0].State.Status
    }
    if (-not $estado -or $estado -ne 'running') {
        Write-Host "       $($svc.Nombre) — no disponible" -ForegroundColor Yellow
        $algunoFalta = $true
    } else {
        Write-Host "       $($svc.Nombre) — OK" -ForegroundColor Green
    }
}

if ($algunoFalta) {
    Write-Host ""
    Write-Host "       Levantando infraestructura base con docker compose..." -ForegroundColor Yellow
    docker compose up -d
    if ($LASTEXITCODE -ne 0) {
        Write-Host "       [ERROR] Falló docker compose up" -ForegroundColor Red
        Pop-Location
        exit 1
    }

    # Esperar a que el backend esté healthy (máximo 90 segundos)
    Write-Host "       Esperando a que el backend esté listo..." -ForegroundColor Yellow
    $intentos = 0
    $maxIntentos = 30
    $backendListo = $false
    while ($intentos -lt $maxIntentos) {
        $intentos++
        Start-Sleep -Seconds 3
        try {
            $resp = Invoke-WebRequest -Uri "http://localhost:8088/health" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
            if ($resp.StatusCode -lt 500) {
                $backendListo = $true
                break
            }
        } catch { }
        Write-Host "       ... intento $intentos/$maxIntentos" -ForegroundColor DarkGray
    }

    if ($backendListo) {
        Write-Host "       Backend listo" -ForegroundColor Green
    } else {
        Write-Host "       [AVISO] Backend no respondió en 90s. El CRM podría no funcionar correctamente." -ForegroundColor Yellow
    }
} else {
    Write-Host "       Toda la infraestructura base OK" -ForegroundColor Green
}

# ── 4. Verificar y levantar frontend ───────────────────────────────
Write-Host "[3/4] Verificando Frontend (CRM)..." -ForegroundColor White

$feEstado = $null
$inspJson = docker inspect 'mono-frontend' 2>$null
if ($inspJson -and $LASTEXITCODE -eq 0) {
    $feEstado = ($inspJson | ConvertFrom-Json)[0].State.Status
}
if (-not $feEstado -or $feEstado -ne 'running') {
    Write-Host "       Frontend no está corriendo — levantándolo..." -ForegroundColor Yellow
    docker compose --profile frontend up -d frontend
    if ($LASTEXITCODE -ne 0) {
        Write-Host "       [ERROR] Falló al levantar el frontend" -ForegroundColor Red
        Pop-Location
        exit 1
    }

    # Esperar a que el frontend responda (máximo 60 segundos)
    Write-Host "       Esperando a que el frontend esté listo..." -ForegroundColor Yellow
    $intentos = 0
    $maxIntentos = 20
    $frontendListo = $false
    while ($intentos -lt $maxIntentos) {
        $intentos++
        Start-Sleep -Seconds 3
        try {
            $resp = Invoke-WebRequest -Uri $CRM_URL -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
            if ($resp.StatusCode -lt 500) {
                $frontendListo = $true
                break
            }
        } catch { }
        Write-Host "       ... intento $intentos/$maxIntentos" -ForegroundColor DarkGray
    }

    if ($frontendListo) {
        Write-Host "       Frontend listo" -ForegroundColor Green
    } else {
        Write-Host "       [AVISO] Frontend no respondió en 60s. Abriendo navegador de todas formas..." -ForegroundColor Yellow
    }
} else {
    Write-Host "       Frontend ya está corriendo" -ForegroundColor Green
}

# ── 5. Abrir navegador ─────────────────────────────────────────────
Write-Host "[4/4] Abriendo CRM en el navegador..." -ForegroundColor White
Start-Process $CRM_URL
Write-Host "       $CRM_URL" -ForegroundColor Green

Write-Host ""
Write-Host "  ¡CRM listo! Si algo falla, ejecuta .\scripts\status-services.ps1 para diagnosticar." -ForegroundColor Cyan
Write-Host ""

Pop-Location
