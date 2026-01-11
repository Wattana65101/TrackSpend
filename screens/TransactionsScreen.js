import React, { useContext, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { AppContext, expenseCategories, incomeCategories } from "./AppContext";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TransactionsScreen() {
  const { transactions, deleteTransaction, colors, hexToRgbA } = useContext(AppContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const insets = useSafeAreaInsets();

  const confirmDelete = (id) => {
    setTransactionToDelete(id);
    setModalVisible(true);
  };

  const handleDelete = () => {
    if (transactionToDelete) {
      deleteTransaction(transactionToDelete);
      setModalVisible(false);
      setTransactionToDelete(null);
    }
  };

  const renderItem = ({ item }) => {
    const allCategories = [...expenseCategories, ...incomeCategories];
    const categoryInfo = allCategories.find((cat) => cat.name === item.category);
    const iconColor = item.type === "income" ? colors?.income : colors?.expense;
    const bgColor = item.type === "income" 
      ? hexToRgbA(colors?.income, 0.08) 
      : hexToRgbA(colors?.expense, 0.08);

    const amount = parseFloat(item.amount);
    const safeAmount = isNaN(amount) ? 0 : amount;

    return (
      <TouchableOpacity 
        onPress={() => confirmDelete(item.id)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.transactionItem,
            {
              backgroundColor: colors?.card,
              borderLeftColor: iconColor,
              shadowColor: colors?.text,
            },
          ]}
        >
          {/* Icon */}
          <View
            style={[
              styles.transactionIconContainer,
              { backgroundColor: hexToRgbA(iconColor, 0.15) },
            ]}
          >
            <Ionicons
              name={categoryInfo?.icon || "help-circle-outline"}
              size={24}
              color={iconColor}
            />
          </View>

          {/* รายละเอียด */}
          <View style={styles.transactionDetails}>
            <Text style={[styles.transactionCategory, { color: colors?.text }]}>
              {item.category || "ไม่ระบุหมวดหมู่"}
            </Text>
            <Text style={[styles.transactionNote, { color: colors?.subtext }]}>
              {item.note || "ไม่มีหมายเหตุ"}
            </Text>
            {item.date && (
              <Text style={[styles.transactionDate, { color: colors?.subtextLight || colors?.subtext }]}>
                {new Date(item.date).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            )}
          </View>

          {/* จำนวนเงิน */}
          <View style={styles.amountContainer}>
            <Text
              style={[
                styles.transactionAmount,
                { color: iconColor },
              ]}
            >
              {item.type === "income" ? "+" : "-"}฿
              {safeAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors?.subtext}
              style={{ opacity: 0.5 }}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors?.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors?.text }]}>
            รายการทั้งหมด
          </Text>
          <Text style={[styles.subtitle, { color: colors?.subtext }]}>
            {transactions?.length || 0} รายการ
          </Text>
        </View>
      </View>

      {transactions && transactions.length > 0 ? (
        <FlatList
          data={transactions}
          keyExtractor={(item, index) =>
            item && item.id ? String(item.id) : `txn-${index}`
          }
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="document-text-outline"
            size={64}
            color={colors?.subtext}
            style={{ opacity: 0.3 }}
          />
          <Text style={[styles.emptyText, { color: colors?.subtext }]}>
            ยังไม่มีรายการ
          </Text>
          <Text style={[styles.emptySubText, { color: colors?.subtext }]}>
            เพิ่มรายการแรกของคุณเลย!
          </Text>
        </View>
      )}

      {/* Modal ยืนยันการลบ */}
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
                backgroundColor: colors?.card,
                shadowColor: colors?.text,
              },
            ]}
          >
            <View style={[styles.modalIconContainer, { backgroundColor: hexToRgbA(colors?.expense, 0.1) }]}>
              <Ionicons name="trash" size={32} color={colors?.expense} />
            </View>
            <Text style={[styles.modalTitle, { color: colors?.text }]}>
              ยืนยันการลบ
            </Text>
            <Text style={[styles.modalText, { color: colors?.subtext }]}>
              คุณต้องการลบรายการนี้ใช่ไหม?
            </Text>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonCancel,
                  { backgroundColor: colors?.backgroundLight || colors?.background },
                ]}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, { color: colors?.text }]}>
                  ยกเลิก
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonDelete,
                  { backgroundColor: colors?.expense },
                ]}
                onPress={handleDelete}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonTextDelete}>ลบ</Text>
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 18,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  transactionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  transactionNote: {
    fontSize: 14,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
  },
  emptySubText: {
    fontSize: 14,
    marginTop: 8,
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
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  modalText: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtonRow: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonCancel: {
    borderWidth: 1.5,
  },
  modalButtonDelete: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalButtonTextDelete: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
