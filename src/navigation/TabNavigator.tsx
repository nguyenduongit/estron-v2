import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import NhapLieuScreen from '../screens/NhapLieuScreen';
import SanLuongScreen from '../screens/SanLuongScreen';
import CongTuanScreen from '../screens/CongTuanScreen';
import CaiDatScreen from '../screens/CaiDatScreen';
const Tab = createBottomTabNavigator();
export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#F9F9F9',
          borderTopColor: '#C6C6C8',
          borderTopWidth: 0.5,
          paddingTop: 4,
          paddingBottom: Platform.OS === 'web' ? 0 : (Platform.OS === 'ios' ? 28 : 8),
          height: Platform.OS === 'web' ? 60 : (Platform.OS === 'ios' ? 88 : 60),
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          letterSpacing: -0.24,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      <Tab.Screen
        name="NhapLieu"
        component={NhapLieuScreen}
        options={{
          tabBarLabel: 'Nhập liệu',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="create-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SanLuong"
        component={SanLuongScreen}
        options={{
          tabBarLabel: 'Sản lượng',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CongTuan"
        component={CongTuanScreen}
        options={{
          tabBarLabel: 'Công tuần',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CaiDat"
        component={CaiDatScreen}
        options={{
          tabBarLabel: 'Cài đặt',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
