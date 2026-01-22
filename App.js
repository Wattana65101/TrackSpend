import React, { useContext, useState, useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider, AppContext } from "./screens/AppContext";
import AppNavigator from "./screens/AppNavigator";
import AuthStack from "./screens/AuthStack";
import OnboardingScreen from "./screens/OnboardingScreen";

function MainApp() {
  const { token, hasSeenOnboarding, setHasSeenOnboarding, isNewUser, setIsNewUser, transactions } = useContext(AppContext);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const handleOnboardingComplete = () => {
    setHasSeenOnboarding(true);
    setIsNewUser(false); // หลังจากดู onboarding แล้ว ไม่ใช่บัญชีใหม่แล้ว
  };

  // รอให้ transactions ถูก fetch เสร็จก่อน (สำหรับบัญชีที่มี token)
  useEffect(() => {
    if (token) {
      // ถ้ามี transactions array แล้ว แสดงว่า fetch เสร็จแล้ว
      if (transactions !== null && transactions !== undefined) {
        setIsLoadingData(false);
      }
    } else {
      setIsLoadingData(false);
    }
  }, [token, transactions]);

  // ถ้ากำลังโหลด onboarding status หรือกำลัง fetch data ให้แสดง loading
  if (hasSeenOnboarding === null || (token && isLoadingData)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  // Debug: เช็คเงื่อนไข
  console.log("🔍 Onboarding Check:", {
    token: !!token,
    isNewUser,
    hasSeenOnboarding,
    transactionsCount: transactions?.length || 0,
    isLoadingData,
  });

  // แสดง onboarding เฉพาะเมื่อ: มี token, เป็นบัญชีใหม่, และยังไม่เคยดู onboarding
  if (token && isNewUser === true && hasSeenOnboarding === false) {
    console.log("✅ Showing onboarding screen");
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <NavigationContainer>
      {token ? <AppNavigator /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </SafeAreaProvider>
  );
}
