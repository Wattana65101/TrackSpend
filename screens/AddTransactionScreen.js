import React, { useState, useContext, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
  ScrollView,
  Alert,
  Dimensions,
} from "react-native";
import { AppContext, expenseCategories, incomeCategories } from "./AppContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const CategoryItem = ({ category, isSelected, onPress, colors, hexToRgbA }) => (
  <TouchableOpacity
    style={[
      styles.categoryItem,
      {
        backgroundColor: isSelected
          ? hexToRgbA(colors.primary, 0.1)
          : "#FFFFFF",
        borderColor: isSelected ? colors.primary : "#F3F4F6",
        borderLeftWidth: isSelected ? 4 : 0,
      },
    ]}
    onPress={() => onPress(category)}
    activeOpacity={0.6}
  >
    <View
      style={[
        styles.categoryIconContainer,
        {
          backgroundColor: isSelected
            ? colors.primary
            : hexToRgbA(colors.primary, 0.1),
        },
      ]}
    >
      <Ionicons
        name={category.icon}
        size={20}
        color={isSelected ? "#FFFFFF" : colors.primary}
      />
    </View>
    <Text
      style={[
        styles.categoryText,
        {
          color: isSelected ? colors.primary : colors.text,
          fontWeight: isSelected ? "600" : "500",
        },
      ]}
    >
      {category.name}
    </Text>
    {isSelected && (
      <Ionicons
        name="checkmark-circle"
        size={20}
        color={colors.primary}
      />
    )}
  </TouchableOpacity>
);

