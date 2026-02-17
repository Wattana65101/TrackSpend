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
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { AppContext } from "./AppContext";
import AppLogo from "../components/AppLogo";

const { width } = Dimensions.get("window");

export default function RegisterScreen({ navigation }) {
  const { colors, BASE_URL, hexToRgbA, setToken, setUsername, setIsNewUser, setHasSeenOnboarding } = useContext(AppContext);
  const [usernameInput, setUsernameInput] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [googlePending, setGooglePending] = useState(null);
  const [googleFormUsername, setGoogleFormUsername] = useState("");
  const [googleFormPhone, setGoogleFormPhone] = useState("");

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // No background animations - static elements only

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // No animations - static background
  }, []);

  // Progress animation based on filled fields
  useEffect(() => {
    const filledFields = [usernameInput, phone, email, password, confirmPassword].filter(
      (field) => field.length > 0
    ).length;
    const progress = filledFields / 5;

    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [usernameInput, phone, email, password, confirmPassword]);

  // Email validation function
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    if (!usernameInput || !phone || !email || !password || !confirmPassword) {
      Alert.alert("❌ ล้มเหลว", "กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    // Validate phone number - must be exactly 10 digits
    const phoneDigits = phone.replace(/\D/g, ""); // ลบตัวอักษรที่ไม่ใช่ตัวเลข
    if (phoneDigits.length !== 10) {
      Alert.alert("❌ ล้มเหลว", `เบอร์โทรศัพท์ต้องเป็น 10 ตัวเลข\nปัจจุบัน: ${phoneDigits.length} ตัว`);
      return;
    }

    // Validate email format
    if (!isValidEmail(email)) {
      Alert.alert("❌ ล้มเหลว", "กรุณากรอกอีเมลให้ถูกต้อง\nตัวอย่าง: yourname@example.com");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("❌ ล้มเหลว", "รหัสผ่านไม่ตรงกัน");
      return;
    }

    if (password.length < 6) {
      Alert.alert("❌ ล้มเหลว", "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setLoading(true);
    try {
      // ใช้ phoneDigits ที่ลบตัวอักษรที่ไม่ใช่ตัวเลขแล้ว
      const phoneDigits = phone.replace(/\D/g, "");
      const requestData = {
        username: usernameInput,
        phone: phoneDigits, // ส่งเฉพาะตัวเลข
        email,
        password,
      };
      
      console.log("📤 Sending register request to:", `${BASE_URL}/api/register`);
      console.log("📤 Request data:", { ...requestData, password: "***" }); // ไม่ log password แบบเต็ม
      
      const response = await fetch(`${BASE_URL}/api/register`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(requestData),
      }).catch((fetchError) => {
        console.error("🔥 Fetch error:", fetchError);
        Alert.alert("❌ ข้อผิดพลาด", `ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้\n${fetchError.message}`);
        setLoading(false);
        throw fetchError;
      });

      console.log("📥 Response status:", response.status);
      console.log("📥 Response headers:", response.headers);

      // ตรวจสอบ content-type ก่อน parse JSON
      const contentType = response.headers.get("content-type");
      let data;
      
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("❌ Response is not JSON:", text);
        Alert.alert("❌ ข้อผิดพลาด", `เซิร์ฟเวอร์ส่ง response กลับมาไม่ถูกต้อง\nStatus: ${response.status}\nResponse: ${text.substring(0, 100)}`);
        return;
      }

      const text = await response.text();
      console.log("📥 Response text:", text);
      
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("❌ JSON parse error:", parseError, "Response text:", text);
        Alert.alert("❌ ข้อผิดพลาด", "ไม่สามารถแปลงข้อมูลจากเซิร์ฟเวอร์ได้");
        return;
      }

      console.log("📥 Response data:", data);

      if (response.ok && data.success) {
        Alert.alert("✅ สำเร็จ", data.message || "สมัครสมาชิกเรียบร้อยแล้ว!", [
          {
            text: "เข้าสู่ระบบ",
            onPress: () => navigation.replace("Login"),
          },
        ]);
      } else {
        Alert.alert("❌ ล้มเหลว", data.message || "สมัครไม่สำเร็จ");
      }
    } catch (error) {
      console.error("🔥 Register error:", error);
      console.error("🔥 Error message:", error.message);
      console.error("🔥 Error stack:", error.stack);
      
      // ตรวจสอบประเภท error
      if (error.message && error.message.includes("Network request failed")) {
        Alert.alert(
          "❌ เชื่อมต่อเซิร์ฟเวอร์ไม่ได้", 
          "กรุณาตรวจสอบ:\n1. เซิร์ฟเวอร์รันอยู่หรือไม่ (npm run server)\n2. MySQL container รันอยู่หรือไม่\n3. พอร์ตและ URL ถูกต้องหรือไม่"
        );
      } else if (error.message && error.message.includes("timeout")) {
        Alert.alert("❌ หมดเวลา", "การเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง");
      } else {
        Alert.alert("❌ ข้อผิดพลาด", `เกิดข้อผิดพลาด: ${error.message || "ไม่ทราบสาเหตุ"}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // สมัคร/เข้าสู่ระบบด้วย Google (ส่ง idToken ไปเซิร์ฟเวอร์ → สร้างหรือหาบัญชี → บันทึกลง DB)
  const handleGoogleRegister = async () => {
    setLoading(true);
    try {
      try { await GoogleSignin.signOut(); } catch (_) {}
      await GoogleSignin.hasPlayServices();
      const signInResult = await GoogleSignin.signIn();
      if (signInResult?.type !== "success" || !signInResult?.data) {
        setLoading(false);
        return;
      }
      const { idToken } = await GoogleSignin.getTokens();
      if (!idToken) {
        Alert.alert("❌ ล้มเหลว", "ไม่สามารถดึงข้อมูลจาก Google ได้");
        setLoading(false);
        return;
      }
      const response = await fetch(`${BASE_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        Alert.alert("❌ ข้อผิดพลาด", "ได้รับ response ที่ไม่ถูกต้องจากเซิร์ฟเวอร์");
        setLoading(false);
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
        if (data.isNewUser === true) {
          setIsNewUser(true);
          setHasSeenOnboarding(false);
          await AsyncStorage.setItem("hasSeenOnboarding", "false");
        }
        Alert.alert("✅ สำเร็จ", data.message || "สมัคร/เข้าสู่ระบบด้วย Google เรียบร้อย!", [
          { text: "ตกลง" },
        ]);
      } else if (data.needMoreInfo && data.email && data.name) {
        setGooglePending({ idToken, email: data.email, name: data.name });
        setGoogleFormUsername(data.name);
        setGoogleFormPhone("");
      } else {
        Alert.alert("❌ ล้มเหลว", data.message || "ไม่สามารถสมัครด้วย Google ได้");
      }
    } catch (error) {
      console.error("Google register error:", error);
      Alert.alert("Error", "เกิดข้อผิดพลาดในการสมัครด้วย Google");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteGoogleRegister = async () => {
    const phoneDigits = (googleFormPhone || "").replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      Alert.alert("❌ ล้มเหลว", "กรุณากรอกเบอร์โทรศัพท์ 10 ตัวเลข");
      return;
    }
    if (!googlePending) return;
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: googlePending.idToken,
          phone: phoneDigits,
          username: (googleFormUsername || "").trim() || googlePending.name,
        }),
      });
      const data = await response.json();
      if (response.ok && data.success && data.token) {
        setGooglePending(null);
        await AsyncStorage.setItem("token", data.token);
        setToken(data.token);
        if (data.username) {
          setUsername(data.username);
          await AsyncStorage.setItem("username", data.username);
        }
        if (data.isNewUser === true) {
          setIsNewUser(true);
          setHasSeenOnboarding(false);
          await AsyncStorage.setItem("hasSeenOnboarding", "false");
        }
        Alert.alert("✅ สำเร็จ", data.message || "สมัครสมาชิกเรียบร้อยแล้ว!", [
          { text: "ตกลง" },
        ]);
      } else {
        Alert.alert("❌ ล้มเหลว", data.message || "ไม่สามารถสมัครได้");
      }
    } catch (error) {
      Alert.alert("Error", "เกิดข้อผิดพลาดในการสมัคร");
    } finally {
      setLoading(false);
    }
  };

  const getFieldIcon = (fieldName) => {
    const icons = {
      username: "person",
      phone: "call",
      email: "mail",
      password: "lock-closed",
      confirmPassword: "lock-closed",
    };
    return icons[fieldName] || "ellipse";
  };

  const isFieldFocused = (fieldName) => focusedField === fieldName;
  const isFieldFilled = (value) => value.length > 0;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  // No animations - static elements

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
        {/* Modern Gradient Background Design */}
        <View style={styles.decorativeContainer}>
          {/* Main Gradient Layer */}
          <View style={[styles.mainGradient, { 
            backgroundColor: colors.background,
          }]} />
          
          {/* Top Gradient Accent */}
          <View style={[styles.topGradient, { 
            backgroundColor: hexToRgbA(colors.primary, 0.15),
          }]} />
          
          {/* Bottom Gradient Accent */}
          <View style={[styles.bottomGradient, { 
            backgroundColor: hexToRgbA(colors.income, 0.12),
          }]} />

          {/* Decorative Circles - Top Section */}
          <View style={[styles.decorativeCircle1, { 
            backgroundColor: hexToRgbA(colors.primary, 0.1),
            borderColor: hexToRgbA(colors.primary, 0.2),
          }]} />
          <View style={[styles.decorativeCircle2, { 
            backgroundColor: hexToRgbA(colors.income, 0.08),
            borderColor: hexToRgbA(colors.income, 0.15),
          }]} />

          {/* Decorative Circles - Middle Section */}
          <View style={[styles.decorativeCircle3, { 
            backgroundColor: hexToRgbA(colors.primary, 0.06),
          }]} />
          <View style={[styles.decorativeCircle4, { 
            backgroundColor: hexToRgbA(colors.income, 0.07),
          }]} />
          <View style={[styles.decorativeCircle5, { 
            backgroundColor: hexToRgbA(colors.primary, 0.05),
          }]} />

          {/* Bottom Icon Section - Modern Layout */}
          <View style={[styles.bottomIconSection, {
            backgroundColor: hexToRgbA(colors.primary, 0.08),
          }]}>
            <View style={[styles.iconWrapper1, {
              backgroundColor: hexToRgbA(colors.primary, 0.15),
            }]}>
              <Ionicons name="wallet-outline" size={42} color={hexToRgbA(colors.primary, 0.7)} />
            </View>
            <View style={[styles.iconWrapper2, {
              backgroundColor: hexToRgbA(colors.income, 0.12),
            }]}>
              <Ionicons name="cash-outline" size={38} color={hexToRgbA(colors.income, 0.7)} />
            </View>
          </View>

          {/* Subtle Pattern Overlay */}
          <View style={[styles.patternOverlay, {
            backgroundColor: hexToRgbA(colors.primary, 0.03),
          }]} />
        </View>

        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          {/* Header Section */}
          <View style={styles.logoContainer}>
            <AppLogo size="medium" />
            <Text style={[styles.welcomeText, { color: colors.text }]}>สร้างบัญชีใหม่</Text>
            <Text style={[styles.subtitleText, { color: colors.subtext }]}>
              กรอกข้อมูลเพื่อเริ่มต้นการจัดการการเงิน
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressContainer, { backgroundColor: hexToRgbA(colors.subtext, 0.2) }]}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressWidth,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>

          {/* Input Card */}
          <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.text }]}>
            {/* Username Input */}
            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: isFieldFocused("username")
                      ? hexToRgbA(colors.primary, 0.1)
                      : "transparent",
                  },
                ]}
              >
                <Ionicons
                  name={isFieldFocused("username") || isFieldFilled(usernameInput) ? "person" : "person-outline"}
                  size={20}
                  color={isFieldFocused("username") || isFieldFilled(usernameInput) ? colors.primary : colors.subtext}
                />
              </View>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: isFieldFocused("username")
                      ? colors.primary
                      : hexToRgbA(colors.subtext, 0.3),
                    backgroundColor: isFieldFocused("username")
                      ? hexToRgbA(colors.primary, 0.05)
                      : "transparent",
                  },
                ]}
                placeholder="ชื่อผู้ใช้"
                placeholderTextColor={colors.subtext}
                value={usernameInput}
                onChangeText={setUsernameInput}
                onFocus={() => setFocusedField("username")}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="words"
              />
            </View>

            {/* Phone Input */}
            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: isFieldFocused("phone")
                      ? hexToRgbA(colors.primary, 0.1)
                      : "transparent",
                  },
                ]}
              >
                <Ionicons
                  name={isFieldFocused("phone") || isFieldFilled(phone) ? "call" : "call-outline"}
                  size={20}
                  color={isFieldFocused("phone") || isFieldFilled(phone) ? colors.primary : colors.subtext}
                />
              </View>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: isFieldFocused("phone")
                      ? colors.primary
                      : hexToRgbA(colors.subtext, 0.3),
                    backgroundColor: isFieldFocused("phone")
                      ? hexToRgbA(colors.primary, 0.05)
                      : "transparent",
                  },
                ]}
                placeholder="เบอร์โทรศัพท์"
                placeholderTextColor={colors.subtext}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(text) => {
                  // รับเฉพาะตัวเลข และจำกัด 10 ตัว
                  const digitsOnly = text.replace(/\D/g, "");
                  if (digitsOnly.length <= 10) {
                    setPhone(digitsOnly);
                  }
                }}
                maxLength={10}
                onFocus={() => setFocusedField("phone")}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: isFieldFocused("email")
                      ? hexToRgbA(colors.primary, 0.1)
                      : "transparent",
                  },
                ]}
              >
                <Ionicons
                  name={isFieldFocused("email") || isFieldFilled(email) ? "mail" : "mail-outline"}
                  size={20}
                  color={isFieldFocused("email") || isFieldFilled(email) ? colors.primary : colors.subtext}
                />
              </View>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: isFieldFocused("email")
                      ? colors.primary
                      : email.length > 0 && !isValidEmail(email)
                      ? colors.expense
                      : hexToRgbA(colors.subtext, 0.3),
                    backgroundColor: isFieldFocused("email")
                      ? hexToRgbA(colors.primary, 0.05)
                      : "transparent",
                  },
                ]}
                placeholder="อีเมล (บังคับ)"
                placeholderTextColor={colors.subtext}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {email.length > 0 && isValidEmail(email) && (
                <View style={styles.validationIcon}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.income} />
                </View>
              )}
              {email.length > 0 && !isValidEmail(email) && (
                <View style={styles.validationIcon}>
                  <Ionicons name="close-circle" size={20} color={colors.expense} />
                </View>
              )}
            </View>
            {/* Email Validation Message */}
            {email.length > 0 && !isValidEmail(email) && (
              <View style={styles.validationMessage}>
                <Text style={[styles.validationText, { color: colors.expense }]}>
                  กรุณากรอกอีเมลให้ถูกต้อง (ตัวอย่าง: yourname@example.com)
                </Text>
              </View>
            )}

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: isFieldFocused("password")
                      ? hexToRgbA(colors.primary, 0.1)
                      : "transparent",
                  },
                ]}
              >
                <Ionicons
                  name={isFieldFocused("password") || isFieldFilled(password) ? "lock-closed" : "lock-closed-outline"}
                  size={20}
                  color={isFieldFocused("password") || isFieldFilled(password) ? colors.primary : colors.subtext}
                />
              </View>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: isFieldFocused("password")
                      ? colors.primary
                      : hexToRgbA(colors.subtext, 0.3),
                    backgroundColor: isFieldFocused("password")
                      ? hexToRgbA(colors.primary, 0.05)
                      : "transparent",
                  },
                ]}
                placeholder="รหัสผ่าน"
                placeholderTextColor={colors.subtext}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.subtext}
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: isFieldFocused("confirmPassword")
                      ? hexToRgbA(colors.primary, 0.1)
                      : "transparent",
                  },
                ]}
              >
                <Ionicons
                  name={isFieldFocused("confirmPassword") || isFieldFilled(confirmPassword) ? "lock-closed" : "lock-closed-outline"}
                  size={20}
                  color={isFieldFocused("confirmPassword") || isFieldFilled(confirmPassword) ? colors.primary : colors.subtext}
                />
              </View>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor:
                      isFieldFocused("confirmPassword")
                        ? colors.primary
                        : confirmPassword && password !== confirmPassword
                        ? colors.expense
                        : hexToRgbA(colors.subtext, 0.3),
                    backgroundColor: isFieldFocused("confirmPassword")
                      ? hexToRgbA(colors.primary, 0.05)
                      : "transparent",
                  },
                ]}
                placeholder="ยืนยันรหัสผ่าน"
                placeholderTextColor={colors.subtext}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => setFocusedField("confirmPassword")}
                onBlur={() => setFocusedField(null)}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.subtext}
                />
              </TouchableOpacity>
            </View>

            {/* Password Match Indicator */}
            {confirmPassword.length > 0 && (
              <View style={styles.passwordMatchContainer}>
                <Ionicons
                  name={password === confirmPassword ? "checkmark-circle" : "close-circle"}
                  size={16}
                  color={password === confirmPassword ? colors.income : colors.expense}
                />
                <Text
                  style={[
                    styles.passwordMatchText,
                    {
                      color: password === confirmPassword ? colors.income : colors.expense,
                    },
                  ]}
                >
                  {password === confirmPassword ? "รหัสผ่านตรงกัน" : "รหัสผ่านไม่ตรงกัน"}
                </Text>
              </View>
            )}

            {/* Register Button */}
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: colors.primary,
                  opacity: loading ? 0.7 : 1,
                },
              ]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <Animated.View
                    style={[
                      styles.loadingSpinner,
                      {
                        borderColor: colors.card,
                        borderTopColor: "transparent",
                      },
                    ]}
                  />
                  <Text style={styles.buttonText}>กำลังสมัครสมาชิก...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons name="person-add" size={20} color="#fff" />
                  <Text style={styles.buttonText}>สมัครสมาชิก</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* สมัครด้วย Google */}
            <TouchableOpacity
              style={[
                styles.googleButton,
                { opacity: loading ? 0.7 : 1, borderColor: colors.subtextLight },
              ]}
              onPress={handleGoogleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="logo-google" size={20} color="#1E293B" />
                <Text style={[styles.googleButtonText, { color: colors.text }]}>
                  สมัครด้วย Google
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View style={styles.linkContainer}>
            <Text style={[styles.linkText, { color: colors.subtext }]}>
              มีบัญชีแล้ว?{" "}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")} activeOpacity={0.7}>
              <Text style={[styles.linkTextBold, { color: colors.primary }]}>
                เข้าสู่ระบบ
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Modal กรอกข้อมูลเพิ่มเติมหลัง Google Sign-In (สมัครใหม่) */}
      <Modal
        visible={!!googlePending}
        transparent
        animationType="slide"
        onRequestClose={() => setGooglePending(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>กรอกข้อมูลเพิ่มเติม</Text>
            <Text style={[styles.modalSubtitle, { color: colors.subtext }]}>
              เข้าสู่ระบบด้วย Google แล้ว กรุณากรอกข้อมูลเพื่อสมัครสมาชิก
            </Text>
            {googlePending && (
              <View style={styles.modalField}>
                <Text style={[styles.modalLabel, { color: colors.subtext }]}>อีเมล</Text>
                <Text style={[styles.modalValue, { color: colors.text }]}>{googlePending.email}</Text>
              </View>
            )}
            <View style={styles.modalField}>
              <Text style={[styles.modalLabel, { color: colors.subtext }]}>ชื่อผู้ใช้</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.subtext }]}
                placeholder="ชื่อผู้ใช้"
                placeholderTextColor={colors.subtext}
                value={googleFormUsername}
                onChangeText={setGoogleFormUsername}
              />
            </View>
            <View style={styles.modalField}>
              <Text style={[styles.modalLabel, { color: colors.subtext }]}>เบอร์โทรศัพท์ (บังคับ)</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.subtext }]}
                placeholder="0XXXXXXXXX"
                placeholderTextColor={colors.subtext}
                value={googleFormPhone}
                onChangeText={(t) => { const d = t.replace(/\D/g, ""); if (d.length <= 10) setGoogleFormPhone(d); }}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={handleCompleteGoogleRegister}
              disabled={loading}
            >
              <Text style={styles.modalButtonText}>สมัครสมาชิก</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setGooglePending(null)}
            >
              <Text style={[styles.modalCancelText, { color: colors.subtext }]}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  decorativeContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  mainGradient: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  topGradient: {
    position: "absolute",
    width: "120%",
    height: "40%",
    top: "-10%",
    right: "-10%",
    borderRadius: 200,
    opacity: 0.8,
  },
  bottomGradient: {
    position: "absolute",
    width: "130%",
    height: "35%",
    bottom: "-15%",
    left: "-15%",
    borderRadius: 250,
    opacity: 0.7,
  },
  decorativeCircle1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    top: 80,
    right: -60,
    borderWidth: 2,
    opacity: 0.9,
  },
  decorativeCircle2: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    top: 200,
    left: -40,
    borderWidth: 2,
    opacity: 0.85,
  },
  decorativeCircle3: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    top: 350,
    right: 50,
    opacity: 0.7,
  },
  decorativeCircle4: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    top: 400,
    left: 30,
    opacity: 0.65,
  },
  decorativeCircle5: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    top: 450,
    right: 80,
    opacity: 0.6,
  },
  bottomIconSection: {
    position: "absolute",
    bottom: 100,
    left: "50%",
    transform: [{ translateX: -100 }],
    width: 200,
    height: 80,
    borderRadius: 40,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    paddingHorizontal: 20,
  },
  iconWrapper1: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  iconWrapper2: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    justifyContent: "center",
    alignItems: "center",
  },
  patternOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.5,
  },
  contentContainer: {
    zIndex: 1,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  progressContainer: {
    height: 4,
    borderRadius: 2,
    marginBottom: 24,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
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
  eyeIcon: {
    position: "absolute",
    right: 16,
    padding: 8,
  },
  validationIcon: {
    position: "absolute",
    right: 16,
    padding: 4,
  },
  validationMessage: {
    marginTop: -12,
    marginBottom: 8,
    marginLeft: 60,
  },
  validationText: {
    fontSize: 12,
    fontWeight: "500",
  },
  passwordMatchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -8,
    marginBottom: 8,
    gap: 6,
  },
  passwordMatchText: {
    fontSize: 12,
    fontWeight: "500",
  },
  button: {
    borderRadius: 16,
    paddingVertical: 18,
    marginTop: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 12,
    backgroundColor: "#F1F5F9",
    borderWidth: 2,
  },
  googleButtonText: {
    fontWeight: "800",
    fontSize: 16,
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingSpinner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  linkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  linkText: {
    fontSize: 14,
  },
  linkTextBold: {
    fontSize: 14,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
  },
  modalField: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 12,
    marginBottom: 6,
    fontWeight: "600",
  },
  modalValue: {
    fontSize: 14,
  },
  modalInput: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  modalButton: {
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  modalCancel: {
    marginTop: 12,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 14,
  },
});
