import React, { useState } from 'react';
import { ActivityIndicator, View, useWindowDimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { colors, fontSize } from '../theme';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import HistoryScreen from '../screens/HistoryScreen';
import StatsScreen from '../screens/StatsScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Dashboard', component: DashboardScreen, icon: ['flame', 'flame-outline'] },
  { name: 'History',   component: HistoryScreen,   icon: ['calendar', 'calendar-outline'] },
  { name: 'Stats',     component: StatsScreen,     icon: ['bar-chart', 'bar-chart-outline'] },
  { name: 'Analytics', component: AnalyticsScreen, icon: ['pulse', 'pulse-outline'] },
  { name: 'Settings',  component: SettingsScreen,  icon: ['settings', 'settings-outline'] },
];

function Shell({ children }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <View style={{ flex: 1, backgroundColor: isDesktop ? '#F0F4F8' : colors.background, alignItems: 'center' }}>
      <View style={{
        width: '100%',
        maxWidth: isDesktop ? 480 : undefined,
        flex: 1,
        backgroundColor: colors.background,
        ...(isDesktop ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.12,
          shadowRadius: 32,
        } : {}),
      }}>
        {children}
      </View>
    </View>
  );
}

function MainTabs() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => {
          const tab = TABS.find((t) => t.name === route.name);
          return {
            headerShown: false,
            tabBarStyle: {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              borderTopWidth: 1,
              height: 60,
              paddingBottom: 8,
            },
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarLabelStyle: { fontSize: fontSize.xs, fontWeight: '600' },
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? tab.icon[0] : tab.icon[1]} size={size} color={color} />
            ),
          };
        }}
      >
        {TABS.map((t) => <Tab.Screen key={t.name} name={t.name} component={t.component} />)}
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const [screen, setScreen] = useState('Login');
  const nav = { navigate: (s) => setScreen(s) };

  return (
    <Shell>
      {loading
        ? <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={colors.primary} /></View>
        : !user
        ? screen === 'Login' ? <LoginScreen navigation={nav} /> : <RegisterScreen navigation={nav} />
        : <MainTabs />
      }
    </Shell>
  );
}
