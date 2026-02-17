import React, { useContext, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Dimensions,
  Animated,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { AppContext } from "./AppContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const GAP = 10;
const ROW_PAD = 20 + 16;
const SWATCH_SIZE = (width - ROW_PAD * 2 - GAP * 5) / 6;

function ThemeSwatch({ item, selected, onPress, colors }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkOpacity = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: selected ? 1.08 : 1,
        useNativeDriver: true,
        tension: 200,
        friction: 12,
      }),
      Animated.timing(checkOpacity, {
        toValue: selected ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [selected]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: selected ? 1.08 : 1,
      useNativeDriver: true,
      tension: 200,
      friction: 12,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      style={styles.themeSwatchWrap}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.themeSwatch,
          {
            backgroundColor: item.color,
            borderColor: selected ? "#FFFFFF" : "transparent",
            borderWidth: selected ? 2.5 : 0,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View style={[styles.checkWrap, { opacity: checkOpacity }]} pointerEvents="none">
          <Ionicons name="checkmark" size={SWATCH_SIZE * 0.45} color="#FFFFFF" />
        </Animated.View>
      </Animated.View>
      <Text style={[styles.themeName, { color: colors.subtext }]} numberOfLines={1}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { username, setUsername, theme, setTheme, colors, setToken } =
    useContext(AppContext);

  const [newNickname, setNewNickname] = useState(username || "");

  const handleSave = () => {
    if (!newNickname.trim()) {
      Alert.alert("ผิดพลาด", "กรุณากรอกชื่อเล่น");
      return;
    }
    setUsername(newNickname);
    Alert.alert("สำเร็จ", "บันทึกชื่อเล่นเรียบร้อยแล้ว");
  };

  const handleThemeChange = (selectedTheme) => {
    setTheme(selectedTheme);
  };

  const handleLogout = async () => {
    try {
      await GoogleSignin.signOut(); // ล้าง session Google เพื่อให้ login ใหม่ได้ idToken ใหม่
    } catch (_) {}
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("username");
    setToken(null); // ✅ กลับไป LoginScreen
    Alert.alert("ออกจากระบบแล้ว");
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Text style={[styles.title, { color: colors.text }]}>การตั้งค่า</Text>

      {/* ตั้งชื่อเล่น */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.label, { color: colors.text }]}>ชื่อเล่น</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.background, color: colors.text },
          ]}
          placeholder="กรอกชื่อเล่น"
          placeholderTextColor={colors.subtext}
          value={newNickname}
          onChangeText={setNewNickname}
        />
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleSave}
        >
          <Text style={styles.buttonText}>บันทึก</Text>
        </TouchableOpacity>
      </View>

      {/* Choose Your Look */}
      <View style={[styles.themeSection, { backgroundColor: colors.card }]}>
        <View style={styles.themeHeader}>
          <Text style={[styles.themeTitle, { color: colors.text }]}>เลือกธีมที่คุณชอบ</Text>
          <Text style={[styles.themeCount, { color: colors.subtext }]}></Text>
        </View>
        <View style={styles.themeRow}>
          {[
            { id: "emerald", label: "Emerald", color: "#059669" },
            { id: "ocean", label: "Ocean", color: "#0EA5E9" },
            { id: "purple", label: "Purple", color: "#8B5CF6" },
            { id: "sunset", label: "Sunset", color: "#F97316" },
            { id: "forest", label: "Forest", color: "#16A34A" },
            { id: "dark", label: "Dark", color: "#1F2937" },
          ].map((item) => (
            <ThemeSwatch
              key={item.id}
              item={item}
              selected={theme === item.id}
              onPress={() => handleThemeChange(item.id)}
              colors={colors}
            />
          ))}
        </View>
      </View>

      {/* ปุ่มออกจากระบบ */}
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: "#FF3B30" }]}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>ออกจากระบบ</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  card: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
  },
  label: { fontSize: 16, marginBottom: 10, fontWeight: "bold" },
  input: {
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 10,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  themeSection: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  themeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 14,
  },
  themeTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  themeCount: {
    fontSize: 12,
  },
  themeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  themeSwatchWrap: {
    alignItems: "center",
    width: SWATCH_SIZE,
  },
  themeSwatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkWrap: {
    position: "absolute",
  },
  themeName: {
    fontSize: 11,
    marginTop: 6,
  },
  logoutButton: {
    marginTop: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontWeight: "bold" },
});
