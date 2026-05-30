import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import NhapLieuScreen from '../screens/NhapLieuScreen';
import SanLuongScreen from '../screens/SanLuongScreen';
import CongTuanScreen from '../screens/CongTuanScreen';
import TaiLieuScreen from '../screens/TaiLieuScreen';
import CustomHeader from '../components/layout/CustomHeader';
import CustomTabNavigator from '../components/layout/CustomTabNavigator';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabNavigator {...props} />}
      screenOptions={{
        headerShown: true,
        header: ({ options }) => {
          const headerOptions = options as any;

          return (
            <CustomHeader
              title={headerOptions.headerTitleText ?? options.title ?? ''}
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
        name="TaiLieu"
        component={TaiLieuScreen}
        options={{
          title: 'Tài liệu',
          headerTitleText: 'Tài liệu',
          tabBarLabel: 'Tài liệu',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        } as any}
      />
    </Tab.Navigator>
  );
}
