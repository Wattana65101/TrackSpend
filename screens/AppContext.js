import React, { createContext, useState, useMemo, useEffect } from "react";
import { useColorScheme, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const BASE_URL = "http://10.0.2.2:500"; 

//  THEME & COLORS
const hexToRgbA = (hex, alpha) => {
  let c;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('');
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = '0x' + c.join('');
    return (
      "rgba(" +
      [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(",") +
      "," +
      alpha +
      ")"
    );
  }
  return hex;
};

const themes = {
  // ธีมหลัก: MoneyGrow Emerald (Default) - ปรับความเข้มให้หลากหลาย
  emerald: {
    primary: "#059669", // emerald-600 - สีเขียวหลัก
    primaryLight: "#10B981", // emerald-500 - สีเขียวอ่อน
    primaryDark: "#047857", // emerald-700 - สีเขียวเข้ม
    background: "#ECFDF5", // emerald-50 - พื้นหลังอ่อน
    backgroundLight: "#F0FDF4", // green-50 - พื้นหลังอ่อนมาก
    card: "#FFFFFF",
    cardLight: "#F9FAFB", // gray-50 - card อ่อน
    text: "#064E3B", // emerald-900 - ข้อความเข้ม
    textMedium: "#065F46", // emerald-800 - ข้อความกลาง
    subtext: "#6B7280", // gray-500 - ข้อความรอง
    subtextLight: "#9CA3AF", // gray-400 - ข้อความรองอ่อน
    income: "#10B981", // emerald-500 - รายได้
    incomeLight: "#34D399", // emerald-400 - รายได้อ่อน
    incomeDark: "#059669", // emerald-600 - รายได้เข้ม
    expense: "#EF4444", // red-500 - รายจ่าย
    expenseLight: "#F87171", // red-400 - รายจ่ายอ่อน
    expenseDark: "#DC2626", // red-600 - รายจ่ายเข้ม
    buttonIncome: "#10B981", // emerald-500
    buttonExpense: "#EF4444", // red-500
    budgetIcon: "#059669", // emerald-600
    chartIncome: "#10B981", 
    chartExpense: "#EF4444", 
  },
  // ธีม: Ocean Blue - ปรับความเข้มให้หลากหลาย
  ocean: {
    primary: "#0EA5E9", // sky-500
    primaryLight: "#38BDF8", // sky-400
    primaryDark: "#0284C7", // sky-600
    background: "#F0F9FF", // sky-50
    backgroundLight: "#E0F2FE", // sky-100
    card: "#FFFFFF",
    cardLight: "#F8FAFC", // slate-50
    text: "#0C4A6E", // sky-900
    textMedium: "#075985", // sky-800
    subtext: "#64748B", // slate-500
    subtextLight: "#94A3B8", // slate-400
    income: "#06B6D4", // cyan-500
    incomeLight: "#22D3EE", // cyan-400
    incomeDark: "#0891B2", // cyan-600
    expense: "#F43F5E", // rose-500
    expenseLight: "#FB7185", // rose-400
    expenseDark: "#E11D48", // rose-600
    buttonIncome: "#06B6D4",
    buttonExpense: "#F43F5E",
    budgetIcon: "#0EA5E9",
    chartIncome: "#06B6D4", 
    chartExpense: "#F43F5E", 
  },
  // ธีม: Purple Dream - ปรับความเข้มให้หลากหลาย
  purple: {
    primary: "#8B5CF6", // violet-500
    primaryLight: "#A78BFA", // violet-400
    primaryDark: "#7C3AED", // violet-600
    background: "#FAF5FF", // violet-50
    backgroundLight: "#F3E8FF", // violet-100
    card: "#FFFFFF",
    cardLight: "#F9FAFB", // gray-50
    text: "#4C1D95", // violet-900
    textMedium: "#5B21B6", // violet-800
    subtext: "#6B7280", // gray-500
    subtextLight: "#9CA3AF", // gray-400
    income: "#A78BFA", // violet-400
    incomeLight: "#C4B5FD", // violet-300
    incomeDark: "#8B5CF6", // violet-500
    expense: "#F87171", // red-400
    expenseLight: "#FCA5A5", // red-300
    expenseDark: "#EF4444", // red-500
    buttonIncome: "#A78BFA",
    buttonExpense: "#F87171",
    budgetIcon: "#8B5CF6",
    chartIncome: "#A78BFA", 
    chartExpense: "#F87171", 
  },
  // ธีม: Sunset Orange - ปรับความเข้มให้หลากหลาย
  sunset: {
    primary: "#F97316", // orange-500
    primaryLight: "#FB923C", // orange-400
    primaryDark: "#EA580C", // orange-600
    background: "#FFF7ED", // orange-50
    backgroundLight: "#FFEDD5", // orange-100
    card: "#FFFFFF",
    cardLight: "#FEF3C7", // amber-50
    text: "#7C2D12", // orange-900
    textMedium: "#9A3412", // orange-800
    subtext: "#6B7280", // gray-500
    subtextLight: "#9CA3AF", // gray-400
    income: "#FB923C", // orange-400
    incomeLight: "#FDBA74", // orange-300
    incomeDark: "#F97316", // orange-500
    expense: "#DC2626", // red-600
    expenseLight: "#EF4444", // red-500
    expenseDark: "#B91C1C", // red-700
    buttonIncome: "#FB923C",
    buttonExpense: "#DC2626",
    budgetIcon: "#F97316",
    chartIncome: "#FB923C", 
    chartExpense: "#DC2626", 
  },
  // ธีม: Forest Green - ปรับความเข้มให้หลากหลาย
  forest: {
    primary: "#16A34A", // green-600
    primaryLight: "#22C55E", // green-500
    primaryDark: "#15803D", // green-700
    background: "#F0FDF4", // green-50
    backgroundLight: "#DCFCE7", // green-100
    card: "#FFFFFF",
    cardLight: "#F9FAFB", // gray-50
    text: "#14532D", // green-900
    textMedium: "#166534", // green-800
    subtext: "#6B7280", // gray-500
    subtextLight: "#9CA3AF", // gray-400
    income: "#22C55E", // green-500
    incomeLight: "#4ADE80", // green-400
    incomeDark: "#16A34A", // green-600
    expense: "#EF4444", // red-500
    expenseLight: "#F87171", // red-400
    expenseDark: "#DC2626", // red-600
    buttonIncome: "#22C55E",
    buttonExpense: "#EF4444",
    budgetIcon: "#16A34A",
    chartIncome: "#22C55E", 
    chartExpense: "#EF4444", 
  },
  // ธีม: Dark Mode - ปรับความเข้มให้หลากหลาย
  dark: {
    primary: "#10B981", // emerald-500
    primaryLight: "#34D399", // emerald-400
    primaryDark: "#059669", // emerald-600
    background: "#111827", // gray-900
    backgroundLight: "#1F2937", // gray-800
    card: "#1F2937", // gray-800
    cardLight: "#374151", // gray-700
    text: "#F9FAFB", // gray-50
    textMedium: "#E5E7EB", // gray-200
    subtext: "#9CA3AF", // gray-400
    subtextLight: "#6B7280", // gray-500
    income: "#34D399", // emerald-400
    incomeLight: "#6EE7B7", // emerald-300
    incomeDark: "#10B981", // emerald-500
    expense: "#F87171", // red-400
    expenseLight: "#FCA5A5", // red-300
    expenseDark: "#EF4444", // red-500
    buttonIncome: "#34D399",
    buttonExpense: "#F87171",
    budgetIcon: "#10B981",
    chartIncome: "#34D399", 
    chartExpense: "#F87171", 
  },
};

export const expenseCategories = [
  { name: "อาหาร", icon: "restaurant" },
  { name: "เดินทาง", icon: "car" },
  { name: "ช้อปปิ้ง", icon: "cart" },
  { name: "ค่าใช้จ่ายในบ้าน", icon: "home" },
  { name: "ความบันเทิง", icon: "film" },
  { name: "สุขภาพ", icon: "medkit" },
  { name: "การศึกษา", icon: "book" },
  { name: "ค่าสาธารณูปโภค", icon: "bulb" },
  { name: "เสื้อผ้า", icon: "shirt" },
  { name: "เครื่องสำอาง", icon: "sparkles" },
  { name: "สัตว์เลี้ยง", icon: "paw" },
  { name: "กีฬา", icon: "football" },
  { name: "ดอกไม้", icon: "flower" },
  { name: "ของขวัญ", icon: "gift" },
  { name: "อื่น ๆ", icon: "ellipsis-horizontal-circle" },
];

export const incomeCategories = [
  { name: "เงินเดือน", icon: "wallet" },
  { name: "รายได้เสริม", icon: "cash" },
  { name: "ของขวัญ", icon: "gift" },
  { name: "เงินลงทุน", icon: "trending-up" },
  { name: "โบนัส", icon: "trophy" },
  { name: "เงินคืน", icon: "return-down-back" },
  { name: "ดอกเบี้ย", icon: "trending-up" },
  { name: "ขายของ", icon: "storefront" },
  { name: "อื่น ๆ", icon: "ellipsis-horizontal-circle" },
];

export const AppContext = createContext();

export function AppProvider({ children }) {
  const systemTheme = useColorScheme();
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [theme, setTheme] = useState("emerald"); // ✅ default emerald theme (MoneyGrow)
  const colors = themes[theme] || themes.emerald;

  // โหลด transactions และ budgets
  const fetchTransactionsAndBudgets = async () => {
    if (!token) {
      console.warn("⚠️ No token found, skipping fetchTransactionsAndBudgets");
      return;
    }
    try {
      // --- Transactions ---
      const transactionsResponse = await fetch(`${BASE_URL}/api/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const transactionsText = await transactionsResponse.text();
      if (transactionsResponse.ok) {
        const transactionsData = JSON.parse(transactionsText);
        setTransactions(transactionsData);
      } else {
        console.error("❌ Failed to fetch transactions:", transactionsResponse.status, transactionsText);
      }

      // --- Budgets ---
      const budgetsResponse = await fetch(`${BASE_URL}/api/budgets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const budgetsText = await budgetsResponse.text();
      if (budgetsResponse.ok) {
        const budgetsData = JSON.parse(budgetsText);
        setBudgets(budgetsData);
      } else {
        console.error("❌ Failed to fetch budgets:", budgetsResponse.status, budgetsText);
      }
    } catch (error) {
      console.error("🔥 Error fetching data:", error);
    }
  };

  // ลบ transaction
  const deleteTransaction = async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/api/transactions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        Alert.alert("สำเร็จ", "ลบรายการเรียบร้อยแล้ว");
        fetchTransactionsAndBudgets();
      } else {
        const errorText = await response.text();
        console.error("❌ Delete failed:", response.status, errorText);
        Alert.alert("ข้อผิดพลาด", "ไม่สามารถลบรายการได้");
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    }
  };

  //  ลบงบประมาณ
  const deleteBudget = async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/api/budgets/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        Alert.alert("สำเร็จ", "ลบงบประมาณเรียบร้อยแล้ว");
        fetchTransactionsAndBudgets();
      } else {
        const errorText = await response.text();
        console.error("❌ Delete budget failed:", response.status, errorText);
        Alert.alert("ข้อผิดพลาด", "ไม่สามารถลบงบประมาณได้");
      }
    } catch (error) {
      console.error("Error deleting budget:", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    }
  };

  // คำนวณยอดเงินรวม
  useEffect(() => {
    if (transactions.length > 0) {
      const balance = transactions.reduce((sum, t) => {
        const amt = Number(t.amount) || 0;
        return sum + (t.type === "income" ? amt : -amt);
      }, 0);
      setTotalBalance(balance);
    } else {
      setTotalBalance(0);
    }
  }, [transactions]);

  // โหลด token, username, theme จาก AsyncStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        if (storedToken) setToken(storedToken);

        const storedUsername = await AsyncStorage.getItem("username");
        if (storedUsername) setUsername(storedUsername);

        const storedTheme = await AsyncStorage.getItem("theme");
        if (storedTheme && themes[storedTheme]) {
          setTheme(storedTheme);
        } else if (storedTheme) {
          // ถ้า theme เก่าไม่มีแล้ว ให้เปลี่ยนเป็น emerald (default)
          setTheme("emerald");
          await AsyncStorage.setItem("theme", "emerald");
        }
      } catch (error) {
        console.error("Failed to load data", error);
      }
    };
    loadData();
  }, []);

  // บันทึก username และ theme
  useEffect(() => {
    AsyncStorage.setItem("username", username || "");
  }, [username]);

  useEffect(() => {
    AsyncStorage.setItem("theme", theme);
  }, [theme]);

  // ดึงข้อมูล user profile
  const fetchUserProfile = async () => {
    if (!token) {
      console.warn("⚠️ No token found, skipping fetchUserProfile");
      return;
    }
    try {
      const response = await fetch(`${BASE_URL}/api/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // ตรวจสอบ status ก่อน
      if (!response.ok) {
        // ถ้าเป็น 401 หรือ 403 อาจเป็น token หมดอายุ
        if (response.status === 401 || response.status === 403) {
          console.warn("⚠️ Token expired or invalid, skipping user profile fetch");
          return;
        }
      }
      
      // ตรวจสอบ content-type ก่อน parse JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.warn("⚠️ Response is not JSON, status:", response.status, "content:", text.substring(0, 50));
        return;
      }
      
      const text = await response.text();
      if (!text || text.trim() === "") {
        console.warn("⚠️ Empty response from server");
        return;
      }
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("❌ JSON parse error:", parseError.message, "Response:", text.substring(0, 100));
        return;
      }
      
      if (response.ok && data.success && data.user) {
        // อัปเดต username จาก database (ถ้ามี)
        if (data.user.username && data.user.username.trim() !== "") {
          setUsername(data.user.username.trim());
          await AsyncStorage.setItem("username", data.user.username.trim());
        } else {
          // ถ้า username เป็น null หรือ empty ให้ล้าง username
          setUsername(null);
          await AsyncStorage.removeItem("username");
        }
      } else {
        console.warn("⚠️ Failed to fetch user profile:", data?.message || "Unknown error");
      }
    } catch (error) {
      // ไม่แสดง error ถ้าเป็น network error
      if (error.message && (error.message.includes("JSON") || error.message.includes("Network"))) {
        console.warn("⚠️ Network or JSON error (might be temporary):", error.message);
      } else {
        console.error("🔥 Error fetching user profile:", error.message);
      }
    }
  };

  // โหลดข้อมูลเมื่อ token เปลี่ยน
  useEffect(() => {
    if (token) {
      fetchTransactionsAndBudgets();
      fetchUserProfile(); // ดึงข้อมูล user profile
    } else {
      setTransactions([]);
      setBudgets([]);
      setUsername(null); // ล้าง username เมื่อ logout
    }
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      setToken,
      transactions,
      budgets,
      totalBalance,
      colors,
      theme,
      setTheme,
      fetchTransactionsAndBudgets,
      deleteTransaction,
      deleteBudget,   
      username,
      setUsername,
      BASE_URL,
      hexToRgbA,
      expenseCategories,
      incomeCategories,
    }),
    [token, transactions, budgets, totalBalance, colors, theme, username]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
