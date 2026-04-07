# Batería de Verificación Runtime — symticketscctv API
# =====================================================
# Ejecutar con el servidor backend corriendo en localhost:8080
#
# USO:
#   .\scripts\verify-api.ps1
#   .\scripts\verify-api.ps1 -BaseUrl "http://10.0.0.5:8080"
#
# REQUISITOS:
#   - PowerShell 5.1+
#   - Backend cctv_server corriendo
#   - Al menos un usuario registrado en la BD
#
# NOTA: Ajustar $TestEmail y $TestPassword con credenciales válidas.

param(
    [string]$BaseUrl = "http://localhost:8080",
    [string]$TestEmail = "admin@symtickets.com",
    [string]$TestPassword = "admin123"
)

$ApiBase = "$BaseUrl/api/v1"
$Results = @()
$Token = $null
$CompanyId = $null

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers = @{},
        [string]$Body = $null,
        [string]$GapId = $null
    )

    $result = [PSCustomObject]@{
        Name       = $Name
        Method     = $Method
        Url        = $Url
        Status     = 0
        Success    = $false
        GapId      = $GapId
        Response   = ""
        Error      = ""
    }

    try {
        $params = @{
            Uri     = $Url
            Method  = $Method
            Headers = $Headers
            ContentType = "application/json"
            ErrorAction = "Stop"
        }
        if ($Body) {
            $params.Body = $Body
        }

        $response = Invoke-RestMethod @params
        $result.Status = 200
        $result.Success = $true
        $json = $response | ConvertTo-Json -Depth 5 -Compress
        $result.Response = $json
    }
    catch {
        if ($_.Exception.Response) {
            $result.Status = [int]$_.Exception.Response.StatusCode
        }
        $errMsg = $_.Exception.Message
        $result.Error = $errMsg.Substring(0, [Math]::Min(200, $errMsg.Length))
        # 404 en gaps es resultado esperado
        if ($GapId -and $result.Status -eq 404) {
            $result.Success = $true
        }
    }

    return $result
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " VERIFICACION RUNTIME - symticketscctv API" -ForegroundColor Cyan
Write-Host " Base URL: $ApiBase" -ForegroundColor Cyan
Write-Host " Fecha: $(Get-Date -Format 'yyyy-MM-dd HH:mm')" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# -------------------------------------------------------
# TEST 1: POST /auth/login
# -------------------------------------------------------
Write-Host "[1/11] POST /auth/login ..." -NoNewline
$loginBody = @{ email = $TestEmail; password = $TestPassword } | ConvertTo-Json
$r = Test-Endpoint -Name "auth/login" -Method "POST" -Url "$ApiBase/auth/login" -Body $loginBody
$Results += $r

if ($r.Success) {
    $loginData = $r.Response | ConvertFrom-Json
    $tokenVal = if ($loginData.access_token) { $loginData.access_token } elseif ($loginData.token) { $loginData.token } else { $null }
    if ($tokenVal) {
        $Token = $tokenVal
        Write-Host " OK (token obtenido)" -ForegroundColor Green
        # Intentar extraer company/tenant ID
        if ($loginData.user -and $loginData.user.tenant_id) {
            $CompanyId = $loginData.user.tenant_id
            Write-Host "       -> Tenant ID: $CompanyId" -ForegroundColor DarkGray
        }
        elseif ($loginData.companies -and $loginData.companies.Count -gt 0) {
            $CompanyId = $loginData.companies[0].id
            Write-Host "       -> Companies: $($loginData.companies.Count), usando ID: $CompanyId" -ForegroundColor DarkGray
        }
    }
    else {
        Write-Host " OK (HTTP $($r.Status)) pero sin token en response" -ForegroundColor Yellow
    }
}
else {
    Write-Host " FAIL (HTTP $($r.Status)): $($r.Error)" -ForegroundColor Red
    Write-Host ""
    Write-Host "ABORTANDO: Sin login no se pueden probar los demas endpoints." -ForegroundColor Red
    Write-Host "Verifica que el servidor esta corriendo y las credenciales son correctas." -ForegroundColor Red
    exit 1
}

# Headers comunes para endpoints protegidos
$AuthHeaders = @{
    "Authorization" = "Bearer $Token"
}
if ($CompanyId) {
    $AuthHeaders["X-Company-ID"] = "$CompanyId"
}

