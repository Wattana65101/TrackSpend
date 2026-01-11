import React, { useContext, useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { AppContext, expenseCategories } from "./AppContext";
import Ionicons from "react-native-vector-icons/Ionicons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";

const ProgressBar = ({ progress, colors, hexToRgbA }) => {
  const progressColor =
    progress > 1
      ? colors.expense
      : progress > 0.8
      ? "#FFA500"
      : progress > 0.5
      ? colors.primary
      : colors.income;
  return (
    <View
      style={[
        styles.progressBarContainer,
        { backgroundColor: hexToRgbA(colors.subtext, 0.1) },
      ]}
    >
      <View
        style={[
          styles.progressBar,
          {
            width: `${Math.min(progress, 1) * 100}%`,
            backgroundColor: progressColor,
          },
        ]}
      />
    </View>
  );
};

const BudgetCard = ({ budget, spent, colors, hexToRgbA, onEdit, onDelete }) => {
  const progress = spent / budget.limit;
  const percentage = Math.round(progress * 100);
  const isOverBudget = progress > 1;

  return (
    <View
      style={[
        styles.budgetCard,
        {
          backgroundColor: colors.card,
          borderColor: hexToRgbA(colors.primary, 0.2),
          shadowColor: colors.text,
        },
      ]}
    >
      <View style={styles.budgetHeader}>
        <View style={styles.budgetHeaderLeft}>
          <View
            style={[
              styles.budgetIcon,
              { backgroundColor: hexToRgbA(colors.budgetIcon || colors.primary, 0.15) },
            ]}
          >
            <Ionicons
              name={budget.icon || "pie-chart-outline"}
              size={24}
              color={colors.budgetIcon || colors.primary}
            />
          </View>
          <View style={styles.budgetDetails}>
            <Text style={[styles.budgetCategory, { color: colors.text }]}>
              {budget.category}
            </Text>
            <Text style={[styles.budgetLimit, { color: colors.subtext }]}>
              งบประมาณ: ฿{budget.limit.toLocaleString()}
            </Text>
          </View>
        </View>
        <View style={styles.budgetActions}>
          <TouchableOpacity
            onPress={() => onEdit(budget)}
            style={[styles.actionButton, { backgroundColor: hexToRgbA(colors.primary, 0.1) }]}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(budget.id)}
            style={[styles.actionButton, { backgroundColor: hexToRgbA(colors.expense, 0.1) }]}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color={colors.expense} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.budgetProgress}>
        <View style={styles.budgetProgressHeader}>
          <Text style={[styles.spentText, { color: colors.text }]}>
            ใช้ไปแล้ว:{" "}
            <Text style={{ color: isOverBudget ? colors.expense : colors.primary }}>
              ฿{spent.toLocaleString()}
            </Text>
          </Text>
          <View
            style={[
              styles.percentageBadge,
              {
                backgroundColor: isOverBudget
                  ? hexToRgbA(colors.expense, 0.15)
                  : hexToRgbA(colors.primary, 0.15),
              },
            ]}
          >
            <Text
              style={[
                styles.percentageText,
                {
                  color: isOverBudget ? colors.expense : colors.primary,
                  fontWeight: "700",
                },
              ]}
            >
              {percentage}%
            </Text>
          </View>
        </View>
        <ProgressBar progress={progress} colors={colors} hexToRgbA={hexToRgbA} />
        {isOverBudget && (
          <Text style={[styles.overBudgetText, { color: colors.expense }]}>
            ⚠️ เกินงบประมาณ ฿{(spent - budget.limit).toLocaleString()}
          </Text>
        )}
      </View>
    </View>
  );
};

