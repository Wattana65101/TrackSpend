# ใช้โดเมนแทน IP สำหรับ Metro (ไม่ต้องเสียบ USB)

แอปโหลด JavaScript จาก **Metro** (พอร์ต 8081) ได้สองแบบ:

1. **ผ่าน USB** – รัน `adb reverse tcp:8081 tcp:8081` (ต้องเสียบสาย)
2. **ผ่านโดเมน** – เปิด Metro ออกอินเทอร์เน็ตด้วย Tunnel แล้วให้แอปชี้ไปที่โดเมน (ไม่ต้องใช้ IP ไม่ต้องเสียบ USB)

---

## ใช้โดเมนเดียวกันกับ API ได้ไหม?

**ได้** — ใช้ **โดเมนหลักเดียวกัน** แต่แยก **subdomain** คนละตัว:

| ใช้ทำอะไร | ตัวอย่าง hostname | ชี้ไปที่ |
|-----------|-------------------|----------|
| API (backend) | `trackspend-api.yourdomain.com` | localhost:500 |
| Metro (โหลดแอป) | `trackspend-metro.yourdomain.com` | localhost:8081 |

ใน **Cloudflare Tunnel config ไฟล์เดียว** ใส่ ingress สองอัน (ดู `cloudflare-tunnel.example.yml` ตัวเลือก A) แล้วรัน tunnel แค่หนึ่ง process — ทั้ง API และ Metro ใช้โดเมนเดียวกัน (คนละ subdomain)

**หมายเหตุ:** ถ้าตอนนี้ใช้ **Quick Tunnel** (trycloudflare.com) จะได้ URL คนละอันต่อหนึ่ง tunnel — ใช้ "โดเมนเดียวกัน" แบบ subdomain ได้เมื่อใช้ **Named Tunnel + โดเมนใน Cloudflare** (เช่น yourdomain.com)

**ตัวอย่างโปรเจกต์นี้:** API ใช้ Quick Tunnel อยู่ที่ `https://can-reservations-eos-guidance.trycloudflare.com` (config ใน `config/api.js`) — สำหรับ Metro ต้องรัน Quick Tunnel **อีกหนึ่งตัว** ชี้ไปพอร์ต 8081 แล้วได้ URL อีกอัน ไปใส่ในมือถือที่ Debug server host (ดูขั้นตอนด้านล่าง)

---

## ใช้โดเมนได้ไหม?

**ได้** — ใน Dev Settings บนมือถือ ใส่ **host:port** ได้ทั้ง IP และ **โดเมน** เช่น `metro.yourdomain.com:443`

---

## วิธีใช้โดเมน (ตัวอย่าง Cloudflare Tunnel)

1. **เปิด Metro อยู่ที่เครื่องคุณ**  
   ```bash
   npm start
   ```

2. **เปิด Tunnel ชี้ไปที่พอร์ต 8081**  
   - ใช้ Cloudflare Tunnel (หรือ ngrok) ให้ชี้จาก URL สาธารณะ → `localhost:8081`  
   - ตัวอย่าง (quick tunnel):  
     ```bash
     cloudflared tunnel --url http://localhost:8081
     ```  
   - จะได้ URL แบบ `https://xxx-xxx.trycloudflare.com`

3. **บนมือถือ**  
   - เปิดแอป → สั่นมือถือ (หรือ `adb shell input keyevent 82`) → **Dev Settings**  
   - **Debug server host & port for device** ใส่เป็น  
     - โดเมนจาก Tunnel + พอร์ต เช่น `xxx-xxx.trycloudflare.com:443`  
     - (ใช้ 443 เพราะ Tunnel ให้ HTTPS)

4. **Reload แอป** — แอปจะโหลด bundle จากโดเมนนั้น ไม่ต้องเสียบ USB และไม่ต้องใช้ IP

---

## สรุป

- **ใช้ IP** เพราะง่ายและไม่ต้องตั้ง Tunnel (แต่ต้องอยู่ Wi‑Fi เดียวกัน หรือใช้ USB + adb reverse)
- **ใช้โดเมนได้** ถ้า Metro ถูกเปิดออกผ่าน Tunnel/DNS ชี้มาเครื่องคุณ — แล้วไปตั้งใน Dev Settings เป็นโดเมน:port แทน IP
