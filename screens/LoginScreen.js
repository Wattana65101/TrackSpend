import React, { useState, useContext, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";
import { AppContext } from "./AppContext";
import AppLogo from "../components/AppLogo";

const { width, height } = Dimensions.get("window");

export default function LoginScreen({ navigation }) {
  const { setToken, colors, BASE_URL, setUsername, hexToRgbA } = useContext(AppContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("❌ ล้มเหลว", "กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      // ตรวจสอบ content-type ก่อน parse JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        Alert.alert("❌ ข้อผิดพลาด", "ได้รับ response ที่ไม่ถูกต้องจากเซิร์ฟเวอร์");
        return;
      }

      const data = await response.json();

      if (response.ok && data.success && data.token) {
        await AsyncStorage.setItem("token", data.token);
        setToken(data.token);

        if (data.username) {
          setUsername(data.username);
          await AsyncStorage.setItem("username", data.username);
        }

        Alert.alert("✅ สำเร็จ", data.message || "เข้าสู่ระบบเรียบร้อยแล้ว!");
      } else {
        Alert.alert("❌ ล้มเหลว", data.message || "กรุณาลองใหม่อีกครั้ง");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  // Emerald green color for top section
  const emeraldGreen = "#059669"; // emerald-600
  const emeraldDark = "#047857"; // emerald-700

  return (
    <View style={styles.container}>
      {/* Top Section - Emerald Green (42%) */}
      <View style={[styles.topSection, { backgroundColor: emeraldGreen }]}>
        {/* Gradient Overlay */}
        <View style={styles.gradientOverlay} />
        
        {/* Logo Section - Centered */}
        <View style={styles.logoSection}>
          <AppLogo size="large" />
        </View>

        {/* Header Content */}
        <View style={styles.headerContent}>
          <Text style={styles.appTitle}>MoneyGrow</Text>
          <Text style={styles.appSubtitle}>จัดการเงินให้งอกเงย</Text>
        </View>

        {/* Decorative Trending Icon - Bottom Right */}
        <View style={styles.decorativeIcon}>
          <View style={styles.trendingIconContainer}>
            <Ionicons name="trending-up" size={24} color="#92400E" />
          </View>
        </View>
      </View>

      {/* Bottom Section - White (60%) */}
      <View style={styles.bottomSection}>
        <Animated.View
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
            <View style={[styles.inputContainer, {
              borderColor: emailFocused ? emeraldGreen : "transparent",
              backgroundColor: emailFocused ? "#FFFFFF" : "#F1F5F9",
            }]}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#94A3B8"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <View style={[styles.inputContainer, {
              borderColor: passwordFocused ? emeraldGreen : "transparent",
              backgroundColor: passwordFocused ? "#FFFFFF" : "#F1F5F9",
            }]}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#94A3B8"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              {
                backgroundColor: emeraldGreen,
                opacity: loading ? 0.7 : 1,
              },
            ]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.loginButtonContent}>
                <Ionicons name="reload" size={24} color="#fff" />
              </View>
            ) : (
              <View style={styles.loginButtonContent}>
                <Text style={styles.loginButtonText}>LOGIN</Text>
                <Ionicons name="arrow-forward" size={22} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          {/* Create Account Link */}
          <View style={styles.registerLinkContainer}>
            <TouchableOpacity
              onPress={() => navigation.navigate("Register")}
              activeOpacity={0.7}
            >
              <Text style={styles.createAccountText}>CREATE ACCOUNT</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    height: "42%",
    position: "relative",
    overflow: "hidden",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.2,
    backgroundColor: "#FFFFFF",
    borderRadius: 200,
    transform: [{ scale: 2 }],
    top: -100,
    left: -100,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  headerContent: {
    alignItems: "center",
    zIndex: 10,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "500",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  decorativeIcon: {
    position: "absolute",
    bottom: -16,
    right: 32,
    zIndex: 30,
  },
  trendingIconContainer: {
    backgroundColor: "#FBBF24",
    padding: 12,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    transform: [{ rotate: "12deg" }],
  },
  bottomSection: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -40,
    paddingTop: 48,
    paddingHorizontal: 32,
    shadowOffset: { width: 0, height: -20 },
    shadowOpacity: 0.1,
    shadowRadius: 50,
    elevation: 10,
  },
  formContainer: {
    flex: 1,
    paddingTop: 0,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#94A3B8",
    marginLeft: 16,
    marginBottom: 8,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 20,
    height: 56,
    backgroundColor: "#F1F5F9",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    padding: 0,
    color: "#1E293B",
  },
  eyeIcon: {
    padding: 4,
  },
  loginButton: {
    borderRadius: 22,
    paddingVertical: 20,
    marginTop: "auto",
    marginBottom: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  loginButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 18,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  registerLinkContainer: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 20,
  },
  createAccountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
});
