import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { AppContext } from "./AppContext";
import { headingPage, subtitle, caption, buttonPrimary } from "../config/styles";

export default function ResetPasswordScreen({ navigation, route }) {
  const { colors, BASE_URL, hexToRgbA } = useContext(AppContext);
  const email = route.params?.email || "";
  const devCode = route.params?.devCode;
  const [code, setCode] = useState(devCode || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("❌ ล้มเหลว", "ไม่พบอีเมล กรุณาเริ่มต้นจากหน้า ลืมรหัสผ่าน");
      return;
    }
    if (!code || code.length !== 6) {
      Alert.alert("❌ ล้มเหลว", "กรุณากรอกรหัส 6 หลักที่ได้รับทางอีเมล");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert("❌ ล้มเหลว", "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("❌ ล้มเหลว", "รหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: code.trim(), newPassword }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        Alert.alert("✅ สำเร็จ", data.message || "ตั้งรหัสผ่านใหม่สำเร็จ! กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่", [
          { text: "ตกลง", onPress: () => navigation.replace("Login") },
        ]);
      } else {
        Alert.alert("❌ ล้มเหลว", data.message || "เกิดข้อผิดพลาด กรุณาขอรหัสรีเซ็ตใหม่");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      Alert.alert("❌ ล้มเหลว", "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerSection}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[headingPage(colors), styles.titleLayout]}>ยืนยันตัวตนและตั้งรหัสผ่านใหม่</Text>
          <Text style={subtitle(colors)}>กรอกรหัส 6 หลักจากอีเมล แล้วตั้งรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.text }]}>
          {email ? <Text style={[caption(colors), styles.emailLabel]}>{email}</Text> : null}
          <View style={styles.inputWrapper}>
            <View style={[styles.iconContainer, { backgroundColor: hexToRgbA(colors.primary, 0.1) }]}>
              <Ionicons name="key-outline" size={20} color={colors.primary} />
            </View>
            <TextInput
              style={[
                styles.input,
                styles.codeInput,
                { color: colors.text, borderColor: hexToRgbA(colors.subtext, 0.3) },
              ]}
              placeholder="รหัส 6 หลักจากอีเมล"
              placeholderTextColor={colors.subtext}
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>

          <View style={[styles.inputWrapper]}>
            <View style={[styles.iconContainer, { backgroundColor: hexToRgbA(colors.primary, 0.1) }]}>
              <Ionicons name="lock-closed" size={20} color={colors.primary} />
            </View>
            <TextInput
              style={[
                styles.input,
                { color: colors.text, borderColor: hexToRgbA(colors.subtext, 0.3) },
              ]}
              placeholder="รหัสผ่านใหม่"
              placeholderTextColor={colors.subtext}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={22}
                color={colors.subtext}
              />
            </TouchableOpacity>
          </View>

          <View style={[styles.inputWrapper, { marginBottom: 0 }]}>
            <View style={[styles.iconContainer, { backgroundColor: hexToRgbA(colors.primary, 0.1) }]}>
              <Ionicons name="lock-closed" size={20} color={colors.primary} />
            </View>
            <TextInput
              style={[
                styles.input,
                { color: colors.text, borderColor: hexToRgbA(colors.subtext, 0.3) },
              ]}
              placeholder="ยืนยันรหัสผ่านใหม่"
              placeholderTextColor={colors.subtext}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 },
            ]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            <Text style={buttonPrimary()}>
              {loading ? "กำลังบันทึก..." : "ตั้งรหัสผ่านใหม่"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  headerSection: { marginBottom: 30 },
  backButton: {
    marginBottom: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  titleLayout: { marginBottom: 8 },
  emailLabel: { marginBottom: 12 },
  codeInput: {
    paddingRight: 16,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  iconContainer: {
    position: "absolute",
    left: 16,
    zIndex: 1,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 16,
    paddingLeft: 60,
    paddingRight: 50,
    paddingVertical: 16,
    fontSize: 16,
  },
  eyeButton: {
    position: "absolute",
    right: 14,
    padding: 4,
  },
  button: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
