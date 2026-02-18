import React, { useState, useRef, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { AppContext } from "./AppContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createOnboardingStyles } from "./OnboardingScreen.styles";

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
  const styles = createOnboardingStyles(colors, hexToRgbA);
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

  const primary = colors?.primary || "#059669";
  const subtext = colors?.subtext || "#6B7280";

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Skip Button */}
      <TouchableOpacity
        style={[styles.skipButton, { paddingTop: insets.top + 10 }]}
        onPress={handleSkip}
        activeOpacity={0.7}
      >
        <Text style={styles.skipText}>ข้าม</Text>
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
        {onboardingData.map((item) => (
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
              <Text style={[styles.title, styles.titleOverride]}>{item.title}</Text>

              {/* Description */}
              <Text style={styles.description}>{item.description}</Text>
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
              index === currentPage ? styles.dotActive : styles.dotInactive,
              {
                backgroundColor:
                  index === currentPage
                    ? primary
                    : hexToRgbA(subtext, 0.3),
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
            style={[styles.button, styles.buttonSecondary]}
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
            <Text style={styles.buttonSecondaryText}>ย้อนกลับ</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.button,
            styles.buttonPrimary,
            { flex: currentPage === 0 ? 1 : 0.6 },
          ]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonPrimaryText}>
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
