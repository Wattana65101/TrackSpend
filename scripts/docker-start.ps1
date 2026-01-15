# PowerShell script สำหรับเริ่ม Docker MySQL container
# TrackSpend Database Setup

# เปลี่ยนไปยัง root directory ของโปรเจกต์
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
Push-Location $projectRoot

Write-Host "🐳 Starting TrackSpend MySQL Docker Container..." -ForegroundColor Cyan

# ตรวจสอบว่า Docker ทำงานอยู่หรือไม่
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed or not running" -ForegroundColor Red
    Write-Host "   Please install Docker Desktop from https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    Pop-Location
    exit 1
}

# ตรวจสอบว่า docker-compose.yml มีอยู่หรือไม่
if (-not (Test-Path "docker\docker-compose.yml")) {
    Write-Host "❌ docker\docker-compose.yml not found!" -ForegroundColor Red
    Pop-Location
    exit 1
}

# ตรวจสอบว่า port 3308 ว่างหรือไม่
$portCheck = Get-NetTCPConnection -LocalPort 3308 -ErrorAction SilentlyContinue
if ($portCheck) {
    Write-Host "⚠️  Port 3308 is already in use" -ForegroundColor Yellow
    Write-Host "   Trying to start anyway..." -ForegroundColor Yellow
}

# Start Docker container
Write-Host "`n🚀 Starting MySQL container..." -ForegroundColor Cyan
docker-compose -f docker\docker-compose.yml up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Container started successfully!" -ForegroundColor Green
    
    # รอให้ MySQL พร้อม
    Write-Host "`n⏳ Waiting for MySQL to be ready..." -ForegroundColor Cyan
    $maxAttempts = 30
    $attempt = 0
    $ready = $false
    
    while ($attempt -lt $maxAttempts -and -not $ready) {
        Start-Sleep -Seconds 2
        $attempt++
        
        try {
            $result = docker exec trackspend-mysql mysqladmin ping -h localhost -u root -pwattana15277 2>&1
            if ($result -match "mysqld is alive") {
                $ready = $true
                Write-Host "✅ MySQL is ready!" -ForegroundColor Green
            }
        } catch {
            Write-Host "." -NoNewline -ForegroundColor Gray
        }
    }
    
    if (-not $ready) {
        Write-Host "`n⚠️  MySQL might still be starting. Check logs with: docker-compose -f docker\docker-compose.yml logs mysql" -ForegroundColor Yellow
    }
    
    # แสดงข้อมูลการเชื่อมต่อ
    Write-Host "`n📋 Connection Information:" -ForegroundColor Cyan
    Write-Host "   Host: localhost" -ForegroundColor White
    Write-Host "   Port: 3308" -ForegroundColor White
    Write-Host "   Database: trackspend" -ForegroundColor White
    Write-Host "   User: trackspend_user" -ForegroundColor White
    Write-Host "   Password: trackspend_pass" -ForegroundColor White
    Write-Host "   Root Password: wattana15277" -ForegroundColor White
    
    # ตรวจสอบว่า schema ถูกสร้างแล้วหรือยัง
    Write-Host "`n🔍 Checking database schema..." -ForegroundColor Cyan
    $schemaCheck = docker exec trackspend-mysql mysql -u root -pwattana15277 -e "USE trackspend; SHOW TABLES;" 2>&1
    
    if ($schemaCheck -match "users") {
        Write-Host "✅ Database schema already exists" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Database schema not found. Importing..." -ForegroundColor Yellow
        
        if (Test-Path "database\schema.sql") {
            Get-Content database\schema.sql | docker exec -i trackspend-mysql mysql -u root -pwattana15277
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Schema imported successfully!" -ForegroundColor Green
            } else {
                Write-Host "❌ Failed to import schema" -ForegroundColor Red
            }
        } else {
            Write-Host "❌ database\schema.sql not found!" -ForegroundColor Red
        }
    }
    
    Write-Host "`n✨ Setup complete!" -ForegroundColor Green
    Write-Host "   View logs: docker-compose -f docker\docker-compose.yml logs -f mysql" -ForegroundColor Cyan
    Write-Host "   Stop container: .\scripts\docker-stop.ps1" -ForegroundColor Cyan
    Write-Host "   Connect: mysql -h 127.0.0.1 -P 3308 -u trackspend_user -ptrackspend_pass trackspend" -ForegroundColor Cyan
    
} else {
    Write-Host "❌ Failed to start container" -ForegroundColor Red
    Write-Host "   Check logs: docker-compose -f docker\docker-compose.yml logs mysql" -ForegroundColor Yellow
    Pop-Location
    exit 1
}

Pop-Location
