# 🐳 Docker Setup สำหรับ TrackSpend Database

คู่มือการติดตั้งและใช้งาน MySQL Database บน Docker สำหรับ TrackSpend

## 📋 ข้อกำหนดเบื้องต้น

- Docker Desktop ติดตั้งแล้ว (Windows/Mac/Linux)
- Docker Compose (มาพร้อมกับ Docker Desktop)

## 🚀 การติดตั้งและเริ่มใช้งาน

### 1. สร้างไฟล์ `.env` (ถ้ายังไม่มี)

```bash
# คัดลอกจาก docker.env.example
cp docker.env.example .env
```

แก้ไขค่าตามต้องการ (หรือใช้ค่า default ก็ได้)

### 2. เริ่ม Docker Container

```bash
# Start MySQL container
docker-compose up -d

# ตรวจสอบสถานะ
docker-compose ps

# ดู logs
docker-compose logs -f mysql
```

### 3. ตรวจสอบการเชื่อมต่อ

```bash
# เชื่อมต่อด้วย MySQL client
mysql -h 127.0.0.1 -P 3308 -u trackspend_user -p trackspend

# หรือใช้ root user
mysql -h 127.0.0.1 -P 3308 -u root -p
```

### 4. Import Schema (ถ้ายังไม่มี)

```bash
# Copy schema.sql เข้าไปใน container
docker cp database/schema.sql trackspend-mysql:/tmp/schema.sql

# Import schema
docker exec -i trackspend-mysql mysql -u root -p${DB_ROOT_PASSWORD} trackspend < database/schema.sql

# หรือใช้ mysql client จากเครื่อง host
mysql -h 127.0.0.1 -P 3308 -u root -p trackspend < database/schema.sql
```

## 🔧 การจัดการ Container

### Start/Stop/Restart

```bash
# Start
docker-compose up -d

# Stop
docker-compose stop

# Restart
docker-compose restart

# Stop และลบ container (ข้อมูลจะยังอยู่เพราะใช้ volume)
docker-compose down

# Stop และลบทุกอย่างรวมถึง volume (⚠️ ข้อมูลจะหาย!)
docker-compose down -v
```

### ดู Logs

```bash
# ดู logs แบบ real-time
docker-compose logs -f mysql

# ดู logs ล่าสุด 100 บรรทัด
docker-compose logs --tail=100 mysql
```

### เข้าไปใน Container

```bash
# เข้าไปใน MySQL container
docker exec -it trackspend-mysql bash

# เข้าไปใน MySQL shell
docker exec -it trackspend-mysql mysql -u root -p
```

## 📊 การ Backup และ Restore

### Backup Database

```bash
# Backup ทั้ง database
docker exec trackspend-mysql mysqldump -u root -p${DB_ROOT_PASSWORD} trackspend > backup_$(date +%Y%m%d_%H%M%S).sql

# หรือใช้ docker-compose
docker-compose exec mysql mysqldump -u root -p${DB_ROOT_PASSWORD} trackspend > backup.sql
```

### Restore Database

```bash
# Restore จากไฟล์ backup
docker exec -i trackspend-mysql mysql -u root -p${DB_ROOT_PASSWORD} trackspend < backup.sql

# หรือใช้ docker-compose
docker-compose exec -T mysql mysql -u root -p${DB_ROOT_PASSWORD} trackspend < backup.sql
```

## 🔍 การตรวจสอบ

### ตรวจสอบว่า Container ทำงานอยู่

```bash
docker-compose ps
```

ควรเห็น:
```
NAME                IMAGE       COMMAND                  STATUS          PORTS
trackspend-mysql    mysql:8.0   "docker-entrypoint..."   Up (healthy)    0.0.0.0:3308->3306/tcp
```

### ตรวจสอบ Port

```bash
# Windows PowerShell
netstat -ano | findstr :3308

# Linux/Mac
lsof -i :3308
```

### ทดสอบการเชื่อมต่อ

```bash
# ใช้ mysql client
mysql -h 127.0.0.1 -P 3308 -u trackspend_user -ptrackspend_pass trackspend -e "SHOW TABLES;"
```

## ⚙️ Configuration

### เปลี่ยน Port

แก้ไขใน `docker-compose.yml`:
```yaml
ports:
  - "3309:3306"  # เปลี่ยนจาก 3308 เป็น 3309
```

### เปลี่ยน Password

แก้ไขใน `.env`:
```env
DB_ROOT_PASSWORD=your_new_password
DB_PASSWORD=your_new_password
```

แล้ว restart container:
```bash
docker-compose down
docker-compose up -d
```

## 🐛 การแก้ไขปัญหา

### Container ไม่ start

```bash
# ดู logs เพื่อหาสาเหตุ
docker-compose logs mysql

# ตรวจสอบว่า port 3308 ว่างหรือไม่
netstat -ano | findstr :3308
```

### ไม่สามารถเชื่อมต่อได้

1. ตรวจสอบว่า container ทำงานอยู่:
   ```bash
   docker-compose ps
   ```

2. ตรวจสอบ logs:
   ```bash
   docker-compose logs mysql
   ```

3. ทดสอบเชื่อมต่อจากภายใน container:
   ```bash
   docker exec -it trackspend-mysql mysql -u root -p
   ```

### ข้อมูลหาย

ข้อมูลถูกเก็บใน Docker volume `mysql_data` ซึ่งจะไม่หายเมื่อ restart container

ถ้าต้องการลบข้อมูล:
```bash
docker-compose down -v  # ⚠️ ระวัง! จะลบข้อมูลทั้งหมด
```

## 📝 หมายเหตุ

- **Port**: ใช้ port 3308 บน host machine แม้ว่า container จะใช้ 3306
- **Data Persistence**: ข้อมูลถูกเก็บใน Docker volume `mysql_data`
- **Auto Start**: Container จะ start อัตโนมัติเมื่อ Docker start (ถ้าใช้ `restart: unless-stopped`)
- **Health Check**: Container มี health check ที่ตรวจสอบทุก 10 วินาที

## 🔗 ลิงก์ที่เป็นประโยชน์

- [Docker Documentation](https://docs.docker.com/)
- [MySQL Docker Image](https://hub.docker.com/_/mysql)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

