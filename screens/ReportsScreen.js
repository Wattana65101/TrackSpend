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
              fontSize: '13px',
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

export default function ReportsScreen() {
  const { transactions, budgets, colors, hexToRgbA } = useContext(AppContext);
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

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: colors?.background, paddingTop: insets.top + 10 },
      ]}
      contentContainerStyle={{ paddingBottom: (insets.bottom || 20) + 72 }}
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
    fontSize: 32,
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
  apexChartWrap: {
    width: "100%",
    overflow: "hidden",
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
