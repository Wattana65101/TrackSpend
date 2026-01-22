import React, { useState, useRef, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { AppContext } from "./AppContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const onboardingData = [
  {
    id: 1,
    icon: "wallet",
    title: "ยินดีต้อนรับสู่ TrackSpend",
    description: "แอปพลิเคชันจัดการเงินของคุณอย่างง่ายดาย\nติดตามรายรับ-รายจ่ายได้ทุกที่ทุกเวลา",
    color: "#059669",
  },
  {
    id: 2,
    icon: "add-circle",
    title: "เพิ่มรายการรายรับ-รายจ่าย",
    description: "บันทึกรายการเงินของคุณได้ทันที\nเลือกหมวดหมู่และเพิ่มหมายเหตุได้",
    color: "#10B981",
  },
  {
    id: 3,
    icon: "cash",
    title: "ตั้งงบประมาณ",
    description: "กำหนดงบประมาณสำหรับแต่ละหมวดหมู่\nเพื่อควบคุมการใช้จ่ายของคุณ",
    color: "#059669",
  },
  {
    id: 4,
    icon: "bar-chart",
    title: "ดูรายงานและกราฟ",
    description: "วิเคราะห์การใช้จ่ายของคุณด้วยกราฟ\nดูสรุปรายรับ-รายจ่ายรายเดือน",
    color: "#10B981",
  },
  {
    id: 5,
    icon: "checkmark-circle",
    title: "พร้อมเริ่มต้นแล้ว!",
    description: "เริ่มบันทึกรายการแรกของคุณเลย\nเพื่อติดตามการเงินของคุณอย่างมีประสิทธิภาพ",
    color: "#059669",
  },
];

export default function OnboardingScreen({ onComplete }) {
  const { colors, hexToRgbA } = useContext(AppContext);
  const insets = useSafeAreaInsets();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleNext = () => {
    if (currentPage < onboardingData.length - 1) {
      const nextPage = currentPage + 1;
      scrollViewRef.current?.scrollTo({
        x: nextPage * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentPage(nextPage);
    } else {
      handleComplete();
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem("hasSeenOnboarding", "true");
    onComplete();
  };

  const handleComplete = async () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(async () => {
      await AsyncStorage.setItem("hasSeenOnboarding", "true");
      onComplete();
    });
  };

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentPage(page);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors?.background || "#ECFDF5" },
        { opacity: fadeAnim },
      ]}
    >
      {/* Skip Button */}
      <TouchableOpacity
        style={[styles.skipButton, { paddingTop: insets.top + 10 }]}
        onPress={handleSkip}
        activeOpacity={0.7}
      >
        <Text style={[styles.skipText, { color: colors?.subtext || "#6B7280" }]}>
          ข้าม
        </Text>
      </TouchableOpacity>

      {/* ScrollView for Pages */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {onboardingData.map((item, index) => (
          <View key={item.id} style={[styles.page, { width: SCREEN_WIDTH }]}>
            <View style={styles.content}>
              {/* Icon */}
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: hexToRgbA(item.color, 0.1) },
                ]}
              >
                <Ionicons name={item.icon} size={80} color={item.color} />
              </View>

              {/* Title */}
              <Text
                style={[
                  styles.title,
                  { color: colors?.text || "#064E3B" },
                ]}
              >
                {item.title}
              </Text>

              {/* Description */}
              <Text
                style={[
                  styles.description,
                  { color: colors?.subtext || "#6B7280" },
                ]}
              >
                {item.description}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor:
                  index === currentPage
                    ? colors?.primary || "#059669"
                    : hexToRgbA(colors?.subtext || "#6B7280", 0.3),
                width: index === currentPage ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Navigation Buttons */}
      <View
        style={[
          styles.buttonContainer,
          { paddingBottom: insets.bottom + 20 },
        ]}
      >
        {currentPage > 0 && (
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonSecondary,
              {
                backgroundColor: hexToRgbA(colors?.subtext || "#6B7280", 0.1),
              },
            ]}
            onPress={() => {
              const prevPage = currentPage - 1;
              scrollViewRef.current?.scrollTo({
                x: prevPage * SCREEN_WIDTH,
                animated: true,
              });
              setCurrentPage(prevPage);
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.buttonTextSecondary,
                { color: colors?.subtext || "#6B7280" },
              ]}
            >
              ย้อนกลับ
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            styles.buttonPrimary,
            {
              backgroundColor: colors?.primary || "#059669",
              flex: currentPage === 0 ? 1 : 0.6,
            },
          ]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonTextPrimary}>
            {currentPage === onboardingData.length - 1 ? "เริ่มต้นใช้งาน" : "ถัดไป"}
          </Text>
          {currentPage < onboardingData.length - 1 && (
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: "absolute",
    top: 0,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  skipText: {
    fontSize: 16,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  page: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    transition: "all 0.3s",
  },
  buttonContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    paddingTop: 20,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  buttonPrimary: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonSecondary: {
    flex: 0.4,
  },
  buttonTextPrimary: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: "600",
  },
});
