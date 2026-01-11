import React, { useRef, useEffect } from "react";
import { View, StyleSheet, Animated } from "react-native";
import MoneyGrowLogo from "./MoneyGrowLogo";

export default function AppLogo({ size = "large" }) {
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create continuous bounce animation
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -10,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    bounce.start();
    return () => bounce.stop();
  }, []);

  const logoSize = size === "large" ? 64 : 48;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: bounceAnim }],
        },
      ]}
    >
      <View style={[styles.logoWrapper, { width: logoSize + 32, height: logoSize + 32 }]}>
        <MoneyGrowLogo size={logoSize} color="#FFFFFF" />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrapper: {
    backgroundColor: "#10B981", // emerald-500 - brighter green background
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)", // Brighter white border
    alignItems: "center",
    justifyContent: "center",
    // Shadow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
});

