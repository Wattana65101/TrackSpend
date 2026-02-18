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
import { headingPage, subtitle, buttonPrimary } from "../config/styles";

export default function ForgotPasswordScreen({ navigation }) {
  const { colors, BASE_URL, hexToRgbA } = useContext(AppContext);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!email || !email.trim()) {
      Alert.alert("❌ ล้มเหลว", "กรุณากรอกอีเมล");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        Alert.alert("✅ ส่งรหัสสำเร็จ", data.message || "เราได้ส่งรหัส 6 หลักไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบอีเมล");
        navigation.replace("ResetPassword", { email: email.trim(), devCode: data.devCode });
      } else {
        Alert.alert("❌ ล้มเหลว", data.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
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
        {/* Header Section */}
        <View style={styles.headerSection}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[headingPage(colors), styles.titleLayout]}>ลืมรหัสผ่าน</Text>
          <Text style={subtitle(colors)}>กรอกอีเมลเพื่อรับรหัส 6 หลักยืนยันตัวตนทางอีเมล</Text>
        </View>

        {/* Input Card */}
        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.text }]}>
          <View style={styles.inputWrapper}>
            <View style={[styles.iconContainer, { backgroundColor: hexToRgbA(colors.primary, 0.1) }]}>
              <Ionicons name="mail" size={20} color={colors.primary} />
            </View>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: hexToRgbA(colors.subtext, 0.3),
                },
              ]}
              placeholder="อีเมล"
              placeholderTextColor={colors.subtext}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: colors.primary,
                opacity: loading ? 0.7 : 1,
              },
            ]}
            onPress={handleForgotPassword}
            disabled={loading}
          >
            <Text style={buttonPrimary()}>
              {loading ? "กำลังส่ง..." : "ส่งรหัสยืนยัน"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  headerSection: {
    marginBottom: 30,
  },
  backButton: {
    marginBottom: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  titleLayout: {
    marginBottom: 8,
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
    paddingRight: 16,
    paddingVertical: 16,
    fontSize: 16,
  },
  button: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});

