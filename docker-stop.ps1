# PowerShell script สำหรับหยุด Docker MySQL container

Write-Host "🛑 Stopping TrackSpend MySQL Docker Container..." -ForegroundColor Cyan

docker-compose stop

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Container stopped successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to stop container" -ForegroundColor Red
}

