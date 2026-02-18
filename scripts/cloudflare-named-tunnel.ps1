# Cloudflare Named Tunnel - TrackSpend API (Free)
# Use when you already have a domain in Cloudflare

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$tunnelName = "trackspend-api"
$configPath = Join-Path $projectRoot "cloudflare-tunnel.yml"
$credDir = Join-Path $env:USERPROFILE ".cloudflared"

Push-Location $projectRoot

Write-Host ""
Write-Host "=== Cloudflare Named Tunnel (Free) - TrackSpend ===" -ForegroundColor Cyan
Write-Host ""

# 1. Check cloudflared
try {
    $null = Get-Command cloudflared -ErrorAction Stop
}
catch {
    Write-Host "ERROR: cloudflared not found" -ForegroundColor Red
    Write-Host "Install: winget install Cloudflare.cloudflared" -ForegroundColor Yellow
    Pop-Location
    exit 1
}

# 2. Login (first time only)
if (-not (Test-Path $credDir)) {
    New-Item -ItemType Directory -Path $credDir -Force | Out-Null
}
$certCount = (Get-ChildItem -Path $credDir -Filter "*.pem" -ErrorAction SilentlyContinue).Count
if ($certCount -eq 0) {
    Write-Host "Login to Cloudflare (browser will open to select domain)..." -ForegroundColor Yellow
    cloudflared tunnel login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Login failed" -ForegroundColor Red
        Pop-Location
        exit 1
    }
}

# 3. Create Tunnel if not exists
$listOut = cloudflared tunnel list 2>&1 | Out-String
$tunnelExists = $listOut -match [regex]::Escape($tunnelName)
$tunnelId = $null

if ($tunnelExists) {
    Write-Host "Tunnel '$tunnelName' already exists" -ForegroundColor Green
    $lines = $listOut -split "`n" | Where-Object { $_ -match [regex]::Escape($tunnelName) }
    if ($lines) {
        $parts = ($lines[0].Trim() -split "\s+")
        $tunnelId = $parts[0]
    }
}

if (-not $tunnelId) {
    Write-Host "Creating tunnel '$tunnelName' ..." -ForegroundColor Cyan
    $createOut = cloudflared tunnel create $tunnelName 2>&1 | Out-String
    $pattern = 'with id ([a-f0-9-]+)'
    if ($createOut -match $pattern) {
        $tunnelId = $Matches[1]
        Write-Host "Tunnel created. ID: $tunnelId" -ForegroundColor Green
    }
    else {
        Write-Host "ERROR: Failed to create tunnel" -ForegroundColor Red
        Write-Host $createOut
        Pop-Location
        exit 1
    }
}

if (-not $tunnelId) {
    Write-Host "ERROR: No Tunnel ID. Run: cloudflared tunnel list" -ForegroundColor Red
    Pop-Location
    exit 1
}

# 4. Ask hostname
Write-Host ""
$hostname = Read-Host "Enter hostname for API (e.g. trackspend-api.yourdomain.com)"
if ([string]::IsNullOrWhiteSpace($hostname)) {
    $hostname = "trackspend-api.yourdomain.com"
    Write-Host "Using default: $hostname" -ForegroundColor Yellow
}

$credFile = Join-Path $credDir "$tunnelId.json"
if (-not (Test-Path $credFile)) {
    Write-Host "ERROR: Credentials file not found: $credFile" -ForegroundColor Red
    Pop-Location
    exit 1
}

# 5. Write config
$configContent = @"
# Cloudflare Named Tunnel - TrackSpend
tunnel: $tunnelId
credentials-file: $credFile

ingress:
  - hostname: $hostname
    service: http://localhost:500
  - service: http_status:404
"@
Set-Content -Path $configPath -Value $configContent -Encoding UTF8
Write-Host "Config saved: $configPath" -ForegroundColor Green

# 6. Route DNS
Write-Host "Adding DNS route ..." -ForegroundColor Cyan
cloudflared tunnel route dns $tunnelName $hostname
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: DNS route may have failed. Add CNAME in Dashboard: $hostname -> $tunnelId.cfargotunnel.com" -ForegroundColor Yellow
}

# 7. Next steps
Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Green
Write-Host "  API URL: https://$hostname" -ForegroundColor White
Write-Host ""
Write-Host "Next:" -ForegroundColor Cyan
Write-Host "  1. Run Server: node server.js" -ForegroundColor White
Write-Host "  2. Run Tunnel: cloudflared tunnel --config cloudflare-tunnel.yml run" -ForegroundColor White
Write-Host "  3. In app set BASE_URL in config/api.js to: https://$hostname" -ForegroundColor White
Write-Host ""
$run = Read-Host "Run tunnel now? (Y/N)"
if ($run -eq "Y" -or $run -eq "y") {
    Write-Host "Starting tunnel (Ctrl+C to stop) ..." -ForegroundColor Cyan
    cloudflared tunnel --config $configPath run
}

Pop-Location
