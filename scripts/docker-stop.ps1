# PowerShell script สำหรับหยุด Docker MySQL container

# เปลี่ยนไปยัง root directory ของโปรเจกต์
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
Push-Location $projectRoot

Write-Host "🛑 Stopping TrackSpend MySQL Docker Container..." -ForegroundColor Cyan

docker-compose -f docker\docker-compose.yml stop

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Container stopped successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to stop container" -ForegroundColor Red
}

Pop-Location
