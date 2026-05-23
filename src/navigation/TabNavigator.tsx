import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import NhapLieuScreen from '../screens/NhapLieuScreen';
import SanLuongScreen from '../screens/SanLuongScreen';
import CongTuanScreen from '../screens/CongTuanScreen';
import CaiDatScreen from '../screens/CaiDatScreen';
import CustomHeader from '../components/layout/CustomHeader';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        header: ({ options }) => {
          const headerOptions = options as any;

          return (
            <CustomHeader
              title={headerOptions.headerTitleText ?? options.title ?? ''}
              leftAction={headerOptions.headerLeftAction}
              rightAction={headerOptions.headerRightAction}
              backgroundColor={headerOptions.headerBackgroundColor}
              topInsetBackgroundColor={headerOptions.headerSafeAreaColor}
              titleColor={headerOptions.headerTitleColor}
              height={headerOptions.headerHeight}
              contentStyle={headerOptions.headerContentStyle}
              containerStyle={headerOptions.headerContainerStyle}
              titleStyle={headerOptions.headerTitleTextStyle}
              platformOptions={headerOptions.headerPlatformOptions}
            />
          );
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#F9F9F9',
          borderTopColor: '#C6C6C8',
          borderTopWidth: 0.5,
          paddingBottom: Platform.OS === 'web' ? 'env(safe-area-inset-bottom)' : 0,
          height: Platform.OS === 'web' ? 70 : undefined,
        } as any,
      }}
    >
      <Tab.Screen
        name="NhapLieu"
        component={NhapLieuScreen}
        options={{
          title: 'Nhập liệu',
          headerTitleText: 'Nhập liệu',
          tabBarLabel: 'Nhập liệu',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="create-outline" size={size} color={color} />
          ),
        } as any}
      />
      <Tab.Screen
        name="SanLuong"
        component={SanLuongScreen}
        options={{
          title: 'Sản lượng',
          headerTitleText: 'Sản lượng',
          tabBarLabel: 'Sản lượng',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        } as any}
      />
      <Tab.Screen
        name="CongTuan"
        component={CongTuanScreen}
        options={{
          title: 'Công tuần',
          headerTitleText: 'Công tuần',
          tabBarLabel: 'Công tuần',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        } as any}
      />
      <Tab.Screen
        name="CaiDat"
        component={CaiDatScreen}
        options={{
          title: 'Cài đặt',
          headerTitleText: 'Cài đặt',
          tabBarLabel: 'Cài đặt',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        } as any}
      />
    </Tab.Navigator>
  );
}
