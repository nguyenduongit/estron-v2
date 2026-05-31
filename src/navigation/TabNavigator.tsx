import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import NhapLieuScreen from '../screens/NhapLieuScreen';
import SanLuongScreen from '../screens/SanLuongScreen';
import CongTuanScreen from '../screens/CongTuanScreen';
import TaiLieuScreen from '../screens/TaiLieuScreen';
import CustomHeader from '../components/layout/CustomHeader';
import CustomTabNavigator from '../components/layout/CustomTabNavigator';

const TopTab = createMaterialTopTabNavigator();

const TopTabScreen = (Component: React.ComponentType<any>, initialOptions: any) => {
  return (props: any) => {
    const [headerOptions, setHeaderOptions] = React.useState<any>(initialOptions);

    const proxiedNavigation = React.useMemo(() => {
      return {
        ...props.navigation,
        setOptions: (options: any) => {
          setHeaderOptions((prev: any) => ({ ...prev, ...options }));
          props.navigation.setOptions(options);
        }
      };
    }, [props.navigation]);

    return (
      <View style={{ flex: 1 }}>
        <CustomHeader
          title={headerOptions.headerTitleText ?? headerOptions.title ?? props.route.name}
          backgroundColor={headerOptions.headerBackgroundColor}
          topInsetBackgroundColor={headerOptions.headerSafeAreaColor}
          titleColor={headerOptions.headerTitleColor}
          height={headerOptions.headerHeight}
          contentStyle={headerOptions.headerContentStyle}
          containerStyle={headerOptions.headerContainerStyle}
          titleStyle={headerOptions.headerTitleTextStyle}
          platformOptions={headerOptions.headerPlatformOptions}
          headerLeft={headerOptions.headerLeft}
        />
        <Component {...props} navigation={proxiedNavigation} />
      </View>
    );
  };
};

export default function TabNavigator() {
  return (
    <TopTab.Navigator
      tabBarPosition="bottom"
      tabBar={(props) => <CustomTabNavigator {...props} />}
      screenOptions={{
        swipeEnabled: true,
      }}
    >
      <TopTab.Screen
        name="NhapLieu"
        component={TopTabScreen(NhapLieuScreen, {
          title: 'Nhập liệu',
          headerTitleText: 'Nhập liệu',
        })}
        options={{
          title: 'Nhập liệu',
          headerTitleText: 'Nhập liệu',
          tabBarLabel: 'Nhập liệu',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="create-outline" size={size} color={color} />
          ),
        } as any}
      />
      <TopTab.Screen
        name="SanLuong"
        component={TopTabScreen(SanLuongScreen, {
          title: 'Sản lượng',
          headerTitleText: 'Sản lượng',
        })}
        options={{
          title: 'Sản lượng',
          headerTitleText: 'Sản lượng',
          tabBarLabel: 'Sản lượng',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        } as any}
      />
      <TopTab.Screen
        name="CongTuan"
        component={TopTabScreen(CongTuanScreen, {
          title: 'Công tuần',
          headerTitleText: 'Công tuần',
        })}
        options={{
          title: 'Công tuần',
          headerTitleText: 'Công tuần',
          tabBarLabel: 'Công tuần',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        } as any}
      />
      <TopTab.Screen
        name="TaiLieu"
        component={TopTabScreen(TaiLieuScreen, {
          title: 'Tài liệu',
          headerTitleText: 'Tài liệu',
        })}
        options={{
          title: 'Tài liệu',
          headerTitleText: 'Tài liệu',
          tabBarLabel: 'Tài liệu',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        } as any}
      />
    </TopTab.Navigator>
  );
}