export default function BudgetScreen() {
  const {
    budgets,
    transactions,
    colors,
    token,
    fetchTransactionsAndBudgets,
    BASE_URL,
    hexToRgbA,
  } = useContext(AppContext);
  const insets = useSafeAreaInsets();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);

  const [editingBudget, setEditingBudget] = useState(null);
  const [editLimit, setEditLimit] = useState("");

  const [newCategory, setNewCategory] = useState(
    expenseCategories[0]?.name || ""
  );
  const [newBudgetLimit, setNewBudgetLimit] = useState("");

  const [loading, setLoading] = useState(false);

  const budgetsWithSpent = useMemo(() => {
    return budgets.map((budget) => {
      const spent = transactions
        .filter(
          (t) => t.type === "expense" && t.category === budget.category
        )
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      return { ...budget, spent };
    });
  }, [budgets, transactions]);

  const handleAddNewBudget = async () => {
    if (
      !newCategory ||
      !newBudgetLimit ||
      isNaN(parseFloat(newBudgetLimit)) ||
      parseFloat(newBudgetLimit) <= 0
    ) {
      Alert.alert("❌ ข้อผิดพลาด", "กรุณาเลือกหมวดหมู่และใส่จำนวนเงินที่ถูกต้อง");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/budgets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: newCategory,
          limit: parseFloat(newBudgetLimit),
        }),
      });

      if (response.ok) {
        await fetchTransactionsAndBudgets();
        setAddModalVisible(false);
        setNewCategory(expenseCategories[0]?.name || "");
        setNewBudgetLimit("");
        Alert.alert("✅ สำเร็จ", "เพิ่มงบประมาณเรียบร้อยแล้ว");
      } else {
        const errorData = await response.json();
        Alert.alert("❌ ข้อผิดพลาด", errorData.message || "ไม่สามารถเพิ่มงบประมาณได้");
      }
    } catch (error) {
      console.error("Error adding new budget:", error);
      Alert.alert("❌ ข้อผิดพลาด", "เกิดปัญหากับการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  const handleEditBudget = async () => {
    if (
      !editingBudget ||
      !editLimit ||
      isNaN(parseFloat(editLimit)) ||
      parseFloat(editLimit) <= 0
    ) {
      Alert.alert("❌ ข้อผิดพลาด", "กรุณาใส่จำนวนเงินที่ถูกต้อง");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/budgets/${editingBudget.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ limit: parseFloat(editLimit) }),
      });

      if (response.ok) {
        await fetchTransactionsAndBudgets();
        setEditModalVisible(false);
        setEditLimit("");
        Alert.alert("✅ สำเร็จ", "แก้ไขงบประมาณเรียบร้อยแล้ว");
      } else {
        const errorData = await response.json();
        Alert.alert("❌ ข้อผิดพลาด", errorData.message || "ไม่สามารถแก้ไขงบประมาณได้");
      }
    } catch (error) {
      console.error("Error editing budget:", error);
      Alert.alert("❌ ข้อผิดพลาด", "เกิดปัญหากับการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBudget = async (id) => {
    Alert.alert("ยืนยันการลบ", "คุณต้องการลบงบประมาณนี้ใช่หรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ลบ",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await fetch(`${BASE_URL}/api/budgets/${id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
              await fetchTransactionsAndBudgets();
              Alert.alert("✅ สำเร็จ", "ลบงบประมาณเรียบร้อยแล้ว");
              setEditModalVisible(false);
            } else {
              const errorText = await response.text();
              console.error("❌ Delete failed:", errorText);
              Alert.alert("❌ ข้อผิดพลาด", "ไม่สามารถลบงบประมาณได้");
            }
          } catch (error) {
            console.error("Error deleting budget:", error);
            Alert.alert("❌ ข้อผิดพลาด", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
          }
        },
      },
    ]);
  };

  const renderBudget = ({ item }) => (
    <BudgetCard
      budget={item}
      spent={item.spent}
      colors={colors}
      hexToRgbA={hexToRgbA}
      onEdit={(budget) => {
        setEditingBudget(budget);
        setEditLimit(String(budget.limit));
        setEditModalVisible(true);
      }}
      onDelete={handleDeleteBudget}
    />
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>งบประมาณ</Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            {budgets.length} งบประมาณ
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setAddModalVisible(true)}
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {budgetsWithSpent.length > 0 ? (
        <FlatList
          data={budgetsWithSpent}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBudget}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: hexToRgbA(colors.primary, 0.1) }]}>
            <Ionicons name="pie-chart-outline" size={64} color={colors.primary} />
          </View>
          <Text style={[styles.emptyText, { color: colors.text }]}>
            ยังไม่มีงบประมาณ
          </Text>
          <Text style={[styles.emptySubText, { color: colors.subtext }]}>
            กดปุ่ม + เพื่อเพิ่มงบประมาณใหม่
          </Text>
        </View>
      )}

      {/* Modal เพิ่มงบประมาณ */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={addModalVisible}
        onRequestClose={() => setAddModalVisible(false)}
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
            <View style={styles.modalHeader}>
              <View style={[styles.modalIcon, { backgroundColor: hexToRgbA(colors.primary, 0.1) }]}>
                <Ionicons name="add-circle" size={32} color={colors.primary} />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                เพิ่มงบประมาณใหม่
              </Text>
            </View>

            <View style={styles.modalContent}>
              <Text style={[styles.modalLabel, { color: colors.text }]}>
                หมวดหมู่
              </Text>
              <View
                style={[
                  styles.pickerContainer,
                  {
                    backgroundColor: colors.backgroundLight || colors.background,
                    borderColor: hexToRgbA(colors.primary, 0.2),
                  },
                ]}
              >
                <Picker
                  selectedValue={newCategory}
                  onValueChange={(itemValue) => setNewCategory(itemValue)}
                  style={{ color: colors.text }}
                >
                  {expenseCategories.map((cat) => (
                    <Picker.Item
                      key={cat.name}
                      label={cat.name}
                      value={cat.name}
                    />
                  ))}
                </Picker>
              </View>

              <Text style={[styles.modalLabel, { color: colors.text }]}>
                จำนวนเงิน
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: colors.backgroundLight || colors.background,
                    color: colors.text,
                    borderColor: hexToRgbA(colors.primary, 0.2),
                  },
                ]}
                placeholder="0.00"
                placeholderTextColor={colors.subtext}
                keyboardType="numeric"
                value={newBudgetLimit}
                onChangeText={setNewBudgetLimit}
              />
            </View>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonCancel,
                  { backgroundColor: colors.backgroundLight || colors.background },
                ]}
                onPress={() => setAddModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  ยกเลิก
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonSave,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleAddNewBudget}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonTextSave}>บันทึก</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal แก้ไขงบประมาณ */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
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
            <View style={styles.modalHeader}>
              <View style={[styles.modalIcon, { backgroundColor: hexToRgbA(colors.primary, 0.1) }]}>
                <Ionicons name="create" size={32} color={colors.primary} />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                แก้ไขงบประมาณ
              </Text>
            </View>

            <View style={styles.modalContent}>
              <Text style={[styles.modalLabel, { color: colors.text }]}>
                จำนวนเงินใหม่
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: colors.backgroundLight || colors.background,
                    color: colors.text,
                    borderColor: hexToRgbA(colors.primary, 0.2),
                  },
                ]}
                placeholder="0.00"
                placeholderTextColor={colors.subtext}
                keyboardType="numeric"
                value={editLimit}
                onChangeText={setEditLimit}
              />
            </View>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonDelete,
                  { backgroundColor: hexToRgbA(colors.expense, 0.1) },
                ]}
                onPress={() => handleDeleteBudget(editingBudget?.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, { color: colors.expense }]}>
                  ลบ
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonCancel,
                  { backgroundColor: colors.backgroundLight || colors.background },
                ]}
                onPress={() => setEditModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  ยกเลิก
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonSave,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleEditBudget}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonTextSave}>บันทึก</Text>
                )}
              </TouchableOpacity>
            </View>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  budgetCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  budgetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  budgetHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  budgetIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  budgetDetails: {
    flex: 1,
  },
  budgetCategory: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  budgetLimit: {
    fontSize: 14,
  },
  budgetActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  budgetProgress: {
    marginTop: 8,
  },
  budgetProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  spentText: {
    fontSize: 16,
    fontWeight: "600",
  },
  percentageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  percentageText: {
    fontSize: 14,
  },
  progressBarContainer: {
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBar: {
    height: "100%",
    borderRadius: 6,
  },
  overBudgetText: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "90%",
    borderRadius: 24,
    padding: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  modalContent: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  pickerContainer: {
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 2,
    overflow: "hidden",
  },
  modalInput: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 2,
    fontWeight: "600",
  },
  modalButtonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  modalButtonCancel: {
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.1)",
  },
  modalButtonDelete: {
    borderWidth: 1.5,
  },
  modalButtonSave: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalButtonTextSave: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
