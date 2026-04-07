# status-services.ps1 — Estatus detallado de todos los servicios Docker del monorepo
# Uso: .\scripts\status-services.ps1

$ErrorActionPreference = "Continue"
Push-Location $PSScriptRoot\..

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   sistema-camaras-mono — Estatus de Servicios       ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar que Docker esté corriendo
try {
    docker info *>$null
    if ($LASTEXITCODE -ne 0) { throw "Docker no responde" }
} catch {
    Write-Host "  [ERROR] Docker Desktop no está corriendo. Inícialo primero." -ForegroundColor Red
    Pop-Location
    exit 1
}

# Contenedores esperados y su propósito
$containers = @(
    @{ Container = 'mono-postgres';  Nombre = 'PostgreSQL';     Puerto = 5438;  Tipo = 'tcp' },
    @{ Container = 'mono-valkey';    Nombre = 'Valkey (cache)';  Puerto = 6388;  Tipo = 'tcp' },
    @{ Container = 'mono-nats';      Nombre = 'NATS (mensajes)'; Puerto = 4228;  Tipo = 'tcp' },
    @{ Container = 'mono-minio';     Nombre = 'MinIO (storage)'; Puerto = 9009;  Tipo = 'tcp' },
    @{ Container = 'mono-pgadmin';   Nombre = 'pgAdmin';         Puerto = 5058;  Tipo = 'http'; Path = '/' },
    @{ Container = 'mono-backend';   Nombre = 'Backend API (Go)';Puerto = 8088;  Tipo = 'http'; Path = '/health' },
    @{ Container = 'mono-frontend';  Nombre = 'Frontend (CRM)';  Puerto = 3010;  Tipo = 'http'; Path = '/' }
)

$ok = 0
$fail = 0
$apagado = 0

foreach ($svc in $containers) {
    # Verificar estado del contenedor (JSON para evitar conflicto {{ }} en PS 5.1)
    $estado = $null
    $health = 'n/a'
    $inspJson = docker inspect $svc.Container 2>$null
    if ($inspJson -and $LASTEXITCODE -eq 0) {
        $insp = ($inspJson | ConvertFrom-Json)
        $estado = $insp[0].State.Status
        if ($insp[0].State.PSObject.Properties['Health']) {
            $health = $insp[0].State.Health.Status
        }
    }

    if (-not $estado) {
        Write-Host "  [APAGADO]  $($svc.Nombre.PadRight(22)) :$($svc.Puerto)  — contenedor no existe" -ForegroundColor DarkGray
        $apagado++
        continue
    }

    if ($estado -ne 'running') {
        Write-Host "  [PARADO]   $($svc.Nombre.PadRight(22)) :$($svc.Puerto)  — estado: $estado" -ForegroundColor Yellow
        $fail++
        continue
    }

    # Contenedor corriendo — verificar conectividad de puerto
    $accesible = $false
    try {
        if ($svc.Tipo -eq 'http') {
            $resp = Invoke-WebRequest -Uri "http://localhost:$($svc.Puerto)$($svc.Path)" -TimeoutSec 4 -UseBasicParsing -ErrorAction Stop
            if ($resp.StatusCode -lt 500) { $accesible = $true }
        } else {
            $tcp = New-Object System.Net.Sockets.TcpClient
            $tcp.Connect("localhost", $svc.Puerto)
            $tcp.Close()
            $accesible = $true
        }
    } catch { }

    $healthTag = if ($health -eq 'healthy') { ' (healthy)' } elseif ($health -eq 'unhealthy') { ' (unhealthy)' } else { '' }

    if ($accesible) {
        Write-Host "  [  OK  ]   $($svc.Nombre.PadRight(22)) :$($svc.Puerto)  — running$healthTag" -ForegroundColor Green
        $ok++
    } else {
        Write-Host "  [NO ACC]   $($svc.Nombre.PadRight(22)) :$($svc.Puerto)  — running pero puerto inaccesible$healthTag" -ForegroundColor Red
        $fail++
    }
}

Write-Host ""
$total = $containers.Count
$color = if ($fail -eq 0 -and $apagado -eq 0) { "Green" } elseif ($ok -gt 0) { "Yellow" } else { "Red" }
Write-Host "  Resumen: $ok OK, $fail con problemas, $apagado apagados (de $total servicios)" -ForegroundColor $color
Write-Host ""

Pop-Location
exit ($fail + $apagado)
