// ตั้งค่าฟอนต์ขนาดต่างๆ
const sizes = {
  pageTitle: 28,
  sectionTitle: 24,
  cardTitle: 22,
  modalTitle: 20,
  bodyLarge: 18,
  body: 16,
  bodyMedium: 15,
  caption: 14,
  captionSmall: 12,
  label: 12,
  // label ใหญ่ (Settings) ใช้ 16
  labelLarge: 16,
  amount: 16,
  amountLarge: 22,
  balance: 28,
};
const weights = {
  bold: "700",
  semibold: "600",
  medium: "500",
  normal: "400",
  extraBold: "800",
};



// หัวข้อหลักหน้า  28px หนา
export const headingPage = (colors) => ({
  fontSize: sizes.pageTitle,
  fontWeight: weights.bold,
  color: colors?.text,
});

//หัวข้อส่วน 24px หนามาก 
export const headingSection = (colors) => ({
  fontSize: sizes.sectionTitle,
  fontWeight: weights.extraBold,
  color: colors?.text,
});

// หัวข้อการ์ด / หัวข้อย่อย - 22px หนา 
export const headingCard = (colors) => ({
  fontSize: sizes.cardTitle,
  fontWeight: weights.bold,
  color: colors?.text,
});

// หัวข้อ Modal - 20px หนา 
export const headingModal = (colors) => ({
  fontSize: sizes.modalTitle,
  fontWeight: weights.bold,
  color: colors?.text,
});

//หัวข้อย่อย 
export const headingSubsection = (colors) => ({
  fontSize: sizes.bodyLarge,
  fontWeight: weights.bold,
  color: colors?.text,
});

// ========== ข้อความ ==========

//ข้อความรอง / คำอธิบายใต้หัวข้อ - 14px 
export const subtitle = (colors) => ({
  fontSize: sizes.caption,
  fontWeight: weights.medium,
  color: colors?.subtext,
});

// ข้อความปกติ - 16px */
export const body = (colors) => ({
  fontSize: sizes.body,
  fontWeight: weights.normal,
  color: colors?.text,
});

// ข้อความกลาง - 15px */
export const bodyMedium = (colors) => ({
  fontSize: sizes.bodyMedium,
  fontWeight: weights.normal,
  color: colors?.text,
});

//คำอธิบาย / caption - 14px 
export const caption = (colors) => ({
  fontSize: sizes.caption,
  fontWeight: weights.normal,
  color: colors?.subtext,
});

// คำอธิบายเล็ก - 12px 
export const captionSmall = (colors) => ({
  fontSize: sizes.captionSmall,
  fontWeight: weights.normal,
  color: colors?.subtext,
});

//Label - 12px หนา */
export const label = (colors) => ({
  fontSize: sizes.label,
  fontWeight: weights.semibold,
  color: colors?.text,
});

// Label ใหญ่ (เช่น ชื่อเล่น) - 16px หนา */
export const labelLarge = (colors) => ({
  fontSize: sizes.labelLarge,
  fontWeight: weights.bold,
  color: colors?.text,
});

// ========== ตัวเลข / จำนวนเงิน ==========

//ยอดเงินหลัก (Balance) - 28px หนามาก /
export const balanceAmount = (colors) => ({
  fontSize: sizes.balance,
  fontWeight: weights.extraBold,
  color: colors?.text,
});

// จำนวนเงินในรายการ - 16px 
export const amount = (colors) => ({
  fontSize: sizes.amount,
  fontWeight: weights.bold,
  color: colors?.text,
});

//จำนวนเงินใหญ่  - 22px หนา */
export const amountLarge = (colors) => ({
  fontSize: sizes.amountLarge,
  fontWeight: weights.bold,
  color: colors?.text,
});

// ========== ปุ่ม ==========

//ข้อความปุ่มหลัก - 18px 
export const buttonPrimary = () => ({
  fontSize: sizes.bodyLarge,
  fontWeight: weights.bold,
  color: "#FFFFFF",
});

//ข้อความปุ่มรอง - 16px หนากลาง 
export const buttonSecondary = (colors) => ({
  fontSize: sizes.body,
  fontWeight: weights.semibold,
  color: colors?.subtext,
});

// ชื่อหมวดหมู่ในรายการ - 14px หนา 
export const categoryName = (colors) => ({
  fontSize: sizes.caption,
  fontWeight: weights.bold,
  color: colors?.text,
});

// วันที่ / หมายเหตุ - 12px 
export const metaText = (colors) => ({
  fontSize: sizes.captionSmall,
  fontWeight: weights.normal,
  color: colors?.subtext,
});

//ชื่อผู้ใช้  - 20px หนา 
export const username = (colors) => ({
  fontSize: sizes.modalTitle,
  fontWeight: weights.bold,
  color: colors?.text,
});

//คำเตือนเล็ก - 12px 
export const greeting = (colors) => ({
  fontSize: sizes.captionSmall,
  fontWeight: weights.normal,
  color: colors?.subtext,
});