# -------------------------------------------------------
# TEST 2: GET /auth/me
# -------------------------------------------------------
Write-Host "[2/11] GET /auth/me ..." -NoNewline
$r = Test-Endpoint -Name "auth/me" -Method "GET" -Url "$ApiBase/auth/me" -Headers $AuthHeaders
$Results += $r
if ($r.Success) { Write-Host " OK (HTTP $($r.Status))" -ForegroundColor Green }
else { Write-Host " FAIL (HTTP $($r.Status))" -ForegroundColor Red }

# -------------------------------------------------------
# TEST 3: GET /menu (NO /menu/user)
# -------------------------------------------------------
Write-Host "[3/11] GET /menu ..." -NoNewline
$r = Test-Endpoint -Name "menu" -Method "GET" -Url "$ApiBase/menu" -Headers $AuthHeaders
$Results += $r
if ($r.Success) { Write-Host " OK (HTTP $($r.Status))" -ForegroundColor Green }
else { Write-Host " FAIL (HTTP $($r.Status))" -ForegroundColor Red }

# -------------------------------------------------------
# TEST 4: GET /settings/theme
# -------------------------------------------------------
Write-Host "[4/11] GET /settings/theme ..." -NoNewline
$r = Test-Endpoint -Name "settings/theme" -Method "GET" -Url "$ApiBase/settings/theme" -Headers $AuthHeaders
$Results += $r
if ($r.Success) { Write-Host " OK (HTTP $($r.Status))" -ForegroundColor Green }
else { Write-Host " FAIL (HTTP $($r.Status))" -ForegroundColor Red }

# -------------------------------------------------------
# TEST 5: GET /inventory/summary
# -------------------------------------------------------
Write-Host "[5/11] GET /inventory/summary ..." -NoNewline
$r = Test-Endpoint -Name "inventory/summary" -Method "GET" -Url "$ApiBase/inventory/summary" -Headers $AuthHeaders
$Results += $r
if ($r.Success) { Write-Host " OK (HTTP $($r.Status))" -ForegroundColor Green }
else { Write-Host " FAIL (HTTP $($r.Status))" -ForegroundColor Red }

# -------------------------------------------------------
# TEST 6: GET /inventory/floor-plans/sites
# -------------------------------------------------------
Write-Host "[6/11] GET /inventory/floor-plans/sites ..." -NoNewline
$r = Test-Endpoint -Name "floor-plans/sites" -Method "GET" -Url "$ApiBase/inventory/floor-plans/sites" -Headers $AuthHeaders
$Results += $r
if ($r.Success) {
    Write-Host " OK (HTTP $($r.Status))" -ForegroundColor Green
    # Intentar extraer un siteId para el test 7
    try {
        $sitesData = $r.Response | ConvertFrom-Json
        if ($sitesData -and $sitesData.Count -gt 0) {
            $TestSiteId = if ($sitesData[0].id) { $sitesData[0].id } elseif ($sitesData[0].site_id) { $sitesData[0].site_id } else { $null }
        }
    } catch {}
}
else { Write-Host " FAIL (HTTP $($r.Status))" -ForegroundColor Red }

# -------------------------------------------------------
# TEST 7: GET /inventory/floor-plans/site/:siteId
# -------------------------------------------------------
if ($TestSiteId) {
    Write-Host "[7/11] GET /inventory/floor-plans/site/$TestSiteId ..." -NoNewline
    $r = Test-Endpoint -Name "floor-plans/site/:id" -Method "GET" -Url "$ApiBase/inventory/floor-plans/site/$TestSiteId" -Headers $AuthHeaders
}
else {
    Write-Host "[7/11] GET /inventory/floor-plans/site/:id ..." -NoNewline
    $r = Test-Endpoint -Name "floor-plans/site/:id" -Method "GET" -Url "$ApiBase/inventory/floor-plans/site/1" -Headers $AuthHeaders
}
$Results += $r
if ($r.Success) { Write-Host " OK (HTTP $($r.Status))" -ForegroundColor Green }
else { Write-Host " FAIL (HTTP $($r.Status)) - puede ser 404 si no hay datos" -ForegroundColor Yellow }

# -------------------------------------------------------
# TEST 8: GET /clients
# -------------------------------------------------------
Write-Host "[8/11] GET /clients ..." -NoNewline
$r = Test-Endpoint -Name "clients" -Method "GET" -Url "$ApiBase/clients" -Headers $AuthHeaders
$Results += $r
if ($r.Success) { Write-Host " OK (HTTP $($r.Status))" -ForegroundColor Green }
else { Write-Host " FAIL (HTTP $($r.Status))" -ForegroundColor Red }

