import React, { useContext, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  PanResponder,
} from "react-native";
import { AppContext, expenseCategories, incomeCategories } from "./AppContext";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
// สัปดาห์ = Area (LineChart + shadow), เดือน = Line (LineChart ไม่มี shadow)
import { LineChart } from "react-native-chart-kit";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { colors, totalBalance, transactions, username, hexToRgbA } =
    useContext(AppContext);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get("window").width;
  const [timeRange, setTimeRange] = useState("month"); // "week" or "month"
  const [chartTooltip, setChartTooltip] = useState(null); // { label, income, expense, x, y, dateLabel } or null
  const CHART_PADDING_LEFT = 45;  // พื้นที่ Y-axis labels
  const CHART_PADDING_RIGHT = 64;

  // สีเส้นกราฟ: รายรับ = เขียว, รายจ่าย = แดง (ตามธีม)
  const chartIncomeLineColor = colors?.chartIncome || colors?.income;
  const chartExpenseLineColor = colors?.chartExpense || colors?.expense;

  // ✅ datasets สรุปรายสัปดาห์ (7 วัน)
  const weeklyData = useMemo(() => {
    if (!transactions) {
      return {
        labels: [],
        datasets: [
          { data: [], color: () => chartIncomeLineColor },
          { data: [], color: () => chartExpenseLineColor },
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
        { data: incomeTotals, color: () => chartIncomeLineColor },
        { data: expenseTotals, color: () => chartExpenseLineColor },
      ],
    };
  }, [transactions, colors]);

  // ✅ datasets สรุปรายเดือน (12 เดือนย้อนหลัง)
  const monthlyData = useMemo(() => {
    if (!transactions) {
      return {
        labels: [],
        datasets: [
          { data: [], color: () => chartIncomeLineColor },
          { data: [], color: () => chartExpenseLineColor },
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
        { data: incomeTotals, color: () => chartIncomeLineColor },
        { data: expenseTotals, color: () => chartExpenseLineColor },
      ],
    };
  }, [transactions, colors]);

  // เลือกข้อมูลตาม timeRange
  const chartData = timeRange === "month" ? monthlyData : weeklyData;

  const chartWidth = timeRange === "week" ? screenWidth - 48 : Math.max(screenWidth - 80, chartData.labels.length * 70);
  const chartHeight = 200;

  const showTooltipAtChartPosition = useCallback(
    (chartX, chartY) => {
      if (!chartData.labels.length) return;
      const dataStartX = CHART_PADDING_LEFT;
      const dataEndX = chartWidth - CHART_PADDING_RIGHT;
      const dataWidth = dataEndX - dataStartX;
      if (dataWidth <= 0) return;
      const clampedX = Math.max(dataStartX, Math.min(dataEndX, chartX));
      const rawIndex = ((clampedX - dataStartX) / dataWidth) * (chartData.labels.length - 1);
      const index = Math.max(0, Math.min(chartData.labels.length - 1, Math.round(rawIndex)));
      const label = chartData.labels[index];
      const income = chartData.datasets[0]?.data[index] ?? 0;
      const expense = chartData.datasets[1]?.data[index] ?? 0;

      let dateLabel = "";
      const now = new Date();
      if (timeRange === "week") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + index);
        const day = d.getDate();
        const month = d.getMonth();
        const year = d.getFullYear() + 543;
        const monthsShort = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
        dateLabel = `${day} ${monthsShort[month]} ${year}`;
      } else {
        const monthIndex = index;
        const yearAd = now.getFullYear() + (monthIndex > now.getMonth() ? -1 : 0);
        const yearBe = yearAd + 543;
        const monthsShort = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
        dateLabel = `${monthsShort[monthIndex]} ${yearBe}`;
      }

      setChartTooltip({ label, income, expense, x: chartX, y: chartY, dateLabel });
    },
    [chartData, chartWidth, timeRange]
  );

  const chartPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          showTooltipAtChartPosition(locationX, locationY);
        },
        onPanResponderMove: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          showTooltipAtChartPosition(locationX, locationY);
        },
        onPanResponderRelease: () => setChartTooltip(null),
        onPanResponderTerminate: () => setChartTooltip(null),
      }),
    [showTooltipAtChartPosition]
  );

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
        paddingBottom: (insets.bottom || 0) + 100, // เพิ่ม padding เพื่อเลื่อนลงล่างสุดได้และไม่ถูกบัง tab bar
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
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
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
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
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
            <Ionicons name="trending-up" size={20} color={colors?.income} />
          </View>
          <View style={styles.quickStatContent}>
            <Text style={[styles.quickStatLabel, { color: colors?.subtext }]} {...(Platform.OS === "android" && { textBreakStrategy: "simple" })}>รายรับรวม</Text>
            <View style={{ flexShrink: 0, minWidth: 0 }}>
              <Text style={[styles.quickStatValue, { color: colors?.income }]} numberOfLines={1} adjustsFontSizeToFit {...(Platform.OS === "android" && { textBreakStrategy: "simple" })}>
              ฿{transactions
                ?.filter((t) => t.type === "income")
                .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
                .toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || "0"}
              </Text>
            </View>
          </View>
        </View>
        <View style={[styles.quickStatCard, { 
          backgroundColor: hexToRgbA(colors?.expense, 0.1),
          borderColor: hexToRgbA(colors?.expense, 0.3),
        }]}>
          <View style={[styles.quickStatIcon, { backgroundColor: hexToRgbA(colors?.expense, 0.2) }]}>
            <Ionicons name="trending-down" size={20} color={colors?.expense} />
          </View>
          <View style={styles.quickStatContent}>
            <Text style={[styles.quickStatLabel, { color: colors?.subtext }]} {...(Platform.OS === "android" && { textBreakStrategy: "simple" })}>รายจ่ายรวม</Text>
            <View style={{ flexShrink: 0, minWidth: 0 }}>
              <Text style={[styles.quickStatValue, { color: colors?.expense }]} numberOfLines={1} adjustsFontSizeToFit {...(Platform.OS === "android" && { textBreakStrategy: "simple" })}>
              ฿{transactions
                ?.filter((t) => t.type === "expense")
                .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
                .toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || "0"}
              </Text>
            </View>
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
              <Ionicons name="stats-chart" size={18} color={colors?.primary} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, { color: colors?.text }]} numberOfLines={1}>
                กราฟสรุป{timeRange === "month" ? "รายเดือน" : "รายสัปดาห์"}
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors?.subtext }]} numberOfLines={1}>
                {timeRange === "month" ? "12 เดือนล่าสุด" : "7 วัน"}
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
                <View style={[styles.legendDot, { backgroundColor: chartIncomeLineColor }]} />
                <Text style={[styles.legendText, { color: colors?.subtext }]} numberOfLines={1}>รายรับ</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: chartExpenseLineColor }]} />
                <Text style={[styles.legendText, { color: colors?.subtext }]} numberOfLines={1}>รายจ่าย</Text>
              </View>
              <Text style={[styles.legendHint, { color: colors?.subtext }]} numberOfLines={1}>
                กดค้างบนกราฟเพื่อดูรายละเอียด
              </Text>
            </View>
            {/* Summary Stats - พื้นหลังขาวเทาอ่อนทุกธีม */}
            <View style={styles.chartSummary}>
              <View style={styles.chartSummaryItem}>
                <View style={[styles.chartSummaryDot, { backgroundColor: chartIncomeLineColor }]} />
                  <View style={styles.chartSummaryContent}>
                  <Text style={[styles.chartSummaryLabel, { color: colors?.subtext }]} numberOfLines={1} {...(Platform.OS === "android" && { textBreakStrategy: "simple" })}>รายรับรวม</Text>
                  <View style={{ flexShrink: 0, minWidth: 0 }}>
                    <Text style={[styles.chartSummaryValue, { color: chartIncomeLineColor }]} numberOfLines={1} adjustsFontSizeToFit {...(Platform.OS === "android" && { textBreakStrategy: "simple" })}>
                      ฿{chartData.datasets[0]?.data.reduce((a, b) => a + b, 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || "0"}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.chartSummaryItem}>
                <View style={[styles.chartSummaryDot, { backgroundColor: chartExpenseLineColor }]} />
                  <View style={styles.chartSummaryContent}>
                  <Text style={[styles.chartSummaryLabel, { color: colors?.subtext }]} numberOfLines={1} {...(Platform.OS === "android" && { textBreakStrategy: "simple" })}>รายจ่ายรวม</Text>
                  <View style={{ flexShrink: 0, minWidth: 0 }}>
                    <Text style={[styles.chartSummaryValue, { color: chartExpenseLineColor }]} numberOfLines={1} adjustsFontSizeToFit {...(Platform.OS === "android" && { textBreakStrategy: "simple" })}>
                      ฿{chartData.datasets[1]?.data.reduce((a, b) => a + b, 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || "0"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            
            {/* สัปดาห์ = AREA อยู่หน้าเดียว | เดือน = LINE เลื่อนดูได้ | กราฟไม่แย่ง touch (pointerEvents="none") */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={timeRange === "month"}
              contentContainerStyle={{ paddingRight: timeRange === "month" ? 20 : 0 }}
              style={{ marginTop: 10 }}
              scrollEnabled={timeRange === "month"}
            >
              <View style={{ width: chartWidth, height: chartHeight }}>
                <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                  <LineChart
                      data={{
                        labels: chartData.labels,
                        datasets: [
                          {
                            data: chartData.datasets[0]?.data || [],
                            color: (opacity = 1) => hexToRgbA(chartIncomeLineColor, opacity),
                            strokeWidth: 2,
                          },
                          {
                            data: chartData.datasets[1]?.data || [],
                            color: (opacity = 1) => hexToRgbA(chartExpenseLineColor, opacity),
                            strokeWidth: 2,
                          },
                        ],
                      }}
                      width={chartWidth}
                      height={chartHeight}
                      chartConfig={{
                        backgroundColor: colors?.card,
                        backgroundGradientFrom: colors?.card,
                        backgroundGradientTo: colors?.card,
                        decimalPlaces: 0,
                        color: (opacity = 1) => chartIncomeLineColor,
                        labelColor: (opacity = 1) => colors?.subtext,
                        useShadowColorFromDataset: true,
                        propsForBackgroundLines: {
                          strokeDasharray: "",
                          stroke: hexToRgbA(colors?.subtext, 0.15),
                          strokeWidth: 1,
                        },
                        propsForVerticalLabels: { fontSize: 11 },
                        propsForHorizontalLabels: { fontSize: 11 },
                      }}
                      style={{ borderRadius: 16 }}
                      withInnerLines={true}
                      withOuterLines={false}
                      withVerticalLabels={true}
                      withHorizontalLabels={true}
                      withDots={false}
                      withShadow={timeRange === "week"}
                      withScrollableDot={false}
                      bezier
                      segments={4}
                      fromZero
                      formatYLabel={(value) => {
                        const num = parseFloat(value);
                        if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
                        return num.toString();
                      }}
                    />
                </View>
                <View style={StyleSheet.absoluteFill} {...chartPanResponder.panHandlers} />
                {chartTooltip && (
                  <>
                    <View
                      style={[
                        styles.chartTooltipDot,
                        {
                          left: chartTooltip.x - 6,
                          top: chartTooltip.y - 6,
                          backgroundColor: colors?.primary,
                        },
                      ]}
                      pointerEvents="none"
                    />
                    <View
                      style={[
                        styles.chartTooltipBox,
                        {
                          backgroundColor: colors?.card || "#f0f0f0",
                          borderColor: hexToRgbA(colors?.subtext, 0.2),
                          left: Math.max(4, Math.min(chartWidth - 110, chartTooltip.x - 55)),
                          top: Math.max(4, chartTooltip.y - 62),
                        },
                      ]}
                      pointerEvents="none"
                    >
                    <Text style={[styles.chartTooltipLabel, { color: "#333" }]}>
                      {chartTooltip.label}
                    </Text>
                    {chartTooltip.dateLabel ? (
                      <Text style={[styles.chartTooltipDate, { color: "#666" }]}>
                        {chartTooltip.dateLabel}
                      </Text>
                    ) : null}
                    <Text style={[styles.chartTooltipIncome, { color: chartIncomeLineColor }]}>
                      รายรับ ฿{Number(chartTooltip.income).toLocaleString("th-TH", { maximumFractionDigits: 0 })}
                    </Text>
                    <Text style={[styles.chartTooltipExpense, { color: chartExpenseLineColor }]}>
                      รายจ่าย ฿{Number(chartTooltip.expense).toLocaleString("th-TH", { maximumFractionDigits: 0 })}
                    </Text>
                  </View>
                  </>
                )}
              </View>
            </ScrollView>
          </>
        )}
        {chartData.labels.length === 0 && (
          <View style={styles.emptyChart}>
            <Ionicons name="stats-chart-outline" size={48} color={colors?.subtext} style={{ opacity: 0.3 }} />
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
                      {...(Platform.OS === "android" && { textBreakStrategy: "simple" })}
                    >
                      {t.category}
                    </Text>
                    <View style={styles.transactionMeta}>
                      <Text
                        style={[styles.transactionDate, { color: colors?.subtext }]}
                        {...(Platform.OS === "android" && { textBreakStrategy: "simple" })}
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
                            {...(Platform.OS === "android" && { textBreakStrategy: "simple" })}
                          >
                            {t.note}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                  <View style={{ flexShrink: 0 }}>
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
    fontSize: 12,
    marginBottom: 4,
  },
  username: {
    fontSize: 20,
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
    fontSize: 28,
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
    minWidth: 0,
    overflow: "hidden",
  },
  statContent: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
    overflow: "hidden",
  },
  statLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 4,
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 14,
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
    fontSize: 14,
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
    flexWrap: "wrap",
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  cardHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 14,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  quickStatContent: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
  },
  quickStatLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  chartControls: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    flexShrink: 0,
  },
  // chartTypeSelector Styles ลบออกหรือปล่อยไว้ก็ได้เพราะไม่ได้ใช้แล้ว
  timeRangeSelector: {
    flexDirection: "row",
    gap: 2,
    borderRadius: 8,
    padding: 2,
  },
  timeRangeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timeRangeText: {
    fontSize: 11,
    fontWeight: "400",
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
  },
  legendHint: {
    fontSize: 9,
    opacity: 0.8,
    marginLeft: 8,
    alignSelf: "center",
  },
  chartTooltipDot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  chartTooltipBox: {
    position: "absolute",
    width: 110,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
  },
  chartTooltipLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 1,
  },
  chartTooltipDate: {
    fontSize: 10,
    marginBottom: 3,
  },
  chartTooltipIncome: {
    fontSize: 10,
    fontWeight: "600",
  },
  chartTooltipExpense: {
    fontSize: 10,
    fontWeight: "600",
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
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginBottom: 8,
    borderRadius: 12,
  },
  chartSummaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  chartSummaryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  chartSummaryContent: {
    alignItems: "flex-start",
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
  },
  chartSummaryLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  chartSummaryValue: {
    fontSize: 12,
    fontWeight: "700",
  },
  seeAllText: {
    fontSize: 13,
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
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
});