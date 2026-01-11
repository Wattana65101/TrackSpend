import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Circle, Rect, Path } from "react-native-svg";

export default function MoneyGrowLogo({ size = 64, color = "#FFFFFF" }) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {/* Base Rectangle - Ground/Soil */}
        <Rect
          x="25"
          y="60"
          width="50"
          height="12"
          rx="6"
          fill={color}
        />
        
        {/* Main Stem - Vertical line */}
        <Path
          d="M50 60L50 35"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Left Branch - Curved upward */}
        <Path
          d="M50 40Q45 30 40 25"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Right Branch - Curved upward */}
        <Path
          d="M50 40Q55 30 60 25"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Gold Dot - At the top center */}
        <Circle
          cx="50"
          cy="25"
          r="5"
          fill="#FBBF24"
        />
        
        {/* Dashed Circle - Around the sprout */}
        <Circle
          cx="50"
          cy="42"
          r="30"
          stroke={color}
          strokeWidth="2"
          strokeDasharray="3 3"
          opacity="0.6"
          fill="none"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});

