import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import HistoryScreen from '../screens/HistoryScreen';
import StatsScreen from '../screens/StatsScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const tabIcons = {
  Dashboard: ['flame', 'flame-outline'],
  History: ['calendar', 'calendar-outline'],
  Stats: ['bar-chart', 'bar-chart-outline'],
  Analytics: ['pulse', 'pulse-outline'],
  Settings: ['settings', 'settings-outline'],
};

const MainTabs = () => {
  const { colors } = useTheme();
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            height: 60,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarIcon: ({ focused, color, size }) => {
            const [active, inactive] = tabIcons[route.name];
            return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="History" component={HistoryScreen} />
        <Tab.Screen name="Stats" component={StatsScreen} />
        <Tab.Screen name="Analytics" component={AnalyticsScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

// Mobile-first shell: centers content in a 480px card on wide screens
function MobileShell({ children, colors }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#E8E8E8', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: '100%',
        maxWidth: 480,
        flex: 1,
        backgroundColor: colors.background,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      }}>
        {children}
      </View>
    </View>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  const [screen, setScreen] = useState('Login');

  if (loading) {
    return (
      <MobileShell colors={colors}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </MobileShell>
    );
  }

  if (!user) {
    const nav = { navigate: (s) => setScreen(s) };
    return (
      <MobileShell colors={colors}>
        {screen === 'Login'
          ? <LoginScreen navigation={nav} />
          : <RegisterScreen navigation={nav} />}
      </MobileShell>
    );
  }

  return (
    <MobileShell colors={colors}>
      <MainTabs />
    </MobileShell>
  );
}
