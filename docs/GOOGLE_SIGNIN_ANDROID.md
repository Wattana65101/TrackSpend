# Google Sign-In บน Android – เช็คเมื่อเข้าอินด้วย Google ไม่ได้

## "No OAuth clients to display" / ยังไม่มี OAuth 2.0 Client IDs

ถ้าใน Google Cloud Console → Credentials เห็นเฉพาะ **API Keys** และ **OAuth 2.0 Client IDs** ขึ้นว่า "No OAuth clients to display" แปลว่า **ยังไม่ได้สร้าง OAuth clients สำหรับ Google Sign-In** (API Key อย่างเดียวใช้สำหรับ Google Sign-In ไม่ได้)

**ต้องทำ 2 อย่าง:**

1. **ตั้ง OAuth consent screen ก่อน (ครั้งเดียว)**  
   - ในเมนูซ้ายกด **OAuth consent screen**  
   - เลือก User type (ถ้าเป็นแอปทดสอบใช้ External ได้)  
   - กรอก App name, User support email, Developer contact  
   - Save

2. **สร้าง OAuth 2.0 Client IDs**  
   - กลับไปที่ **Credentials** → **+ Create credentials** → **OAuth client ID**  
   - สร้าง **Web application** หนึ่งตัว (ใช้เป็น `webClientId` ในแอป) → หลังสร้าง copy **Client ID** ไว้  
   - สร้าง **Android** อีกหนึ่งตัว: Package name = `com.trackspend`, SHA-1 = `45:9C:2C:47:D0:EE:9E:68:35:CB:C6:49:58:1A:46:12:EA:45:D7:0B`  
   - หลังสร้างทั้งคู่แล้ว ไปอัปเดตแอป: ใส่ **Web Client ID** ใน `config/google-client.json` (หรือ .env) และใน backend (.env: GOOGLE_WEB_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID)

ถ้าแอปใช้โปรเจกต์คนละตัว (เช่น แอปชี้ไป teackspemd แต่คุณเปิดโปรเจกต์ thitrip-f0750) ให้สลับไปที่โปรเจกต์ที่แอปใช้ แล้วเช็คว่ามี OAuth clients ครบหรือยัง

---

## DEVELOPER_ERROR (Error แบบนี้บนแอป)

ถ้าแอปขึ้น **"DEVELOPER_ERROR"** หรือลิงก์ไปที่ troubleshooting ของ react-native-google-signin แปลว่า **การตั้งค่าใน Google Cloud Console ไม่ตรงกับแอป** (โดยเฉพาะ SHA-1 และ Package name ของ Android OAuth client). ทำตามขั้นตอนด้านล่างให้ครบ

---

## สาเหตุที่พบบ่อย

### 1. ยังไม่ได้ใส่ SHA-1 ใน Google Cloud Console (สำคัญที่สุด)

บน Android แอปจะได้ `idToken` จาก Google ได้ก็ต่อเมื่อ **SHA-1 fingerprint** ของแอปถูกเพิ่มใน OAuth Client (Android) แล้ว

**ขั้นตอน:**

1. เปิด [Google Cloud Console](https://console.cloud.google.com/) → โปรเจกต์ที่ใช้ (เช่น teackspemd)
2. ไปที่ **APIs & Services** → **Credentials**
3. ใน OAuth 2.0 Client IDs หา client แบบ **Android** (หรือกด **+ CREATE CREDENTIALS** → **OAuth client ID** → Application type: **Android**)
   - **Package name:** ต้องเป็น `com.trackspend` (ตรงกับ `applicationId` ใน `android/app/build.gradle`)
   - **SHA-1 certificate fingerprint:** ใส่ SHA-1 จากการรันคำสั่งด้านล่าง
   - กด Create / Save

**หา SHA-1 (Debug) บน Windows:**

```powershell
cd D:\Gitproject\TrackSpend\android
.\gradlew.bat signingReport
```

หรือใช้ keytool (จาก JDK):

```powershell
keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

ในผลลัพธ์จะมี **SHA1:** — copy ค่านี้ไปใส่ใน Google Cloud Console ที่ Android client

4. บันทึก แล้ว **รันแอปใหม่** (ไม่จำเป็นต้อง rebuild ถ้าแค่เพิ่ม SHA-1 ใน Console)

---

### 2. เชื่อมต่อ backend ไม่ได้ (BASE_URL)

- แอปเรียก `BASE_URL/api/auth/google` (ดูใน `config/api.js`)
- ถ้าใช้ Cloudflare Tunnel ให้แน่ใจว่า `cloudflared` รันอยู่และ URL ตรงกับที่ตั้งในแอป
- ถ้าใช้ IP เครื่อง (เช่น `http://192.168.1.x:500`) ให้แน่ใจว่า backend รันที่พอร์ตนั้น และมือถือกับคอมอยู่เครือข่ายเดียวกัน

---

### 3. Web Client ID ต้องเป็นแบบ Web application

ใน `config/google.js` และ `App.js` ใช้ **Web application** client ID เป็น `webClientId` เท่านั้น  
ห้ามใช้ Android client ID ใน `GoogleSignin.configure({ webClientId: ... })`

---

## ค่า SHA-1 สำหรับ Debug build (เครื่องนี้)

ถ้าใช้ debug build (รันจาก `npm run android`) ใช้ SHA-1 นี้ใน Google Cloud Console:

```
45:9C:2C:47:D0:EE:9E:68:35:CB:C6:49:58:1A:46:12:EA:45:D7:0B
```

Package name ของแอป: **com.trackspend**

---

## สรุปเช็คลิสต์

- [ ] ใน Google Cloud Console → Credentials มี OAuth client แบบ **Android** สำหรับ package name **com.trackspend**
- [ ] ใส่ **SHA-1** ด้านบน (หรือจาก `.\gradlew.bat signingReport`) ใน Android client แล้ว
- [ ] แอปใช้ **Web** client ID ใน `webClientId` (ห้ามใช้ Android client ID)
- [ ] Backend รันอยู่ และ `BASE_URL` ในแอปชี้ไปที่ backend ได้ (หรือ tunnel ทำงาน)
