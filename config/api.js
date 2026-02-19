/**
 * API Base URL - แก้ตามเครื่องที่ใช้ทดสอบ
 * - Emulator: "http://10.0.2.2:500"
 * - เครื่องจริง: "http://<IP คอมคุณ>:500" (เช่น http://192.168.1.35:500)
 * - Cloudflare Tunnel: ใช้ URL จาก cloudflared (เช่น https://xxx.trycloudflare.com)
 */
// Cloudflare Tunnel โดเมน
export const BASE_URL = "https://can-reservations-eos-guidance.trycloudflare.com";