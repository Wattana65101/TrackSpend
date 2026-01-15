# 📁 โครงสร้างโปรเจกต์ TrackSpend

## 📂 โครงสร้างโฟลเดอร์

```
TrackSpend/
├── 📁 android/              # Android native code
├── 📁 ios/                   # iOS native code
├── 📁 components/            # React Native components
├── 📁 screens/               # Screen components
├── 📁 assets/                # Images and assets
├── 📁 database/              # Database files
│   ├── schema.sql           # Database schema
│   ├── init/                # Init scripts
│   └── data/                # Data exports
├── 📁 docker/                # Docker configuration
│   ├── docker-compose.yml   # Docker Compose config
│   └── docker.env.example   # Environment variables example
├── 📁 scripts/               # PowerShell scripts
│   ├── docker-start.ps1     # Start Docker container
│   ├── docker-stop.ps1      # Stop Docker container
│   └── refresh-env.ps1      # Refresh environment variables
├── 📁 docs/                  # Documentation
│   ├── DOCKER_SETUP.md      # Docker setup guide
│   ├── DOCKER_QUICKSTART.md  # Docker quick start
│   ├── CONTRIBUTING.md       # Contributing guidelines
│   ├── FEATURES.md           # Features documentation
│   ├── BUGS_AND_FIXES.md     # Bugs and fixes log
│   └── ENV_EXAMPLE.md        # Environment variables example
├── 📁 __tests__/             # Test files
├── App.js                    # Main app component
├── index.js                  # Entry point
├── server.js                 # Backend server
├── package.json              # Node.js dependencies
├── README.md                 # Main documentation
└── .gitignore               # Git ignore rules
```

## 📝 ไฟล์สำคัญ

### Configuration Files
- `package.json` - Node.js dependencies และ scripts
- `docker-compose.yml` - Docker configuration (อยู่ใน `docker/`)
- `.env` - Environment variables (สร้างจาก `docker/docker.env.example`)

### Scripts
- `scripts/docker-start.ps1` - เริ่ม Docker MySQL container
- `scripts/docker-stop.ps1` - หยุด Docker container
- `scripts/refresh-env.ps1` - Refresh environment variables

### Documentation
- `README.md` - คู่มือหลัก
- `docs/DOCKER_SETUP.md` - คู่มือ Docker แบบละเอียด
- `docs/DOCKER_QUICKSTART.md` - คู่มือ Docker แบบย่อ

### Database
- `database/schema.sql` - Database schema
- `database/init/01-init.sql` - Init scripts

## 🚀 การใช้งาน

### เริ่ม Docker Database
```powershell
.\scripts\docker-start.ps1
```

### หยุด Docker Database
```powershell
.\scripts\docker-stop.ps1
```

### เริ่ม Server
```bash
node server.js
```

### เริ่ม React Native App
```bash
npm run android
# หรือ
npm run ios
```

## 📚 เอกสารเพิ่มเติม

- ดู `README.md` สำหรับคู่มือการติดตั้ง
- ดู `docs/DOCKER_SETUP.md` สำหรับคู่มือ Docker แบบละเอียด
- ดู `docs/DOCKER_QUICKSTART.md` สำหรับคู่มือ Docker แบบย่อ

