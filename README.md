# TrackSpend - Money Management App 💰

แอปพลิเคชันจัดการเงินส่วนบุคคลที่ช่วยให้คุณติดตามรายรับ-รายจ่าย วางแผนงบประมาณ และวิเคราะห์การใช้เงินได้อย่างง่ายดาย

## ✨ Features

- 📊 **ติดตามรายรับ-รายจ่าย** - บันทึกและจัดการธุรกรรมทางการเงินของคุณ
- 💵 **ยอดเงินคงเหลือ** - ดูยอดเงินคงเหลือแบบเรียลไทม์
- 📈 **กราฟสรุป** - วิเคราะห์รายรับ-รายจ่ายรายสัปดาห์และรายเดือน
- 💰 **จัดการงบประมาณ** - ตั้งงบประมาณตามหมวดหมู่
- 📱 **รายงาน** - ดูรายงานสรุปการใช้เงิน
- 🎨 **ธีมสวยงาม** - รองรับหลายธีม (Emerald, Blue, Purple, Pink, Orange)
- 🔐 **ระบบความปลอดภัย** - เข้ารหัสรหัสผ่านและใช้ JWT สำหรับการยืนยันตัวตน

## 🛠️ Tech Stack

- **Frontend**: React Native
- **Backend**: Node.js + Express
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Token)
- **Icons**: React Native Vector Icons
- **Charts**: react-native-chart-kit

## 📋 Prerequisites

- Node.js (v14 หรือสูงกว่า)
- MySQL Server
- React Native development environment
- Android Studio (สำหรับ Android) หรือ Xcode (สำหรับ iOS)

## 🚀 Installation

1. **Clone repository**
```bash
git clone https://github.com/Wattana65101/TrackSpend.git
cd TrackSpend
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup Database**

   **วิธีที่ 1: ใช้ Docker (แนะนำ)**
   ```bash
   # เริ่ม MySQL container (port 3308)
   .\scripts\docker-start.ps1
   
   # หรือใช้ docker-compose โดยตรง
   docker-compose -f docker\docker-compose.yml up -d
   ```
   ดูรายละเอียดเพิ่มเติมใน `docs/DOCKER_SETUP.md` หรือ `docs/DOCKER_QUICKSTART.md`

   **วิธีที่ 2: ติดตั้ง MySQL แบบปกติ**
   - ติดตั้ง MySQL Server
   - สร้าง database ชื่อ `trackspend`
   - Import schema: `mysql -u root -p trackspend < database/schema.sql`

4. **Configure Server**
   - สร้างไฟล์ `.env` จาก `.env.example`
   - แก้ไข `BASE_URL` ใน `screens/AppContext.js` ให้ตรงกับ IP address ของ server
   - สำหรับ Docker: ตั้งค่า `DB_HOST=localhost` และ `DB_PORT=3308` ใน `.env`
   - สำหรับ MySQL แบบปกติ: ตั้งค่า `DB_HOST=127.0.0.1` และ `DB_PORT=3306`
   - ดูตัวอย่างเพิ่มเติมใน `docs/ENV_EXAMPLE.md`

5. **Start Server**
```bash
node server.js
```

6. **Run App**

### Android
```bash
npm run android
```

### iOS
```bash
cd ios
pod install
cd ..
npm run ios
```

## 📱 Screenshots

- Home Screen - หน้าหลักแสดงยอดเงินคงเหลือและรายการล่าสุด
- Add Transaction - เพิ่มรายรับ/รายจ่าย
- Budgets - จัดการงบประมาณ
- Reports - รายงานสรุป
- Settings - ตั้งค่าและเปลี่ยนธีม

## 🔧 Configuration

### Server Configuration
แก้ไขไฟล์ `server.js`:
- Database connection settings
- JWT Secret Key
- Port number

### App Configuration
แก้ไขไฟล์ `screens/AppContext.js`:
- `BASE_URL` - URL ของ backend server

## 📝 Features Detail

### การจัดการธุรกรรม
- เพิ่มรายรับ/รายจ่าย
- แก้ไขและลบธุรกรรม
- จัดหมวดหมู่ธุรกรรม
- เพิ่มหมายเหตุ

### การจัดการงบประมาณ
- ตั้งงบประมาณตามหมวดหมู่
- ติดตามการใช้เงินเทียบกับงบประมาณ
- แก้ไขและลบงบประมาณ

### การวิเคราะห์
- กราฟรายรับ-รายจ่ายรายสัปดาห์
- กราฟรายรับ-รายจ่ายรายเดือน
- สรุปรายรับ-รายจ่ายเดือนนี้

## 🔐 Security

- รหัสผ่านถูกเข้ารหัสด้วย bcrypt
- ใช้ JWT สำหรับการยืนยันตัวตน
- Token หมดอายุใน 1 วัน

## 📁 Project Structure

```
TrackSpend/
├── components/          # Reusable components
│   ├── AppLogo.js
│   ├── MoneyGrowLogo.js
│   ├── LoadingSpinner.js
│   └── ErrorBoundary.js
├── screens/            # Screen components
│   ├── HomeScreen.js
│   ├── LoginScreen.js
│   ├── RegisterScreen.js
│   ├── AddTransactionScreen.js
│   └── ...
├── assets/             # Images and assets
├── server.js           # Backend server
└── ...
```

## 🔒 Security

- รหัสผ่านถูกเข้ารหัสด้วย bcrypt
- ใช้ JWT สำหรับการยืนยันตัวตน
- Token หมดอายุใน 1 วัน
- **สำคัญ**: เปลี่ยน `SECRET_KEY` ใน production

## 📝 Additional Files

- `LICENSE` - MIT License
- `CONTRIBUTING.md` - Guidelines สำหรับ contributors
- `FEATURES.md` - Roadmap และ features ที่วางแผนไว้
- `ENV_EXAMPLE.md` - ตัวอย่าง environment variables

## 🧪 Testing

```bash
npm test
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Wattana65101**

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 🙏 Acknowledgments

- React Native Community
- All contributors and open-source libraries used in this project

## 📞 Support

หากมีปัญหาหรือคำถาม สามารถเปิด issue บน GitHub ได้เลย

---

Made with ❤️ using React Native
