import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { AppContext } from "./AppContext";

export default function BudgetEditScreen({ route, navigation }) {
  const { budget } = route.params;
  const { colors, token, BASE_URL, fetchTransactionsAndBudgets } =
    useContext(AppContext);

  const [amount, setAmount] = useState(String(budget.limit || 0));

  const handleSave = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/budgets/${budget.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ limit: Number(amount) }), // ✅ ใช้ limit แทน amount
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert("✅ สำเร็จ", "อัปเดตงบประมาณเรียบร้อยแล้ว");
        fetchTransactionsAndBudgets();
        navigation.goBack();
      } else {
        Alert.alert("❌ ล้มเหลว", data.message || "ไม่สามารถแก้ไขงบประมาณได้");
      }
    } catch (err) {
      console.error("Error updating budget:", err);
      Alert.alert("Error", "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        แก้ไขงบประมาณ: {budget.category}
      </Text>
      <TextInput
        style={[
          styles.input,
          { borderColor: colors.border, color: colors.text },
        ]}
        placeholder="จำนวนเงิน"
        placeholderTextColor={colors.subtext}
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleSave}
      >
        <Text style={styles.buttonText}>บันทึก</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  button: { borderRadius: 8, padding: 15, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
