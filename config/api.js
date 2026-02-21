/**
 * API Base URL
 * - ใช้โดเมน (แนะนำ): Cloudflare Tunnel เช่น https://xxx.trycloudflare.com หรือ https://trackspend-api.wattana.com
 * - เทสในเครือข่ายเดียว: "http://<IP เครื่อง>:500" (เช่น http://192.168.1.43:500)
 * - Emulator: "http://10.0.2.2:500"
 */
// Quick Tunnel (API พอร์ต 500): รัน cloudflared tunnel --url http://localhost:500
export const BASE_URL = "https://broadcast-acdbentity-msgid-statement.trycloudflare.com";
//http://45:9C:2C:47:D0:EE:9E:68:35:CB:C6:49:58:1A:46:12:EA:45:D7:0B:5000   