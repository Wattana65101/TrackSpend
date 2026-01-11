import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppContext } from './AppContext';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 📌 import screens
import HomeScreen from './HomeScreen';
import TransactionsScreen from './TransactionsScreen';
import AddTransactionScreen from './AddTransactionScreen';
import BudgetScreen from './BudgetScreen';
import ReportsScreen from './ReportsScreen';
import SettingsScreen from './SettingsScreen';

const Tab = createBottomTabNavigator();

// Custom Tab Bar Component
function CustomTabBar({ state, descriptors, navigation, colors, hexToRgbA }) {
  const insets = useSafeAreaInsets();

  // กรอง routes ที่ซ่อนไว้ (เช่น AddTransaction)
  // กำหนด routes ที่ต้องการแสดงใน tab bar
  const visibleRouteNames = ['Home', 'Budgets', 'Reports', 'Transactions', 'Settings'];
  const visibleRoutes = state.routes.filter((route) => {
    return visibleRouteNames.includes(route.name);
  });

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          backgroundColor: colors.card,
          paddingBottom: insets.bottom,
          shadowColor: colors.text,
          borderTopColor: hexToRgbA(colors.subtext, 0.1),
        },
      ]}
    >
      <View style={styles.tabBarInner}>
        {visibleRoutes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === state.routes.findIndex(r => r.key === route.key);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          let iconName;
          if (route.name === 'Home') {
            iconName = isFocused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Budgets') {
            iconName = isFocused ? 'cash' : 'cash-outline';
          } else if (route.name === 'Reports') {
            iconName = isFocused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'Transactions') {
            iconName = isFocused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Settings') {
            iconName = isFocused ? 'options' : 'options-outline';
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[
                styles.tabButton,
                isFocused && {
                  backgroundColor: hexToRgbA(colors.primary, 0.1),
                },
              ]}
              activeOpacity={0.7}
            >
              <View style={[
                styles.tabIconContainer,
                isFocused && styles.tabIconContainerFocused,
              ]}>
                <Ionicons
                  name={iconName}
                  size={isFocused ? 26 : 24}
                  color={isFocused ? colors.primary : colors.subtext}
                />
              </View>
              {isFocused && <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function AppNavigator() {
  const { colors, hexToRgbA } = useContext(AppContext);

  if (!colors) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <Tab.Navigator
      tabBar={(props) => (
        <CustomTabBar {...props} colors={colors} hexToRgbA={hexToRgbA} />
      )}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Budgets" component={BudgetScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />

      {/* 📌 AddTransaction ซ่อนไว้ ไม่โผล่ใน Tab Bar แต่เรียกใช้งานได้ */}
      <Tab.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={{
          tabBarButton: () => null,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 16,
  },
  tabBarInner: {
    flexDirection: 'row',
    height: 64,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 2,
    position: 'relative',
    minHeight: 56,
  },
  tabIconContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  tabIconContainerFocused: {
    // Animation จะทำงานผ่าน Animated API ถ้าต้องการ
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 6,
    width: 32,
    height: 3,
    borderRadius: 2,
  },
});
