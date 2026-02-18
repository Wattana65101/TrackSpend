/**
 * Theme / Design System - กำหนดค่าทั่วทั้งแอป
 * แก้ไขที่นี่ครั้งเดียว ทุกหน้าก็จะเปลี่ยนตาม
 *
 * ใช้: import { theme } from '../config/theme';
 */

export const theme = {
  // === Typography ขนาดฟอนต์ ===
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    md: 18,
    lg: 20,
    xl: 24,
    "2xl": 28,
    "3xl": 32,
  },

  // === น้ำหนักฟอนต์ ===
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },

  // === ความสูงบรรทัด ===
  lineHeight: {
    tight: 20,
    normal: 24,
    relaxed: 28,
  },

  // === ช่องว่าง (spacing) ===
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    "2xl": 24,
    "3xl": 32,
    "4xl": 40,
  },

  // === มุมโค้ง (border radius) ===
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  // === ขนาดไอคอน ===
  iconSize: {
    sm: 18,
    md: 20,
    lg: 24,
    xl: 32,
    "2xl": 48,
  },

  // === สีพื้นฐาน (fallback - AppContext จะ override ด้วย colors ตามธีม) ===
  colors: {
    background: "#ECFDF5",
    text: "#064E3B",
    subtext: "#6B7280",
    primary: "#059669",
    white: "#FFFFFF",
  },

  // === เงา (shadow) ===
  shadow: {
    sm: {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 5,
    },
  },
};
