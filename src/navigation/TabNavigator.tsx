import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { PanResponder, View } from 'react-native';
import NhapLieuScreen from '../screens/NhapLieuScreen';
import SanLuongScreen from '../screens/SanLuongScreen';
import CongTuanScreen from '../screens/CongTuanScreen';
import LichTrinhScreen from '../screens/LichTrinhScreen';
// import TaiLieuScreen from '../screens/TaiLieuScreen';
import CustomHeader from '../components/layout/CustomHeader';
import CustomTabNavigator from '../components/layout/CustomTabNavigator';

const TAB_ROUTES = ['NhapLieu', 'SanLuong', 'CongTuan', 'LichTrinh'];

interface SwipeableScreenWrapperProps {
  children: React.ReactNode;
  routeName: string;
  disabled?: boolean;
}


// Better yet, use navigation directly inside the functional wrapper:
function SwipeableNavigationWrapper({ children, routeName, disabled = false, navigation }: SwipeableScreenWrapperProps & { navigation: any }) {
  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (disabled) return false;
        const { dx, dy } = gestureState;
        return Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 2;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (disabled) return;
        const { dx } = gestureState;
        const currentIndex = TAB_ROUTES.indexOf(routeName);
        
        if (dx < -50) {
          if (currentIndex < TAB_ROUTES.length - 1) {
            navigation.navigate(TAB_ROUTES[currentIndex + 1]);
          }
        } else if (dx > 50) {
          if (currentIndex > 0) {
            navigation.navigate(TAB_ROUTES[currentIndex - 1]);
          }
        }
      },
    })
  ).current;

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {children}
    </View>
  );
}

const SwipeableScreen = (Component: React.ComponentType<any>, routeName: string) => {
  return (props: any) => {
    const hasActiveSubScreen = props.route?.params?.hasActiveSubScreen === true;
    return (
      <SwipeableNavigationWrapper routeName={routeName} disabled={hasActiveSubScreen} navigation={props.navigation}>
        <Component {...props} />
      </SwipeableNavigationWrapper>
    );
  };
};

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
              headerLeft={headerOptions.headerLeft}
              headerRight={headerOptions.headerRight}
            />
          );
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}
    >
      <Tab.Screen
        name="NhapLieu"
        component={SwipeableScreen(NhapLieuScreen, 'NhapLieu')}
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
        component={SwipeableScreen(SanLuongScreen, 'SanLuong')}
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
        component={SwipeableScreen(CongTuanScreen, 'CongTuan')}
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
        name="LichTrinh"
        component={SwipeableScreen(LichTrinhScreen, 'LichTrinh')}
        options={{
          title: 'Lịch trình',
          headerTitleText: 'Lịch trình',
          tabBarLabel: 'Lịch trình',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="calendar-clear-outline" size={size} color={color} />
          ),
        } as any}
      />
    </Tab.Navigator>
  );
}
