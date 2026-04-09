# docker-reset-frontend.ps1 - Reinicia solo el frontend Docker del monorepo
# Uso:
#   .\scripts\docker-reset-frontend.ps1
#   .\scripts\docker-reset-frontend.ps1 -NoCache
#   .\scripts\docker-reset-frontend.ps1 -OpenBrowser

param(
    [switch]$NoCache,
    [switch]$OpenBrowser,
    [int]$TimeoutSeconds = 60
)

$ErrorActionPreference = "Stop"

Push-Location (Join-Path $PSScriptRoot "..")

try {
    function Invoke-DockerNative {
        param(
            [Parameter(Mandatory = $true)]
            [string[]]$Arguments,
            [switch]$Quiet,
            [switch]$IgnoreExitCode
        )

        $previousPreference = $ErrorActionPreference
        $ErrorActionPreference = "Continue"

        try {
            if ($Quiet) {
                & docker @Arguments 1>$null 2>$null
            } else {
                & docker @Arguments
            }

            $exitCode = $LASTEXITCODE
        }
        finally {
            $ErrorActionPreference = $previousPreference
        }

        if (-not $IgnoreExitCode -and $exitCode -ne 0) {
            throw "Fallo docker $($Arguments -join ' ')"
        }

        return $exitCode
    }

    function Test-DockerReady {
        $exitCode = Invoke-DockerNative -Arguments @("info") -Quiet -IgnoreExitCode
        if ($exitCode -ne 0) {
            throw "Docker no esta disponible. Inicia Docker Desktop y vuelve a intentar."
        }
    }

    $serviceName = "frontend"
    $containerName = "mono-frontend"
    $imageName = "mono-frontend-local:dev"
    $frontendPort = if ($env:FRONTEND_HOST_PORT) { $env:FRONTEND_HOST_PORT } else { "3010" }
    $frontendUrl = "http://localhost:$frontendPort"
    $composeArgs = @("compose", "--profile", "frontend")

    Write-Host ""
    Write-Host "=== sistema-camaras-mono: Reset frontend Docker ===" -ForegroundColor Cyan
    Write-Host "Servicio: $serviceName" -ForegroundColor Yellow
    Write-Host "Contenedor: $containerName" -ForegroundColor Yellow
    Write-Host "Imagen: $imageName" -ForegroundColor Yellow
    Write-Host "URL esperada: $frontendUrl" -ForegroundColor Yellow
    Write-Host ""

    Write-Host "[1/5] Verificando Docker..." -ForegroundColor White
    Test-DockerReady
    Write-Host "       Docker OK" -ForegroundColor Green

    Write-Host "[2/5] Eliminando contenedor anterior si existe..." -ForegroundColor White
    $containerExit = Invoke-DockerNative -Arguments @("rm", "-f", $containerName) -IgnoreExitCode
    if ($containerExit -eq 0) {
        Write-Host "       Contenedor anterior eliminado" -ForegroundColor Green
    } else {
        Write-Host "       No habia contenedor previo que eliminar" -ForegroundColor DarkGray
    }

    Write-Host "[3/5] Eliminando imagen local anterior si existe..." -ForegroundColor White
    $imageExit = Invoke-DockerNative -Arguments @("rmi", "-f", $imageName) -IgnoreExitCode
    if ($imageExit -eq 0) {
        Write-Host "       Imagen anterior eliminada" -ForegroundColor Green
    } else {
        Write-Host "       No habia imagen previa que eliminar" -ForegroundColor DarkGray
    }

    Write-Host "[4/5] Reconstruyendo frontend..." -ForegroundColor White
    $buildArgs = $composeArgs + @("build", "--pull")
    if ($NoCache) {
        $buildArgs += "--no-cache"
    }
    $buildArgs += $serviceName
    Invoke-DockerNative -Arguments $buildArgs
    Write-Host "       Build completado" -ForegroundColor Green

    Write-Host "[5/5] Levantando frontend..." -ForegroundColor White
    Invoke-DockerNative -Arguments ($composeArgs + @("up", "-d", "--force-recreate", $serviceName))

    Write-Host "       Esperando a que responda $frontendUrl ..." -ForegroundColor Yellow
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    $frontendReady = $false

    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Seconds 3
        try {
            $response = Invoke-WebRequest -Uri $frontendUrl -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
            if ($response.StatusCode -lt 500) {
                $frontendReady = $true
                break
            }
        } catch {
        }
    }

    if ($frontendReady) {
        Write-Host "       Frontend listo" -ForegroundColor Green
    } else {
        Write-Host "       [AVISO] El frontend no respondio dentro de $TimeoutSeconds segundos." -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "[OK] Reset de frontend terminado." -ForegroundColor Green
    Write-Host ""
    Invoke-DockerNative -Arguments ($composeArgs + @("ps", $serviceName))

    if ($OpenBrowser) {
        Start-Process $frontendUrl
    }
}
finally {
    Pop-Location
}
