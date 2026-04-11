# refresh-containers.ps1 - Detener contenedores, actualizar imagenes y volver a levantar el stack
# Uso:
#   .\scripts\refresh-containers.ps1
#   .\scripts\refresh-containers.ps1 -IncludeTools
#   .\scripts\refresh-containers.ps1 -BaseOnly
#   .\scripts\refresh-containers.ps1 -Prod
#   .\scripts\refresh-containers.ps1 -Prod -IncludeTools

param(
    [switch]$Prod,
    [switch]$BaseOnly,
    [switch]$IncludeTools,
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

Push-Location (Join-Path $PSScriptRoot "..")

try {
    $script:LastDockerExitCode = 0

    function Invoke-DockerNative {
        param(
            [Parameter(Mandatory = $true)]
            [string[]]$Arguments,
            [switch]$Quiet
        )

        $previousPreference = $ErrorActionPreference
        $ErrorActionPreference = "Continue"

        try {
            if ($Quiet) {
                & docker @Arguments 1>$null 2>$null
            } else {
                & docker @Arguments
            }
            $script:LastDockerExitCode = $LASTEXITCODE
        }
        finally {
            $ErrorActionPreference = $previousPreference
        }
    }

    function Test-DockerReady {
        Invoke-DockerNative -Arguments @("info") -Quiet
        if ($script:LastDockerExitCode -ne 0) {
            throw "Docker no esta disponible. Inicia Docker Desktop y vuelve a intentar."
        }
    }

    function Invoke-Compose {
        param(
            [Parameter(Mandatory = $true)]
            [string[]]$Args
        )

        Invoke-DockerNative -Arguments (@("compose") + $script:ComposeArgs + $Args)
        if ($script:LastDockerExitCode -ne 0) {
            throw "Fallo docker compose $($Args -join ' ')"
        }
    }

    function Invoke-ComposePull {
        try {
            Invoke-DockerNative -Arguments (@("compose") + $script:ComposeArgs + @("pull", "--ignore-buildable"))
            if ($script:LastDockerExitCode -eq 0) {
                return
            }
        } catch {
            # Fallback a pull tradicional si la version de compose no soporta --ignore-buildable
        }

        Invoke-DockerNative -Arguments (@("compose") + $script:ComposeArgs + @("pull"))
        if ($script:LastDockerExitCode -ne 0) {
            throw "Fallo docker compose pull"
        }
    }

    $script:ComposeArgs = @()

    if ($Prod) {
        $script:ComposeArgs += @("-f", "docker-compose.prod.yml")
    } elseif (-not $BaseOnly) {
        $script:ComposeArgs += @("--profile", "frontend")
    }

    if ($IncludeTools) {
        $script:ComposeArgs += @("--profile", "tools")
    }

    $modeLabel = if ($Prod) { "PRODUCCION" } else { "DESARROLLO" }
    $scopeLabel = if ($Prod) {
        if ($IncludeTools) { "stack prod + tools" } else { "stack prod" }
    } elseif ($BaseOnly) {
        if ($IncludeTools) { "infraestructura base + tools" } else { "infraestructura base" }
    } elseif ($IncludeTools) {
        "stack dev + frontend + tools"
    } else {
        "stack dev + frontend"
    }

    Write-Host ""
    Write-Host "=== sistema-camaras-mono: Refrescar contenedores ===" -ForegroundColor Cyan
    Write-Host "Modo: $modeLabel" -ForegroundColor Yellow
    Write-Host "Alcance: $scopeLabel" -ForegroundColor Yellow
    Write-Host ""

    Write-Host "[1/4] Verificando Docker..." -ForegroundColor White
    Test-DockerReady
    Write-Host "       Docker OK" -ForegroundColor Green

    Write-Host "[2/4] Actualizando imagenes remotas..." -ForegroundColor White
    Invoke-ComposePull
    Write-Host "       Imagenes remotas actualizadas" -ForegroundColor Green

    if (-not $SkipBuild) {
        Write-Host "[3/4] Reconstruyendo imagenes locales con base actualizada..." -ForegroundColor White
        Invoke-Compose @("build", "--pull")
        Write-Host "       Build completado" -ForegroundColor Green
    } else {
        Write-Host "[3/4] Build omitido por -SkipBuild" -ForegroundColor Yellow
    }

    Write-Host "[4/4] Aplicando cambios y levantando contenedores..." -ForegroundColor White
    $upArgs = @("up", "-d", "--remove-orphans")
    Invoke-Compose -Args $upArgs
    Write-Host "       Contenedores levantados" -ForegroundColor Green

    Write-Host ""
    Write-Host "[OK] Stack refrescado correctamente." -ForegroundColor Green
    Write-Host ""
    Invoke-DockerNative -Arguments (@("compose") + $script:ComposeArgs + @("ps"))
    if ($script:LastDockerExitCode -ne 0) {
        throw "Fallo docker compose ps"
    }
}
finally {
    Pop-Location
}
