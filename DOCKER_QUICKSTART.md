# 🐳 Docker Quick Start Guide

คู่มือเริ่มต้นใช้งาน Docker สำหรับ TrackSpend Database

## ⚡ Quick Start

### 1. เริ่ม Docker Container

```powershell
# Windows PowerShell
.\docker-start.ps1

# หรือใช้ docker-compose โดยตรง
docker-compose up -d
```

### 2. ตรวจสอบสถานะ

```powershell
# ดูสถานะ container
docker-compose ps

# ดู logs
docker-compose logs -f mysql
```

### 3. เชื่อมต่อ Database

**Connection Info:**
- Host: `localhost`
- Port: `3308`
- Database: `trackspend`
- User: `trackspend_user`
- Password: `trackspend_pass`
- Root Password: `wattana15277`

**ตัวอย่างการเชื่อมต่อ:**
```bash
mysql -h 127.0.0.1 -P 3308 -u trackspend_user -ptrackspend_pass trackspend
```

### 4. ตั้งค่า Server

สร้างไฟล์ `.env`:
```env
DB_HOST=localhost
DB_PORT=3308
DB_USER=trackspend_user
DB_PASSWORD=trackspend_pass
DB_NAME=trackspend
```

### 5. เริ่ม Server

```bash
node server.js
```

## 🛑 หยุด Container

```powershell
.\docker-stop.ps1

# หรือ
docker-compose stop
```

## 📊 คำสั่งที่มีประโยชน์

```bash
# ดู logs
docker-compose logs -f mysql

# เข้าไปใน container
docker exec -it trackspend-mysql bash

# เข้าไปใน MySQL shell
docker exec -it trackspend-mysql mysql -u root -p

# Backup database
docker exec trackspend-mysql mysqldump -u root -pwattana15277 trackspend > backup.sql

# Restore database
docker exec -i trackspend-mysql mysql -u root -pwattana15277 trackspend < backup.sql
```

## ⚠️ หมายเหตุ

- **Port 3308**: ใช้ port 3308 บน host machine (container ใช้ 3306)
- **Data Persistence**: ข้อมูลถูกเก็บใน Docker volume `mysql_data`
- **Auto Start**: Container จะ start อัตโนมัติเมื่อ Docker start

## 📚 ดูรายละเอียดเพิ่มเติม

ดู `database/DOCKER_SETUP.md` สำหรับคู่มือฉบับเต็ม

