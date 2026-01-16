# Environment Variables Example

สร้างไฟล์ `.env` ในโฟลเดอร์ `TrackSpend` และใส่ค่าต่อไปนี้:

```env
# Server Configuration
BASE_URL=http://10.0.2.2:500
SERVER_PORT=500

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=trackspend

# JWT Secret Key (เปลี่ยนเป็นค่าใหม่ที่ปลอดภัย)
JWT_SECRET_KEY=your_very_secret_key_change_this_in_production

# Environment
NODE_ENV=development
```

## หมายเหตุ

- **อย่า commit ไฟล์ `.env` ขึ้น GitHub**
- ไฟล์ `.env` ถูก ignore โดย `.gitignore` แล้ว
- สำหรับ production ให้ใช้ environment variables ที่ปลอดภัยกว่า

