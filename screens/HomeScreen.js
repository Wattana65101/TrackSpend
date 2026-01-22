import React, { useContext, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { AppContext, expenseCategories, incomeCategories } from "./AppContext";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
// นำเข้าเฉพาะ BarChart
import { BarChart } from "react-native-chart-kit";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { colors, totalBalance, transactions, username, hexToRgbA } =
    useContext(AppContext);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get("window").width;
  const [timeRange, setTimeRange] = useState("month"); // "week" or "month"
  // ลบ chartType state ออก เพราะเหลือแค่ Bar Chart อย่างเดียว

  // ✅ datasets สรุปรายสัปดาห์
  const weeklyData = useMemo(() => {
    if (!transactions) {
      return {
        labels: [],
        datasets: [
          { data: [], color: () => colors?.income },
          { data: [], color: () => colors?.expense },
        ],
      };
    }
    const days = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
    const incomeTotals = new Array(7).fill(0);
    const expenseTotals = new Array(7).fill(0);

    transactions.forEach((t) => {
      if (t.date) {
        const day = new Date(t.date).getDay();
        const amt = parseFloat(t.amount);
        if (!isNaN(amt)) {
          if (t.type === "income") {
            incomeTotals[day] += amt;
          } else if (t.type === "expense") {
            expenseTotals[day] += amt;
          }
        }
      }
    });

    return {
      labels: days,
      datasets: [
        { data: incomeTotals, color: () => colors?.income },
        { data: expenseTotals, color: () => colors?.expense },
      ],
    };
  }, [transactions, colors]);

  // ✅ datasets สรุปรายเดือน (12 เดือนย้อนหลัง)
  const monthlyData = useMemo(() => {
    if (!transactions) {
      return {
        labels: [],
        datasets: [
          { data: [], color: () => colors?.income },
          { data: [], color: () => colors?.expense },
        ],
      };
    }

    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const now = new Date();
    const nowMonth = now.getMonth();
    const nowYear = now.getFullYear();
    const incomeTotals = new Array(12).fill(0);
    const expenseTotals = new Array(12).fill(0);

    // เก็บข้อมูลตามเดือนในปี (0 = ม.ค., 1 = ก.พ., ..., 11 = ธ.ค.)
    // รวมข้อมูลของ 12 เดือนล่าสุด แต่จัดกลุ่มตามเดือนในปี
    transactions.forEach((t) => {
      if (t.date) {
        const tDate = new Date(t.date);
        const tMonth = tDate.getMonth();
        const tYear = tDate.getFullYear();
        
        // คำนวณจำนวนเดือนที่ผ่านมา (0-11)
        let monthsAgo = (nowYear - tYear) * 12 + (nowMonth - tMonth);
        
        // ใช้ข้อมูล 12 เดือนล่าสุดเท่านั้น
        if (monthsAgo >= 0 && monthsAgo < 12) {
          // เก็บข้อมูลตามเดือนในปี (0 = ม.ค., 1 = ก.พ., ..., 11 = ธ.ค.)
          const monthIndex = tMonth; // 0-11 ตามเดือนในปี
          const amt = parseFloat(t.amount);
          if (!isNaN(amt)) {
            if (t.type === "income") {
              incomeTotals[monthIndex] += amt;
            } else if (t.type === "expense") {
              expenseTotals[monthIndex] += amt;
            }
          }
        }
      }
    });

    // สร้าง labels เรียงตามลำดับเดือนในปี (ม.ค. ถึง ธ.ค.)
    const labels = months; // ["ม.ค.", "ก.พ.", "มี.ค.", ..., "ธ.ค."]

    return {
      labels: labels,
      datasets: [
        { data: incomeTotals, color: () => colors?.income },
        { data: expenseTotals, color: () => colors?.expense },
      ],
    };
  }, [transactions, colors]);

  // เลือกข้อมูลตาม timeRange
  const chartData = timeRange === "month" ? monthlyData : weeklyData;

  const recentTransactionsWithIcons = useMemo(() => {
    if (!transactions) return [];
    const allCategories = [...expenseCategories, ...incomeCategories];
    return transactions.slice(0, 5).map((t) => {
      const categoryInfo = allCategories.find((cat) => cat.name === t.category);
      return {
        ...t,
        icon: categoryInfo?.icon || "help-circle-outline",
      };
    });
  }, [transactions]);

  // คำนวณรายรับ-รายจ่ายเดือนนี้
  const monthlyStats = useMemo(() => {
    if (!transactions) return { income: 0, expense: 0 };
    const now = new Date();
    const thisMonth = transactions.filter((t) => {
      if (!t.date) return false;
      const tDate = new Date(t.date);
      return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
    });

    const income = thisMonth
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const expense = thisMonth
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    return { income, expense };
  }, [transactions]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors?.background }]}
      contentContainerStyle={{ 
        paddingTop: insets.top + 10,
        paddingBottom: insets.bottom + 80, // เพิ่ม padding ด้านล่างเพื่อไม่ให้ถูกบังโดย tab bar
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View>
          <Text style={[styles.greeting, { color: colors?.subtext }]}>
            สวัสดี
          </Text>
          <Text style={[styles.username, { color: colors?.text }]}>
            {username || "ผู้ใช้"}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: hexToRgbA(colors?.primary, 0.1) }]}
          onPress={() => navigation.navigate("Settings")}
        >
          <Ionicons name="settings-outline" size={24} color={colors?.primary} />
        </TouchableOpacity>
      </View>

      {/* Balance Card - Modern Design */}
      <View style={[styles.balanceCard, { 
        backgroundColor: colors?.primary,
        shadowColor: colors?.primary,
      }]}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceLabel}>ยอดเงินคงเหลือ</Text>
          <Ionicons name="wallet" size={24} color="#FFFFFF" />
        </View>
        <Text style={styles.balanceAmount}>
          ฿{Number(totalBalance || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
        
        {/* Monthly Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="arrow-down-circle" size={20} color="#FFFFFF" style={{ opacity: 0.9 }} />
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>รายรับเดือนนี้</Text>
              <Text style={styles.statValue}>
                ฿{monthlyStats.income.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="arrow-up-circle" size={20} color="#FFFFFF" style={{ opacity: 0.9 }} />
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>รายจ่ายเดือนนี้</Text>
              <Text style={styles.statValue}>
                ฿{monthlyStats.expense.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors?.incomeLight || colors?.income }]}
            onPress={() => navigation.navigate("AddTransaction", { type: "income" })}
            activeOpacity={0.8}
          >
            <View style={styles.actionButtonIcon}>
              <Ionicons name="add-circle" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionButtonText}>รายรับ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors?.expenseLight || colors?.expense }]}
            onPress={() => navigation.navigate("AddTransaction", { type: "expense" })}
            activeOpacity={0.8}
          >
            <View style={styles.actionButtonIcon}>
              <Ionicons name="remove-circle" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionButtonText}>รายจ่าย</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Stats Cards */}
      <View style={styles.quickStatsContainer}>
        <View style={[styles.quickStatCard, { 
          backgroundColor: hexToRgbA(colors?.income, 0.1),
          borderColor: hexToRgbA(colors?.income, 0.3),
        }]}>
          <View style={[styles.quickStatIcon, { backgroundColor: hexToRgbA(colors?.income, 0.2) }]}>
            <Ionicons name="trending-up" size={24} color={colors?.income} />
          </View>
          <View style={styles.quickStatContent}>
            <Text style={[styles.quickStatLabel, { color: colors?.subtext }]}>รายรับรวม</Text>
            <Text style={[styles.quickStatValue, { color: colors?.income }]}>
              ฿{transactions
                ?.filter((t) => t.type === "income")
                .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
                .toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || "0"}
            </Text>
          </View>
        </View>
        <View style={[styles.quickStatCard, { 
          backgroundColor: hexToRgbA(colors?.expense, 0.1),
          borderColor: hexToRgbA(colors?.expense, 0.3),
        }]}>
          <View style={[styles.quickStatIcon, { backgroundColor: hexToRgbA(colors?.expense, 0.2) }]}>
            <Ionicons name="trending-down" size={24} color={colors?.expense} />
          </View>
          <View style={styles.quickStatContent}>
            <Text style={[styles.quickStatLabel, { color: colors?.subtext }]}>รายจ่ายรวม</Text>
            <Text style={[styles.quickStatValue, { color: colors?.expense }]}>
              ฿{transactions
                ?.filter((t) => t.type === "expense")
                .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
                .toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || "0"}
            </Text>
          </View>
        </View>
      </View>

      {/* Chart Card */}
      <View style={[styles.card, { 
        backgroundColor: colors?.card,
        shadowColor: colors?.text,
      }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.cardIcon, { backgroundColor: hexToRgbA(colors?.primary, 0.1) }]}>
              <Ionicons name="stats-chart" size={20} color={colors?.primary} />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors?.text }]}>
                กราฟสรุป{timeRange === "month" ? "รายเดือน" : "รายสัปดาห์"}
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors?.subtext }]}>
                {timeRange === "month" ? "12 เดือนล่าสุด" : "7 วันล่าสุด"}
              </Text>
            </View>
          </View>
          
          {/* Chart Controls - เหลือแค่ Time Range Selector */}
          <View style={styles.chartControls}>
            <View style={[styles.timeRangeSelector, { backgroundColor: hexToRgbA(colors?.subtext, 0.1) }]}>
              <TouchableOpacity
                style={[
                  styles.timeRangeButton,
                  timeRange === "week" && {
                    backgroundColor: colors?.primary,
                  },
                ]}
                onPress={() => setTimeRange("week")}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.timeRangeText,
                    {
                      color: timeRange === "week" ? "#FFFFFF" : colors?.subtext,
                      fontWeight: timeRange === "week" ? "600" : "400",
                    },
                  ]}
                >
                  สัปดาห์
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.timeRangeButton,
                  timeRange === "month" && {
                    backgroundColor: colors?.primary,
                  },
                ]}
                onPress={() => setTimeRange("month")}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.timeRangeText,
                    {
                      color: timeRange === "month" ? "#FFFFFF" : colors?.subtext,
                      fontWeight: timeRange === "month" ? "600" : "400",
                    },
                  ]}
                >
                  เดือน
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Chart with Legend */}
        {chartData.labels.length > 0 && (
          <>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors?.income }]} />
                <Text style={[styles.legendText, { color: colors?.subtext }]}>รายรับ</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors?.expense }]} />
                <Text style={[styles.legendText, { color: colors?.subtext }]}>รายจ่าย</Text>
              </View>
            </View>
            {/* Summary Stats */}
            <View style={[styles.chartSummary, { backgroundColor: hexToRgbA(colors?.subtext, 0.05) }]}>
              <View style={styles.chartSummaryItem}>
                <View style={[styles.chartSummaryDot, { backgroundColor: colors?.income }]} />
                <View style={styles.chartSummaryContent}>
                  <Text style={[styles.chartSummaryLabel, { color: colors?.subtext }]}>รายรับรวม</Text>
                  <Text style={[styles.chartSummaryValue, { color: colors?.income }]}>
                    ฿{chartData.datasets[0]?.data.reduce((a, b) => a + b, 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || "0"}
                  </Text>
                </View>
              </View>
              <View style={styles.chartSummaryItem}>
                <View style={[styles.chartSummaryDot, { backgroundColor: colors?.expense }]} />
                <View style={styles.chartSummaryContent}>
                  <Text style={[styles.chartSummaryLabel, { color: colors?.subtext }]}>รายจ่ายรวม</Text>
                  <Text style={[styles.chartSummaryValue, { color: colors?.expense }]}>
                    ฿{chartData.datasets[1]?.data.reduce((a, b) => a + b, 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || "0"}
                  </Text>
                </View>
              </View>
            </View>
            
            {/* แสดง BarChart พร้อม horizontal scroll */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              contentContainerStyle={{ paddingRight: 20 }}
              style={{ marginTop: 10 }}
            >
              <BarChart
                data={{
                  labels: chartData.labels,
                  datasets: [
                    {
                      data: chartData.datasets[0]?.data || [],
                    },
                  ],
                }}
                width={Math.max(screenWidth - 80, chartData.labels.length * 70)}
                height={200}
                chartConfig={{
                  backgroundColor: colors?.card,
                  backgroundGradientFrom: colors?.card,
                  backgroundGradientTo: colors?.card,
                  decimalPlaces: 0,
                  color: (opacity = 1) => colors?.income || "#10B981",
                  labelColor: (opacity = 1) => colors?.subtext,
                  propsForBackgroundLines: {
                    strokeDasharray: "",
                    stroke: hexToRgbA(colors?.subtext, 0.15),
                    strokeWidth: 1,
                  },
                  propsForVerticalLabels: {
                    fontSize: 11,
                  },
                  propsForHorizontalLabels: {
                    fontSize: 11,
                  },
                }}
                style={{ borderRadius: 16 }}
                withInnerLines={true}
                withOuterLines={false}
                withVerticalLabels={true}
                withHorizontalLabels={true}
                segments={4}
                formatYLabel={(value) => {
                  const num = parseFloat(value);
                  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
                  return num.toString();
                }}
                showValuesOnTopOfBars={false}
              />
            </ScrollView>
          </>
        )}
        {chartData.labels.length === 0 && (
          <View style={styles.emptyChart}>
            <Ionicons name="bar-chart-outline" size={48} color={colors?.subtext} style={{ opacity: 0.3 }} />
            <Text style={[styles.emptyChartText, { color: colors?.subtext }]}>
              ยังไม่มีข้อมูล
            </Text>
            <Text style={[styles.emptyChartSubText, { color: colors?.subtext }]}>
              เพิ่มรายการเพื่อดูกราฟ
            </Text>
          </View>
        )}
      </View>

      {/* Recent Transactions Card */}
      <View style={[styles.card, { 
        backgroundColor: colors?.card,
        shadowColor: colors?.text,
      }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.cardIcon, { backgroundColor: hexToRgbA(colors?.primary, 0.1) }]}>
              <Ionicons name="time-outline" size={20} color={colors?.primary} />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors?.text }]}>
                รายการล่าสุด
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors?.subtext }]}>
                {recentTransactionsWithIcons.length} รายการ
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate("Transactions")}
            activeOpacity={0.7}
          >
            <Text style={[styles.seeAllText, { color: colors?.primary }]}>
              ดูทั้งหมด
            </Text>
          </TouchableOpacity>
        </View>

        {recentTransactionsWithIcons.length > 0 ? (
          <View style={styles.transactionsList}>
            {recentTransactionsWithIcons.map((t, index) => (
              <TouchableOpacity
                key={t._id || index}
                onPress={() => navigation.navigate("Transactions")}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.transactionItem,
                    {
                      backgroundColor: hexToRgbA(
                        t.type === "income" ? colors?.income : colors?.expense,
                        0.05
                      ),
                      borderLeftColor:
                        t.type === "income" ? colors?.income : colors?.expense,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.transactionIconContainer,
                      {
                        backgroundColor: hexToRgbA(
                          t.type === "income" ? colors?.income : colors?.expense,
                          0.15
                        ),
                      },
                    ]}
                  >
                    <Ionicons
                      name={t.icon}
                      size={22}
                      color={
                        t.type === "income" ? colors?.income : colors?.expense
                      }
                    />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text
                      style={[styles.transactionCategory, { color: colors?.text }]}
                    >
                      {t.category}
                    </Text>
                    <View style={styles.transactionMeta}>
                      <Text
                        style={[styles.transactionDate, { color: colors?.subtext }]}
                      >
                        {t.date ? new Date(t.date).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                        }) : ""}
                      </Text>
                      {t.note && (
                        <>
                          <Text style={[styles.transactionMetaDot, { color: colors?.subtext }]}> • </Text>
                          <Text
                            style={[styles.transactionNote, { color: colors?.subtext }]}
                            numberOfLines={1}
                          >
                            {t.note}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.transactionAmount,
                      {
                        color:
                          t.type === "income" ? colors?.income : colors?.expense,
                      },
                    ]}
                  >
                    {t.type === "income" ? "+" : "-"}฿
                    {Number(t.amount || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={colors?.subtext} style={{ opacity: 0.5 }} />
            <Text style={[styles.emptyText, { color: colors?.subtext }]}>
              ยังไม่มีรายการ
            </Text>
            <Text style={[styles.emptySubText, { color: colors?.subtext }]}>
              เพิ่มรายการแรกของคุณเลย!
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 4,
  },
  username: {
    fontSize: 24,
    fontWeight: "700",
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  balanceCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 24,
    padding: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  balanceLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    opacity: 0.9,
    fontWeight: "500",
  },
  balanceAmount: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "800",
    marginBottom: 20,
    letterSpacing: -1,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  statContent: {
    marginLeft: 12,
  },
  statLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 4,
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 16,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  quickStatsContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quickStatCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickStatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  quickStatContent: {
    flex: 1,
  },
  quickStatLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  chartControls: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  // chartTypeSelector Styles ลบออกหรือปล่อยไว้ก็ได้เพราะไม่ได้ใช้แล้ว
  timeRangeSelector: {
    flexDirection: "row",
    gap: 3,
    borderRadius: 10,
    padding: 3,
  },
  timeRangeButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timeRangeText: {
    fontSize: 12,
    fontWeight: "400",
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
  },
  emptyChart: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyChartText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
  },
  emptyChartSubText: {
    fontSize: 13,
    marginTop: 8,
    opacity: 0.7,
  },
  chartSummary: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 12,
  },
  chartSummaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chartSummaryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  chartSummaryContent: {
    alignItems: "flex-start",
  },
  chartSummaryLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  chartSummaryValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
  },
  transactionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionMetaDot: {
    fontSize: 12,
  },
  transactionNote: {
    fontSize: 12,
    flex: 1,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 13,
    marginTop: 4,
    opacity: 0.7,
  },
});