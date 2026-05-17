import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, DeviceEventEmitter } from 'react-native';

import TabNavigator from './src/navigation/TabNavigator';
import AuthScreen from './src/screens/AuthScreen';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (e) {
        console.error("Lỗi khi đọc AsyncStorage", e);
      } finally {
        setIsReady(true);
      }
    };
    checkLoginStatus();

    const logoutSub = DeviceEventEmitter.addListener('onLogout', async () => {
      await AsyncStorage.removeItem('user');
      setUser(null);
    });

    return () => {
      logoutSub.remove();
    };
  }, []);

  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user');
    setUser(null);
  };

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        {user ? (
           // Note: In a real app we might pass user/handleLogout via Context
          <TabNavigator />
        ) : (
          <AuthScreen onAuthSuccess={handleAuthSuccess} />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
