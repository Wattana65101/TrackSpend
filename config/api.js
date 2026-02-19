/**
 * API Base URL
 * - ใช้โดเมน (แนะนำ): Cloudflare Tunnel เช่น https://xxx.trycloudflare.com หรือ https://trackspend-api.wattana.com
 * - เทสในเครือข่ายเดียว: "http://<IP เครื่อง>:500" (เช่น http://192.168.1.43:500)
 * - Emulator: "http://10.0.2.2:500"
 */
// ใช้โดเมน เพื่อให้แอปเรียก API ผ่านอินเทอร์เน็ต ไม่ต้องอยู่ WiFi เดียวกับเครื่องเซิร์ฟ
export const BASE_URL = "https://can-reservations-eos-guidance.trycloudflare.com";