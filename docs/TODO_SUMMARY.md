# สรุป: สิ่งที่ต้องทำต่อ (TrackSpend)

## 1. Google Sign-In บนมือถือ (ถ้ายังเข้าไม่ได้)

- เปิด **Google Cloud Console** → โปรเจกต์ **TeackSpemd** → **Credentials**
- เข้า **Android client** (Package name: `com.trackspend`)
- ใส่ **SHA-1** ของเครื่องที่ใช้ build:  
  `45:9C:2C:47:D0:EE:9E:68:35:CB:C6:49:58:1A:46:12:EA:45:D7:0B`
- Save แล้วรอ 1–2 นาที แล้วลองเข้าสู่ระบบด้วย Google อีกครั้ง  
- รายละเอียด: `docs/GOOGLE_SIGNIN_ANDROID.md`

---

## 2. Metro (โหลดแอป) – เลือกอย่างใดอย่างหนึ่ง

**ตัวเลือก A: ใช้ USB**
- เสียบ USB → รันใน PowerShell: `adb reverse tcp:8081 tcp:8081`
- Reload แอปบนมือถือ

**ตัวเลือก B: ใช้โดเมน (ไม่ต้องเสียบ USB)**
- ถ้ามีโดเมนใน Cloudflare: ตั้ง Tunnel ให้มี 2 hostname (API + Metro) ตาม `cloudflare-tunnel.example.yml` ตัวเลือก A
- บนมือถือ: Dev Settings → Debug server host & port = `trackspend-metro.yourdomain.com:443`
- รายละเอียด: `docs/METRO_DOMAIN.md`

---

## 3. API (Backend)

- ตอนนี้ใช้โดเมนใน `config/api.js` แล้ว (เช่น Cloudflare Tunnel URL)
- ให้ **backend รันอยู่** (`node server.js` หรือ `npm run server`) และ **tunnel ชี้ไปที่เครื่องคุณ** เมื่อจะเทส

---

## 4. เช็คอื่นๆ (ตามต้องการ)

- **ANDROID_HOME** และ **Path** (platform-tools) ตั้งแล้ว จะได้ใช้คำสั่ง `adb` ได้
- หน้า **สมัครสมาชิก**: อยู่ใต้ปุ่ม Google ที่หน้าล็อกอิน (เลื่อนลง) หรือกด "CREATE ACCOUNT" / "สมัครสมาชิก"
- **REACT_EDITOR**: ตั้งใน Windows หรือ .env ถ้าอยากให้กดเปิดไฟล์จาก error แล้วเปิดใน Cursor แทน Notepad

---

**สรุปสั้นๆ:**  
ถ้าโฟกัสแค่ให้แอปรันและล็อกอินได้: ทำข้อ 1 (SHA-1) และข้อ 2 ตัวเลือก A (adb reverse ตอนเสียบ USB) ก็เพียงพอแล้ว
