/**
 * API Base URL - แก้ตามเครื่องที่ใช้ทดสอบ
 * - Emulator บนเครื่องเดียวกับ server: "http://10.0.2.2:500"
 * - เครื่องจริง: "http://<IP คอมคุณ>:500" (เช่น http://192.168.1.35:500)
 * - Cloudflare Tunnel: ใช้ URL จาก cloudflared (เช่น https://xxx.trycloudflare.com)
 *   หมายเหตุ: URL เปลี่ยนทุกครั้งที่รัน cloudflared ใหม่
 */
// Emulator บนเครื่องเดียวกับ server: "http://10.0.2.2:500" | Cloudflare Tunnel: "https://xxx.trycloudflare.com"
export const BASE_URL = "https://can-reservations-eos-guidance.trycloudflare.com";
//http://45:9C:2C:47:D0:EE:9E:68:35:CB:C6:49:58:1A:46:12:EA:45:D7:0B:5000