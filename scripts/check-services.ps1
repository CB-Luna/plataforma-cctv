# check-services.ps1 — Health check de todos los servicios del monorepo
# Uso: .\scripts\check-services.ps1

$ErrorActionPreference = "Continue"
Push-Location $PSScriptRoot\..

Write-Host "=== sistema-camaras-mono: Health Check ===" -ForegroundColor Cyan
Write-Host ""

$services = @(
    @{ Name = "PostgreSQL";  Port = 5438; Check = "tcp" },
    @{ Name = "Backend API"; Port = 8088; Check = "http"; Path = "/health" },
    @{ Name = "Frontend";    Port = 3010; Check = "http"; Path = "/" },
    @{ Name = "Valkey";      Port = 6388; Check = "tcp" },
    @{ Name = "NATS";        Port = 4228; Check = "tcp" },
    @{ Name = "NATS Mon";    Port = 8228; Check = "http"; Path = "/" },
    @{ Name = "MinIO API";   Port = 9009; Check = "tcp" },
    @{ Name = "MinIO Console"; Port = 9010; Check = "http"; Path = "/" },
    @{ Name = "pgAdmin";     Port = 5058; Check = "http"; Path = "/" }
)

$pass = 0
$fail = 0

foreach ($svc in $services) {
    $status = "FAIL"
    try {
        if ($svc.Check -eq "http") {
            $resp = Invoke-WebRequest -Uri "http://localhost:$($svc.Port)$($svc.Path)" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
            if ($resp.StatusCode -lt 500) { $status = "OK" }
        } else {
            $tcp = New-Object System.Net.Sockets.TcpClient
            $tcp.Connect("localhost", $svc.Port)
            $tcp.Close()
            $status = "OK"
        }
    } catch {
        $status = "FAIL"
    }

    if ($status -eq "OK") {
        Write-Host "  [OK]   $($svc.Name) :$($svc.Port)" -ForegroundColor Green
        $pass++
    } else {
        Write-Host "  [FAIL] $($svc.Name) :$($svc.Port)" -ForegroundColor Red
        $fail++
    }
}

Write-Host ""
Write-Host "Resultado: $pass OK, $fail FAIL de $($services.Count) servicios" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Yellow" })

Pop-Location
exit $fail
