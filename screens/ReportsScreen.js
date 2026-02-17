import React, { useContext, useMemo, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { AppContext, expenseCategories, incomeCategories } from "./AppContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import Ionicons from "react-native-vector-icons/Ionicons";

// สีไม่ซ้ำกันสำหรับแต่ละหมวดหมู่
const CATEGORY_COLORS = [
  "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899",
  "#06B6D4", "#84CC16", "#F97316", "#6366F1", "#14B8A6", "#A855F7",
  "#E11D48", "#0EA5E9", "#22C55E", "#EAB308",
];

function getApexRadialBarHtml(data, width, height) {
  const series = data.map((d) => Math.min(100, Math.round(d.percentUsed || 0)));
  const labels = data.map((d) => d.name);
  const colors = data.map((d) => d.color);
  const totalSpent = data.reduce((sum, d) => sum + (isNaN(d.amount) ? 0 : Number(d.amount)), 0);
  const totalStr = totalSpent.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const totalStrEsc = totalStr.replace(/"/g, '\\"');
  const seriesStr = JSON.stringify(series);
  const labelsStr = JSON.stringify(labels).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");
  const colorsStr = JSON.stringify(colors);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
</head>
<body style="margin:0;padding:0;background:transparent;">
  <div id="chart" style="width:100%;min-height:${height}px;"></div>
  <script>
    (function() {
      var options = {
        series: ${seriesStr},
        chart: { height: ${height}, width: ${width}, type: 'radialBar' },
        plotOptions: {
          radialBar: {
            offsetY: 0,
            startAngle: 0,
            endAngle: 270,
            hollow: {
              margin: 5,
              size: '30%',
              background: 'transparent'
            },
            track: { background: 'rgba(0,0,0,0.06)' },
            dataLabels: {
              name: { show: false },
              value: { show: false },
              total: {
                show: true,
                label: 'รวมใช้ไป',
                formatter: function() { return '฿' + "${totalStrEsc}"; }
              }
            },
            barLabels: {
              enabled: true,
              useSeriesColors: true,
              offsetX: -8,
              fontSize: '11px',
              formatter: function(seriesName, opts) {
                var val = opts.w.globals.series[opts.seriesIndex];
                return seriesName + ":  " + val + "%";
              }
            }
          }
        },
        colors: ${colorsStr},
        labels: ${labelsStr},
        legend: { show: false }
      };
      var chart = new ApexCharts(document.querySelector("#chart"), options);
      chart.render();
    })();
  <\/script>
</body>
</html>`;
}

const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function getApexStackedAreaHtml(months, incomeData, expenseData, width, height, incomeColor, expenseColor) {
  const categoriesStr = JSON.stringify(months);
  const incomeStr = JSON.stringify(incomeData);
  const expenseStr = JSON.stringify(expenseData);
  const incColor = (incomeColor || "#10B981").replace(/"/g, '\\"');
  const expColor = (expenseColor || "#EF4444").replace(/"/g, '\\"');
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
</head>
<body style="margin:0;padding:0;background:transparent;">
  <div id="chart" style="width:100%;min-height:${height}px;"></div>
  <script>
    (function() {
      var options = {
        series: [
          { name: 'รายรับ', data: ${incomeStr} },
          { name: 'รายจ่าย', data: ${expenseStr} }
        ],
        chart: {
          type: 'area',
          height: ${height},
          width: ${width},
          stacked: false,
          toolbar: { show: false },
          zoom: { enabled: false }
        },
        colors: ["${incColor}", "${expColor}"],
        stroke: { curve: 'smooth', width: 2 },
        fill: {
          type: 'gradient',
          gradient: { opacityFrom: 0.6, opacityTo: 0.15 }
        },
        dataLabels: { enabled: false },
        xaxis: { categories: ${categoriesStr}, labels: { style: { fontSize: '11px' } } },
        yaxis: {
          labels: { formatter: function(v) { return v.toLocaleString(); } },
          axisBorder: { show: false },
          axisTicks: { show: false }
        },
        grid: {
          borderColor: 'rgba(0,0,0,0.06)',
          strokeDashArray: 4,
          xaxis: { lines: { show: false } }
        },
        legend: {
          position: 'top',
          horizontalAlign: 'right',
          fontSize: '12px'
        },
        tooltip: {
          enabled: false
        }
      };
      options.chart.events = {
        dataPointSelection: function(event, chartContext, config) {
          var idx = config.dataPointIndex;
          if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === "function") {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: "monthSelected", index: idx }));
          }
        }
      };
      var chart = new ApexCharts(document.querySelector("#chart"), options);
      chart.render();
    })();
  <\/script>
</body>
</html>`;
}

export default function ReportsScreen() {
  const { transactions, budgets, colors, hexToRgbA } = useContext(AppContext);
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get("window").width;

  // สีเส้นกราฟ: รายรับ = เขียว, รายจ่าย = แดง (ตามธีม)
  const chartIncomeLineColor = colors?.chartIncome || colors?.income;
  const chartExpenseLineColor = colors?.chartExpense || colors?.expense;

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
          color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
          legendFontColor: colors?.text,
          legendFontSize: 12,
        };
      })
      .filter((item) => item.amount > 0);
  }, [transactions, colors]);

  const budgetChartData = useMemo(() => {
    if (!transactions || !budgets || !budgets.length) return [];
    return budgets.map((budget, index) => {
      const spent = transactions
        .filter((t) => t.type === "expense" && t.category === budget.category)
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      const limit = Number(budget.limit) || 0;
      const percentUsed = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
      const catIndex = expenseCategories.findIndex((c) => c.name === budget.category);
      const color = CATEGORY_COLORS[catIndex >= 0 ? catIndex % CATEGORY_COLORS.length : index % CATEGORY_COLORS.length];
      return {
        name: budget.category,
        amount: spent,
        limit,
        percentUsed,
        color,
      };
    });
  }, [transactions, budgets]);

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

  const monthlyChartData = useMemo(() => {
    if (!transactions) return { months: [], monthKeys: [], income: [], expense: [] };
    const now = new Date();
    const monthCount = 6;
    const months = [];
    const monthKeys = [];
    const incomeByMonth = [];
    const expenseByMonth = [];
    // เดือนปัจจุบันอยู่หน้าสุด (i=0 = ปัจจุบัน, i=1 = 1 เดือนที่แล้ว, ...)
    for (let i = 0; i < monthCount; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear() + 543;
      const shortYear = String(y).slice(-2);
      months.push(THAI_MONTHS[d.getMonth()] + " " + shortYear);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthKeys.push(key);
      let inc = 0;
      let exp = 0;
      transactions.forEach((t) => {
        if (!t.date) return;
        const tDate = new Date(t.date);
        const tKey = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, "0")}`;
        if (tKey !== key) return;
        const amt = parseFloat(t.amount) || 0;
        if (t.type === "income") inc += amt;
        else if (t.type === "expense") exp += amt;
      });
      incomeByMonth.push(inc);
      expenseByMonth.push(exp);
    }
    return { months, monthKeys, income: incomeByMonth, expense: expenseByMonth };
  }, [transactions]);

  const [selectedMonthIndex, setSelectedMonthIndex] = useState(null);

  const transactionsForSelectedMonth = useMemo(() => {
    if (selectedMonthIndex == null || !transactions || !monthlyChartData.monthKeys) return [];
    const key = monthlyChartData.monthKeys[selectedMonthIndex];
    const allCategories = [...expenseCategories, ...incomeCategories];
    return transactions
      .filter((t) => {
        if (!t.date) return false;
        const tDate = new Date(t.date);
        const tKey = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, "0")}`;
        return tKey === key;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map((t) => {
        const categoryInfo = allCategories.find((c) => c.name === t.category);
        return { ...t, icon: categoryInfo?.icon || "help-circle-outline" };
      });
  }, [transactions, selectedMonthIndex, monthlyChartData.monthKeys]);

  const topExpenseCategoryInSelectedMonth = useMemo(() => {
    const expenses = (transactionsForSelectedMonth || []).filter((t) => t.type === "expense");
    if (expenses.length === 0) return null;
    const byCategory = {};
    expenses.forEach((t) => {
      const cat = t.category || "อื่น ๆ";
      const amt = parseFloat(t.amount) || 0;
      byCategory[cat] = (byCategory[cat] || 0) + amt;
    });
    let topName = null;
    let topAmount = 0;
    Object.entries(byCategory).forEach(([name, amount]) => {
      if (amount > topAmount) {
        topAmount = amount;
        topName = name;
      }
    });
    return topName ? { category: topName, amount: topAmount } : null;
  }, [transactionsForSelectedMonth]);

  const scrollRef = useRef(null);
  const scrollYRef = useRef(0);
  useEffect(() => {
    if (selectedMonthIndex != null && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          y: scrollYRef.current + 260,
          animated: true,
        });
      }, 100);
    }
  }, [selectedMonthIndex]);

  return (
    <ScrollView
      ref={scrollRef}
      onScroll={(e) => { scrollYRef.current = e.nativeEvent.contentOffset.y; }}
      scrollEventThrottle={32}
      style={[
        styles.container,
        { backgroundColor: colors?.background, paddingTop: insets.top + 10 },
      ]}
      contentContainerStyle={{ paddingBottom: (insets.bottom || 20) + 100 }}
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

      {/* รายรับ-รายจ่าย รายเดือน (Stacked Area) */}
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
            <Ionicons name="stats-chart" size={20} color={colors?.primary} />
          </View>
          <Text style={[styles.sectionTitle, { color: colors?.text }]}>
            รายรับ-รายจ่าย รายเดือน
          </Text>
        </View>
        {monthlyChartData.months.length > 0 ? (
          <>
            <View style={[styles.apexChartWrap, { height: 280 }]}>
              <WebView
                source={{
                  html: getApexStackedAreaHtml(
                    monthlyChartData.months,
                    monthlyChartData.income,
                    monthlyChartData.expense,
                    screenWidth - 80,
                    260,
                    chartIncomeLineColor,
                    chartExpenseLineColor
                  ),
                }}
                style={{ backgroundColor: "transparent" }}
                scrollEnabled={false}
                originWhitelist={["*"]}
                onMessage={(e) => {
                  try {
                    const msg = JSON.parse(e.nativeEvent.data);
                    if (msg.type === "monthSelected" && typeof msg.index === "number" && msg.index >= 0 && msg.index < monthlyChartData.months.length) {
                      setSelectedMonthIndex(msg.index);
                    }
                  } catch (_) {}
                }}
              />
              {/* ชั้นกดเลือกเดือนบนกราฟ (6 ช่อง) — กดแล้วข้อมูลจะขึ้นด้านล่าง */}
              <View style={[StyleSheet.absoluteFill, { pointerEvents: "box-none" }]}>
                <View style={styles.chartTouchOverlay}>
                  {monthlyChartData.months.map((_, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.chartTouchZone}
                      activeOpacity={1}
                      onPress={() => setSelectedMonthIndex(selectedMonthIndex === index ? null : index)}
                    />
                  ))}
                </View>
              </View>
            </View>
            <Text
              style={[styles.monthSelectorLabel, { color: colors?.subtext }]}
              {...(Platform.OS === "android" && { textBreakStrategy: "simple" })}
            >
              เลือกเดือนเพื่อดูรายละเอียด
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.monthSelectorRow}
            >
              {monthlyChartData.months.map((label, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedMonthIndex(selectedMonthIndex === index ? null : index)}
                  style={[
                    styles.monthChip,
                    {
                      backgroundColor: selectedMonthIndex === index
                        ? hexToRgbA(colors?.primary, 0.2)
                        : hexToRgbA(colors?.subtext, 0.08),
                      borderColor: selectedMonthIndex === index ? colors?.primary : "transparent",
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.monthChipText,
                      {
                        color: selectedMonthIndex === index ? colors?.primary : colors?.text,
                        fontWeight: selectedMonthIndex === index ? "600" : "500",
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {selectedMonthIndex != null && (
              <View style={styles.monthDetailSection}>
                {topExpenseCategoryInSelectedMonth && (
                  <View style={[styles.topExpenseRow, { backgroundColor: hexToRgbA(colors?.expense, 0.08) }]}>
                    <Ionicons name="trending-down" size={18} color={colors?.expense} />
                    <Text style={[styles.topExpenseText, { color: colors?.text }]}>
                      ใช้จ่ายมากที่สุด:{" "}
                      <Text style={{ color: colors?.expense, fontWeight: "700" }}>
                        {topExpenseCategoryInSelectedMonth.category}{" "}
                        ฿{topExpenseCategoryInSelectedMonth.amount.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </Text>
                    </Text>
                  </View>
                )}
                <Text style={[styles.monthDetailTitle, { color: colors?.text }]}>
                  รายการใน {monthlyChartData.months[selectedMonthIndex]}
                </Text>
                {transactionsForSelectedMonth.length > 0 ? (
                  <View style={styles.monthDetailList}>
                    {transactionsForSelectedMonth.map((t, index) => (
                      <View
                        key={t._id || index}
                        style={[
                          styles.transactionItem,
                          {
                            backgroundColor: hexToRgbA(
                              t.type === "income" ? colors?.income : colors?.expense,
                              0.06
                            ),
                            borderLeftColor: t.type === "income" ? colors?.income : colors?.expense,
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
                            size={20}
                            color={t.type === "income" ? colors?.income : colors?.expense}
                          />
                        </View>
                        <View style={styles.transactionDetails}>
                          <Text style={[styles.transactionCategory, { color: colors?.text }]}>
                            {t.category}
                          </Text>
                          <View style={styles.transactionMeta}>
                            <Text style={[styles.transactionDate, { color: colors?.subtext }]}>
                              {t.date
                                ? new Date(t.date).toLocaleDateString("th-TH", {
                                    day: "numeric",
                                    month: "short",
                                  })
                                : ""}
                            </Text>
                            {t.note ? (
                              <>
                                <Text style={[styles.transactionMetaDot, { color: colors?.subtext }]}> • </Text>
                                <Text
                                  style={[styles.transactionNote, { color: colors?.subtext }]}
                                  numberOfLines={1}
                                >
                                  {t.note}
                                </Text>
                              </>
                            ) : null}
                          </View>
                        </View>
                        <Text
                          style={[
                            styles.transactionAmount,
                            { color: t.type === "income" ? colors?.income : colors?.expense },
                          ]}
                        >
                          {t.type === "income" ? "+" : "-"}฿
                          {Number(t.amount || 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={[styles.monthDetailEmpty, { color: colors?.subtext }]}>
                    ไม่มีรายการในเดือนนี้
                  </Text>
                )}
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyChart}>
            <Ionicons
              name="bar-chart-outline"
              size={48}
              color={colors?.subtext}
              style={{ opacity: 0.3 }}
            />
            <Text style={[styles.emptyChartText, { color: colors?.subtext }]}>
              ยังไม่มีข้อมูลรายรับ-รายจ่าย
            </Text>
          </View>
        )}
      </View>

      {/* ApexCharts RadialBar ใช้ไปเทียบงบ - แสดงเฉพาะหมวดที่มีการใช้จ่าย */}
      {budgetChartData.length > 0 && (
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
              แผนภูมิรายจ่ายตามหมวดหมู่
            </Text>
          </View>
          {budgetChartData.filter((b) => Number(b.amount) > 0).length > 0 ? (
            <View style={[styles.apexChartWrap, { height: 320 }]}>
              <WebView
                source={{ html: getApexRadialBarHtml(budgetChartData.filter((b) => Number(b.amount) > 0), screenWidth - 80, 280) }}
                style={{ backgroundColor: "transparent" }}
                scrollEnabled={false}
                originWhitelist={["*"]}
              />
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <Ionicons name="wallet-outline" size={48} color={colors?.subtext} style={{ opacity: 0.3 }} />
              <Text style={[styles.emptyChartText, { color: colors?.subtext }]}>
                แสดงเมื่อมีการใช้รายจ่ายในงบ
              </Text>
            </View>
          )}
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
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
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
    fontSize: 14,
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
  apexChartWrap: {
    width: "100%",
    overflow: "hidden",
  },
  chartTouchOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 260,
    flexDirection: "row",
  },
  chartTouchZone: {
    flex: 1,
  },
  monthSelectorLabel: {
    fontSize: 12,
    marginTop: 14,
    marginBottom: 8,
  },
  monthSelectorRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 4,
  },
  monthChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  monthChipText: {
    fontSize: 13,
  },
  monthDetailSection: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  topExpenseRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  topExpenseText: {
    fontSize: 14,
    flex: 1,
  },
  monthDetailTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
  },
  monthDetailList: {
    gap: 8,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 15,
    fontWeight: "600",
  },
  transactionMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
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
    fontSize: 15,
    fontWeight: "700",
  },
  monthDetailEmpty: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 16,
  },
  legendTitle: {
    fontSize: 13,
    marginTop: 12,
    marginBottom: 4,
  },
  legendSubtitle: {
    fontSize: 11,
    marginBottom: 10,
    opacity: 0.9,
  },
  legendContainer: {
    marginTop: 4,
    gap: 6,
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
  legendTextWrap: {
    flex: 1,
  },
  legendText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
