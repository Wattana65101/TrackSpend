import React, { useContext, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native";
import { AppContext, expenseCategories } from "./AppContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LineChart, PieChart } from "react-native-chart-kit";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function ReportsScreen() {
  const { transactions, colors, hexToRgbA } = useContext(AppContext);
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get("window").width;

  const expenseData = useMemo(() => {
    if (!transactions) return [];

    return expenseCategories
      .map((cat, index) => {
        const total = transactions
          .filter((t) => t.type === "expense" && t.category === cat.name)
          .reduce((sum, t) => {
            const amt = parseFloat(t.amount);
            return !isNaN(amt) ? sum + amt : sum;
          }, 0);

        return {
          name: cat.name,
          amount: total,
          color: colors?.expenseLight || colors?.expense,
          legendFontColor: colors?.text,
          legendFontSize: 12,
        };
      })
      .filter((item) => item.amount > 0);
  }, [transactions, colors]);

  const incomeData = useMemo(() => {
    if (!transactions) return [];

    const incomeCategoriesLocal = [
      { name: "เงินเดือน", icon: "cash" },
      { name: "โบนัส", icon: "gift" },
      { name: "การลงทุน", icon: "trending-up" },
      { name: "งานเสริม", icon: "briefcase" },
      { name: "อื่น ๆ", icon: "ellipsis-horizontal" },
    ];

    return incomeCategoriesLocal
      .map((cat, index) => {
        const total = transactions
          .filter((t) => t.type === "income" && t.category === cat.name)
          .reduce((sum, t) => {
            const amt = parseFloat(t.amount);
            return !isNaN(amt) ? sum + amt : sum;
          }, 0);

        return {
          name: cat.name,
          amount: total,
          color: colors?.incomeLight || colors?.income,
          legendFontColor: colors?.text,
          legendFontSize: 12,
        };
      })
      .filter((item) => item.amount > 0);
  }, [transactions, colors]);

  const weeklyIncomeData = useMemo(() => {
    if (!transactions)
      return { labels: [], datasets: [{ data: [] }] };

    const days = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
    const incomeTotals = new Array(7).fill(0);

    transactions
      .filter((t) => t.type === "income" && t.date)
      .forEach((t) => {
        const amt = parseFloat(t.amount);
        if (!isNaN(amt)) {
          const day = new Date(t.date).getDay();
          incomeTotals[day] += amt;
        }
      });

    return {
      labels: days,
      datasets: [
        {
          data: incomeTotals,
          color: () => colors.income,
          strokeWidth: 3,
        },
      ],
    };
  }, [transactions, colors]);

  const weeklyExpenseData = useMemo(() => {
    if (!transactions)
      return { labels: [], datasets: [{ data: [] }] };

    const days = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
    const expenseTotals = new Array(7).fill(0);

    transactions
      .filter((t) => t.type === "expense" && t.date)
      .forEach((t) => {
        const amt = parseFloat(t.amount);
        if (!isNaN(amt)) {
          const day = new Date(t.date).getDay();
          expenseTotals[day] += amt;
        }
      });

    return {
      labels: days,
      datasets: [
        {
          data: expenseTotals,
          color: () => colors.expense,
          strokeWidth: 3,
        },
      ],
    };
  }, [transactions, colors]);

  const totalIncome = useMemo(() => {
    if (!transactions) return 0;
    return transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  }, [transactions]);

  const totalExpense = useMemo(() => {
    if (!transactions) return 0;
    return transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  }, [transactions]);

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: colors?.background, paddingTop: insets.top + 10 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors?.text }]}>รายงาน</Text>
          <Text style={[styles.subtitle, { color: colors?.subtext }]}>
            สรุปการเงินของคุณ
          </Text>
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: hexToRgbA(colors?.income, 0.1),
              borderColor: hexToRgbA(colors?.income, 0.3),
            },
          ]}
        >
          <View
            style={[
              styles.summaryIcon,
              { backgroundColor: hexToRgbA(colors?.income, 0.2) },
            ]}
          >
            <Ionicons name="arrow-down-circle" size={24} color={colors?.income} />
          </View>
          <Text style={[styles.summaryLabel, { color: colors?.subtext }]}>
            รายรับรวม
          </Text>
          <Text style={[styles.summaryValue, { color: colors?.income }]}>
            ฿{totalIncome.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>

        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: hexToRgbA(colors?.expense, 0.1),
              borderColor: hexToRgbA(colors?.expense, 0.3),
            },
          ]}
        >
          <View
            style={[
              styles.summaryIcon,
              { backgroundColor: hexToRgbA(colors?.expense, 0.2) },
            ]}
          >
            <Ionicons name="arrow-up-circle" size={24} color={colors?.expense} />
          </View>
          <Text style={[styles.summaryLabel, { color: colors?.subtext }]}>
            รายจ่ายรวม
          </Text>
          <Text style={[styles.summaryValue, { color: colors?.expense }]}>
            ฿{totalExpense.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>
      </View>

      {/* รายรับรายสัปดาห์ */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors?.card,
            shadowColor: colors?.text,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.cardIcon,
              { backgroundColor: hexToRgbA(colors?.income, 0.15) },
            ]}
          >
            <Ionicons name="trending-up" size={20} color={colors?.income} />
          </View>
          <Text style={[styles.sectionTitle, { color: colors?.text }]}>
            รายรับรายสัปดาห์
          </Text>
        </View>
        {weeklyIncomeData.datasets[0].data.some((val) => val > 0) ? (
          <LineChart
            data={weeklyIncomeData}
            width={screenWidth - 80}
            height={200}
            chartConfig={{
              backgroundColor: colors?.card,
              backgroundGradientFrom: colors?.card,
              backgroundGradientTo: colors?.card,
              decimalPlaces: 0,
              color: () => colors?.income,
              labelColor: () => colors?.subtext,
              strokeWidth: 3,
              propsForBackgroundLines: {
                strokeDasharray: "",
                stroke: hexToRgbA(colors?.subtext, 0.2),
              },
            }}
            bezier
            style={{ borderRadius: 16, marginTop: 10 }}
          />
        ) : (
          <View style={styles.emptyChart}>
            <Ionicons
              name="bar-chart-outline"
              size={48}
              color={colors?.subtext}
              style={{ opacity: 0.3 }}
            />
            <Text style={[styles.emptyChartText, { color: colors?.subtext }]}>
              ยังไม่มีข้อมูลรายรับ
            </Text>
          </View>
        )}
      </View>

      {/* รายจ่ายรายสัปดาห์ */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors?.card,
            shadowColor: colors?.text,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.cardIcon,
              { backgroundColor: hexToRgbA(colors?.expense, 0.15) },
            ]}
          >
            <Ionicons name="trending-down" size={20} color={colors?.expense} />
          </View>
          <Text style={[styles.sectionTitle, { color: colors?.text }]}>
            รายจ่ายรายสัปดาห์
          </Text>
        </View>
        {weeklyExpenseData.datasets[0].data.some((val) => val > 0) ? (
          <LineChart
            data={weeklyExpenseData}
            width={screenWidth - 80}
            height={200}
            chartConfig={{
              backgroundColor: colors?.card,
              backgroundGradientFrom: colors?.card,
              backgroundGradientTo: colors?.card,
              decimalPlaces: 0,
              color: () => colors?.expense,
              labelColor: () => colors?.subtext,
              strokeWidth: 3,
              propsForBackgroundLines: {
                strokeDasharray: "",
                stroke: hexToRgbA(colors?.subtext, 0.2),
              },
            }}
            bezier
            style={{ borderRadius: 16, marginTop: 10 }}
          />
        ) : (
          <View style={styles.emptyChart}>
            <Ionicons
              name="bar-chart-outline"
              size={48}
              color={colors?.subtext}
              style={{ opacity: 0.3 }}
            />
            <Text style={[styles.emptyChartText, { color: colors?.subtext }]}>
              ยังไม่มีข้อมูลรายจ่าย
            </Text>
          </View>
        )}
      </View>

      {/* Pie Chart รายจ่ายตามหมวดหมู่ */}
      {expenseData.length > 0 && (
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors?.card,
              shadowColor: colors?.text,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.cardIcon,
                { backgroundColor: hexToRgbA(colors?.primary, 0.15) },
              ]}
            >
              <Ionicons name="pie-chart" size={20} color={colors?.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors?.text }]}>
              รายจ่ายตามหมวดหมู่
            </Text>
          </View>
          <PieChart
            data={expenseData.map((item) => ({
              name: item.name,
              population: !isNaN(item.amount) ? item.amount : 0,
              color: item.color,
              legendFontColor: item.legendFontColor,
              legendFontSize: item.legendFontSize,
            }))}
            width={screenWidth - 80}
            height={220}
            chartConfig={{
              backgroundColor: colors?.card,
              backgroundGradientFrom: colors?.card,
              backgroundGradientTo: colors?.card,
              color: () => colors?.text,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
          <View style={styles.legendContainer}>
            {expenseData.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendColor,
                    { backgroundColor: item.color },
                  ]}
                />
                <Text style={[styles.legendText, { color: colors?.text }]}>
                  {item.name}: ฿
                  {(!isNaN(item.amount) ? item.amount : 0).toLocaleString(
                    undefined,
                    { minimumFractionDigits: 2 }
                  )}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
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
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 13,
    marginBottom: 8,
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptyChart: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyChartText: {
    fontSize: 14,
    marginTop: 12,
  },
  legendContainer: {
    marginTop: 16,
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
