import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, DeviceEventEmitter, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CaiDatScreen() {
    const [userName, setUserName] = useState('');
    const [userPhone, setUserPhone] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            const data = await AsyncStorage.getItem('user');
            if (data) {
                const u = JSON.parse(data);
                setUserName(u.name || '');
                setUserPhone(u.phone || '');
            }
        };
        fetchUser();
    }, []);

    const handleLogout = () => {
        if (Platform.OS === 'web') {
            if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                DeviceEventEmitter.emit('onLogout');
            }
        } else {
            Alert.alert(
                'Đăng xuất',
                'Bạn có chắc chắn muốn đăng xuất?',
                [
                    { text: 'Hủy', style: 'cancel' },
                    { text: 'Đăng xuất', style: 'destructive', onPress: () => DeviceEventEmitter.emit('onLogout') }
                ]
            );
        }
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Cài đặt</Text>
            </View>
            <View style={styles.container}>
                <View style={styles.userInfoGroup}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Tài khoản</Text>
                        <Text style={styles.value}>{userName}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <Text style={styles.label}>Số điện thoại</Text>
                        <Text style={styles.value}>{userPhone}</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Đăng xuất</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#007AFF',
    },
    header: {
        backgroundColor: '#007AFF',
        paddingVertical: 14,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    container: {
        flex: 1,
        paddingTop: 24,
        backgroundColor: '#F2F2F7',
    },
    userInfoGroup: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        marginHorizontal: 16,
        overflow: 'hidden',
        marginBottom: 24,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        minHeight: 44,
        paddingVertical: 12,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#C6C6C8',
        marginLeft: 16,
    },
    label: {
        fontSize: 17,
        color: '#000000',
        fontWeight: '400',
    },
    value: {
        fontSize: 17,
        color: '#8E8E93',
    },
    logoutButton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        marginHorizontal: 16,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoutText: {
        color: '#FF3B30',
        fontSize: 17,
        fontWeight: '600',
    }
});