# -------------------------------------------------------
# TEST 9: GET /tenants
# -------------------------------------------------------
Write-Host "[9/11] GET /tenants ..." -NoNewline
$r = Test-Endpoint -Name "tenants" -Method "GET" -Url "$ApiBase/tenants" -Headers $AuthHeaders
$Results += $r
if ($r.Success) { Write-Host " OK (HTTP $($r.Status))" -ForegroundColor Green }
else { Write-Host " FAIL (HTTP $($r.Status))" -ForegroundColor Red }

# -------------------------------------------------------
# TEST 10: POST /auth/refresh (esperamos 404 → confirma GAP-04)
# -------------------------------------------------------
Write-Host "[10/11] POST /auth/refresh (esperando 404 = GAP confirmado) ..." -NoNewline
$refreshBody = @{ refresh_token = "test" } | ConvertTo-Json
$r = Test-Endpoint -Name "auth/refresh" -Method "POST" -Url "$ApiBase/auth/refresh" -Headers $AuthHeaders -Body $refreshBody -GapId "GAP-04"
$Results += $r
if ($r.Status -eq 404) {
    Write-Host " 404 -> GAP-04 CONFIRMADO (endpoint no existe)" -ForegroundColor Yellow
}
elseif ($r.Success) {
    Write-Host " SORPRESA: HTTP $($r.Status) -> el endpoint EXISTE!" -ForegroundColor Magenta
}
else {
    Write-Host " HTTP $($r.Status): $($r.Error)" -ForegroundColor Yellow
}

# -------------------------------------------------------
# TEST 11: POST /auth/switch-company (esperamos 404 → confirma GAP-05)
# -------------------------------------------------------
Write-Host "[11/11] POST /auth/switch-company (esperando 404 = GAP confirmado) ..." -NoNewline
$switchBody = @{ company_id = "test" } | ConvertTo-Json
$r = Test-Endpoint -Name "auth/switch-company" -Method "POST" -Url "$ApiBase/auth/switch-company" -Headers $AuthHeaders -Body $switchBody -GapId "GAP-05"
$Results += $r
if ($r.Status -eq 404) {
    Write-Host " 404 -> GAP-05 CONFIRMADO (endpoint no existe)" -ForegroundColor Yellow
}
elseif ($r.Success) {
    Write-Host " SORPRESA: HTTP $($r.Status) -> el endpoint EXISTE!" -ForegroundColor Magenta
}
else {
    Write-Host " HTTP $($r.Status): $($r.Error)" -ForegroundColor Yellow
}

# -------------------------------------------------------
# RESUMEN
# -------------------------------------------------------
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " RESUMEN DE VERIFICACION" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

$passed = ($Results | Where-Object { $_.Success }).Count
$failed = ($Results | Where-Object { -not $_.Success }).Count
$total = $Results.Count

Write-Host ""
Write-Host "Total: $total tests | Pasaron: $passed | Fallaron: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })
Write-Host ""

foreach ($r in $Results) {
    $icon = if ($r.Success) { "[OK]" } else { "[FAIL]" }
    $color = if ($r.Success) { "Green" } else { "Red" }
    $gap = if ($r.GapId) { " ($($r.GapId))" } else { "" }
    Write-Host "  $icon $($r.Method) $($r.Name) -> HTTP $($r.Status)$gap" -ForegroundColor $color
}

# Guardar resultados como JSON
$outputPath = Join-Path $PSScriptRoot "..\docs\runtime-verification-results.json"
$Results | ConvertTo-Json -Depth 3 | Out-File -FilePath $outputPath -Encoding utf8
Write-Host ""
Write-Host "Resultados guardados en: $outputPath" -ForegroundColor DarkGray
Write-Host ""
Write-Host "SIGUIENTE PASO:" -ForegroundColor Cyan
Write-Host "  1. Revisar resultados arriba" -ForegroundColor White
Write-Host "  2. Actualizar 08_VERIFICATION_MATRIX.md con columna 'Runtime test'" -ForegroundColor White
Write-Host "  3. Si todos los endpoints de Fase 1 pasan -> GO para implementacion" -ForegroundColor White
