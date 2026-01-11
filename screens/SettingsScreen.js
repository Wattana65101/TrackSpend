import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { AppContext } from "./AppContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";

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
    await AsyncStorage.removeItem("token");
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

      {/* เปลี่ยนธีม */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.label, { color: colors.text }]}>ธีม</Text>
        <View style={styles.themeContainer}>
          {[
            { id: "emerald", icon: "leaf-outline", label: "Emerald", color: "#059669" },
            { id: "ocean", icon: "water-outline", label: "Ocean", color: "#0EA5E9" },
            { id: "purple", icon: "color-palette-outline", label: "Purple", color: "#8B5CF6" },
            { id: "sunset", icon: "sunny-outline", label: "Sunset", color: "#F97316" },
            { id: "forest", icon: "tree-outline", label: "Forest", color: "#16A34A" },
            { id: "dark", icon: "moon-outline", label: "Dark", color: "#10B981" },
          ].map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.themeButton,
                {
                  backgroundColor: theme === item.id ? item.color : colors.backgroundLight || colors.background,
                  borderColor: theme === item.id ? item.color : colors.subtext,
                  borderWidth: 2,
                },
              ]}
              onPress={() => handleThemeChange(item.id)}
            >
              <Ionicons 
                name={item.icon} 
                size={24} 
                color={theme === item.id ? "#FFFFFF" : item.color} 
              />
              <Text style={[
                styles.themeText, 
                { color: theme === item.id ? "#FFFFFF" : colors.text }
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
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
  themeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 12,
  },
  themeButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    width: "30%",
    minWidth: 100,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  themeText: { 
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
  },
  logoutButton: {
    marginTop: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontWeight: "bold" },
});