export default function AddTransactionScreen() {
  const {
    colors,
    token,
    fetchTransactionsAndBudgets,
    BASE_URL,
    hexToRgbA,
  } = useContext(AppContext);
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const [type, setType] = useState(route.params?.type || "expense");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [note, setNote] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const amountInputRef = useRef(null);
  const previousCategoryRef = useRef(null);

  const categories = type === "expense" ? expenseCategories : incomeCategories;

  useEffect(() => {
    if (route.params?.type) {
      setType(route.params.type);
      setSelectedCategory(null);
      setAmount("");
      setNote("");
    }
  }, [route.params?.type]);

  // Auto focus amount input when category is selected
  useEffect(() => {
    if (selectedCategory) {
      // Reset amount when selecting a different category
      const categoryName = selectedCategory.name;
      if (previousCategoryRef.current !== categoryName) {
        setAmount("");
        previousCategoryRef.current = categoryName;
      }
      if (amountInputRef.current) {
        const timer = setTimeout(() => {
          amountInputRef.current?.focus();
        }, 400);
        return () => clearTimeout(timer);
      }
    } else {
      previousCategoryRef.current = null;
    }
  }, [selectedCategory]);

  const handleSave = async () => {
    if (!selectedCategory) {
      setModalMessage("กรุณาเลือกหมวดหมู่");
      setModalVisible(true);
      return;
    }

    const transactionAmount = parseFloat(amount);
    if (isNaN(transactionAmount) || transactionAmount <= 0) {
      setModalMessage("กรุณาใส่จำนวนเงินที่ถูกต้อง");
      setModalVisible(true);
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: transactionAmount,
          type,
          category: selectedCategory.name,
          note,
          date: new Date().toISOString().split("T")[0],
        }),
      });

      if (response.ok) {
        Alert.alert("✅ สำเร็จ", "บันทึกรายการเรียบร้อยแล้ว");
        fetchTransactionsAndBudgets();
        navigation.goBack();
      } else {
        const errorData = await response.json();
        Alert.alert("❌ ข้อผิดพลาด", errorData.message || "ไม่สามารถบันทึกรายการได้");
      }
    } catch (error) {
      console.error("Error saving transaction:", error);
      Alert.alert("❌ ข้อผิดพลาด", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { backgroundColor: hexToRgbA(colors.primary, 0.1) }]}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerText, { color: colors.text }]}>
            {type === "expense" ? "เพิ่มรายจ่าย" : "เพิ่มรายรับ"}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Type Switch */}
          <View
            style={[
              styles.typeSwitch,
              { backgroundColor: colors.card, shadowColor: colors.text },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === "expense" && {
                  backgroundColor: colors.expense,
                },
              ]}
              onPress={() => {
                setType("expense");
                setSelectedCategory(null);
                setAmount("");
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="arrow-up-circle"
                size={20}
                color={type === "expense" ? "#FFFFFF" : colors.expense}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  {
                    color: type === "expense" ? "#FFFFFF" : colors.text,
                    fontWeight: type === "expense" ? "700" : "500",
                  },
                ]}
              >
                รายจ่าย
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === "income" && {
                  backgroundColor: colors.income,
                },
              ]}
              onPress={() => {
                setType("income");
                setSelectedCategory(null);
                setAmount("");
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="arrow-down-circle"
                size={20}
                color={type === "income" ? "#FFFFFF" : colors.income}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  {
                    color: type === "income" ? "#FFFFFF" : colors.text,
                    fontWeight: type === "income" ? "700" : "500",
                  },
                ]}
              >
                รายรับ
              </Text>
            </TouchableOpacity>
          </View>

          {/* Category Selection - ต้องเลือกก่อน */}
          <View
            style={[
              styles.categorySection,
              { backgroundColor: colors.card, shadowColor: colors.text },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              เลือกหมวดหมู่
            </Text>
            {!selectedCategory ? (
              <View style={styles.categoryList}>
                {categories.map((category) => (
                  <CategoryItem
                    key={category.name}
                    category={category}
                    isSelected={selectedCategory?.name === category.name}
                    onPress={(cat) => {
                      // Reset amount if selecting a different category
                      if (selectedCategory?.name !== cat.name) {
                        setAmount("");
                      }
                      setSelectedCategory(cat);
                    }}
                    colors={colors}
                    hexToRgbA={hexToRgbA}
                  />
                ))}
              </View>
            ) : (
              <View>
                <TouchableOpacity
                  style={[
                    styles.selectedCategoryCard,
                    {
                      backgroundColor: hexToRgbA(colors.primary, 0.1),
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => {
                    setSelectedCategory(null);
                    setAmount("");
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.selectedCategoryIcon,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Ionicons
                      name={selectedCategory.icon}
                      size={20}
                      color="#FFFFFF"
                    />
                  </View>
                  <Text
                    style={[styles.selectedCategoryText, { color: colors.primary }]}
                  >
                    {selectedCategory.name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedCategory(null);
                      setAmount("");
                    }}
                    style={styles.changeCategoryButton}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.subtext} />
                  </TouchableOpacity>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedCategory(null);
                    setAmount("");
                  }}
                  style={styles.changeCategoryLink}
                >
                  <Text style={[styles.changeCategoryText, { color: colors.primary }]}>
                    เปลี่ยนหมวดหมู่
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Amount Input - แสดงเมื่อเลือกหมวดหมู่แล้ว */}
          {selectedCategory && (
            <View
              style={[
                styles.amountSection,
                { backgroundColor: colors.card, shadowColor: colors.text },
              ]}
            >
              <Text style={[styles.amountLabel, { color: colors.subtext }]}>
                จำนวนเงิน
              </Text>
              <View style={styles.amountInputContainer}>
                <Text style={[styles.currencySymbol, { color: colors.text }]}>
                  ฿
                </Text>
                <TextInput
                  ref={amountInputRef}
                  style={[styles.amountInput, { color: colors.text }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.subtext}
                  value={amount}
                  onChangeText={(text) => {
                    // Allow only numbers and one decimal point
                    const cleaned = text.replace(/[^0-9.]/g, "");
                    const parts = cleaned.split(".");
                    if (parts.length > 2) return;
                    if (parts[1] && parts[1].length > 2) return;
                    setAmount(cleaned);
                  }}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  editable={true}
                  showSoftInputOnFocus={true}
                />
              </View>
            </View>
          )}

          {/* Note Input */}
          <View
            style={[
              styles.noteSection,
              { backgroundColor: colors.card, shadowColor: colors.text },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              หมายเหตุ (ไม่บังคับ)
            </Text>
            <TextInput
              style={[
                styles.noteInput,
                {
                  backgroundColor: colors.backgroundLight || colors.background,
                  color: colors.text,
                  borderColor: hexToRgbA(colors.primary, 0.2),
                },
              ]}
              placeholder="เพิ่มหมายเหตุ..."
              placeholderTextColor={colors.subtext}
              value={note}
              onChangeText={setNote}
              maxLength={50}
              multiline
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              {
                backgroundColor: selectedCategory ? colors.primary : colors.subtext,
                shadowColor: colors.primary,
                opacity: selectedCategory ? 1 : 0.5,
              },
            ]}
            onPress={handleSave}
            disabled={!selectedCategory}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>บันทึก</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Modal แจ้งเตือน */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalView,
                {
                  backgroundColor: colors.card,
                  shadowColor: colors.text,
                },
              ]}
            >
              <View
                style={[
                  styles.modalIconContainer,
                  { backgroundColor: hexToRgbA(colors.expense, 0.1) },
                ]}
              >
                <Ionicons name="alert-circle" size={32} color={colors.expense} />
              </View>
              <Text style={[styles.modalText, { color: colors.text }]}>
                {modalMessage}
              </Text>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonText}>ตกลง</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  typeSwitch: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  typeButtonText: {
    fontSize: 16,
  },
  amountSection: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  amountLabel: {
    fontSize: 14,
    marginBottom: 10,
    fontWeight: "500",
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 10,
    paddingTop: 6,
    minHeight: 50,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: "700",
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: "700",
    padding: 0,
    minHeight: 42,
  },
  categorySection: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  categoryList: {
    gap: 8,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  categoryText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  selectedCategoryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    gap: 12,
    marginBottom: 10,
  },
  selectedCategoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedCategoryText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  changeCategoryButton: {
    padding: 4,
  },
  changeCategoryLink: {
    alignSelf: "flex-end",
    padding: 8,
  },
  changeCategoryText: {
    fontSize: 14,
    fontWeight: "600",
  },
  noteSection: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  noteInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 2,
    minHeight: 80,
    textAlignVertical: "top",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
    marginTop: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "85%",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    fontWeight: "500",
  },
  modalButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
