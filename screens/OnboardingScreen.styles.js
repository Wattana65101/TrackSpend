import { StyleSheet } from "react-native";
import { theme } from "../config/theme";
import { headingPage, headingModal, subtitle, buttonPrimary, buttonSecondary } from "../config/styles";

const { spacing, radius, shadow } = theme;

/**
 * สร้าง styles สำหรับ OnboardingScreen
 * ใช้ฟังก์ชันจาก config/styles.js - แก้ที่ styles.js ครั้งเดียว ทุกหน้าจะเปลี่ยนตาม
 */
export const createOnboardingStyles = (colors = {}, hexToRgbA = (hex, a) => `rgba(0,0,0,${a})`) => {
  const c = {
    background: colors?.background || theme.colors.background,
    text: colors?.text || theme.colors.text,
    subtext: colors?.subtext || theme.colors.subtext,
    primary: colors?.primary || theme.colors.primary,
  };

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    skipButton: {
      position: "absolute",
      top: 0,
      right: spacing.xl,
      zIndex: 10,
      padding: spacing.lg,
    },
    skipText: { ...buttonSecondary(c) },
    scrollView: {
      flex: 1,
    },
    page: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: spacing["4xl"],
    },
    content: {
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
    },
    iconContainer: {
      width: 160,
      height: 160,
      borderRadius: radius.full,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: spacing["4xl"],
    },
    title: {
      ...headingPage(c),
      textAlign: "center",
      marginBottom: spacing.xl,
    },
    titleOverride: { ...headingModal(c) },
    description: {
      ...subtitle(c),
      textAlign: "center",
      lineHeight: theme.lineHeight.normal,
      paddingHorizontal: spacing.xl,
    },
    pagination: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: spacing.xl,
      gap: spacing.sm,
    },
    dot: {
      height: spacing.sm,
      borderRadius: radius.sm,
    },
    dotActive: {
      width: spacing["2xl"],
    },
    dotInactive: {
      width: spacing.sm,
    },
    buttonContainer: {
      flexDirection: "row",
      paddingHorizontal: spacing.xl,
      gap: spacing.md,
      paddingTop: spacing.xl,
    },
    button: {
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing["2xl"],
      borderRadius: radius.lg,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    },
    buttonPrimary: {
      backgroundColor: c.primary,
      ...shadow.md,
    },
    buttonPrimaryText: { ...buttonPrimary() },
    buttonSecondary: {
      flex: 0.4,
      backgroundColor: hexToRgbA(c.subtext, 0.1),
    },
    buttonSecondaryText: { ...buttonSecondary(c) },
  });
};
