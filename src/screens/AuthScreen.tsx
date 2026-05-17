import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchUsers, saveUsers } from '../utils/blobStorage';

interface AuthScreenProps {
    onAuthSuccess: (user: any) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAuth = async () => {
        if (!phone.trim()) {
            Platform.OS === 'web' ? alert('Vui lòng nhập số điện thoại') : Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại');
            return;
        }

        if (!isLoginMode && !name.trim()) {
            Platform.OS === 'web' ? alert('Vui lòng nhập họ tên') : Alert.alert('Lỗi', 'Vui lòng nhập họ tên');
            return;
        }

        setIsLoading(true);
        try {
            const users = await fetchUsers();
            const existingUser = users.find((u: any) => u.phone === phone);

            if (isLoginMode) {
                if (existingUser) {
                    // Login success
                    await AsyncStorage.setItem('user', JSON.stringify(existingUser));
                    onAuthSuccess(existingUser);
                } else {
                    Platform.OS === 'web' ? alert('Số điện thoại không tồn tại!') : Alert.alert('Lỗi', 'Số điện thoại không tồn tại!');
                }
            } else {
                // Register
                if (existingUser) {
                    Platform.OS === 'web' ? alert('Số điện thoại đã được đăng ký!') : Alert.alert('Lỗi', 'Số điện thoại đã được đăng ký!');
                } else {
                    const newUser = { id: Date.now().toString(), name: name.trim(), phone: phone.trim(), createdAt: new Date().toISOString() };
                    users.push(newUser);
                    await saveUsers(users);
                    await AsyncStorage.setItem('user', JSON.stringify(newUser));
                    onAuthSuccess(newUser);
                }
            }
        } catch (error: any) {
            console.error('Auth error:', error);
            if (Platform.OS === 'web') {
                alert('Lỗi hệ thống: ' + error.message);
            } else {
                Alert.alert('Lỗi', 'Có lỗi xảy ra, vui lòng thử lại sau.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Estron</Text>
                    <Text style={styles.subTitle}>{isLoginMode ? 'Đăng nhập để tiếp tục' : 'Tạo tài khoản mới'}</Text>
                </View>

                <View style={styles.formGroup}>
                    {!isLoginMode && (
                        <>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Họ và tên</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nguyễn Văn A"
                                    value={name}
                                    onChangeText={setName}
                                    autoCapitalize="words"
                                />
                            </View>
                            <View style={styles.divider} />
                        </>
                    )}

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Số điện thoại</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="09xxxxxxxx"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>

                <TouchableOpacity 
                    style={[styles.primaryButton, isLoading && styles.disabledButton]} 
                    onPress={handleAuth}
                    disabled={isLoading}
                >
                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{isLoginMode ? 'Đăng Nhập' : 'Đăng Ký'}</Text>}
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.switchButton} 
                    onPress={() => setIsLoginMode(!isLoginMode)}
                    disabled={isLoading}
                >
                    <Text style={styles.switchButtonText}>
                        {isLoginMode ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
                    </Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    headerTitle: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 8,
    },
    subTitle: {
        fontSize: 17,
        color: '#8E8E93',
    },
    formGroup: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 24,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        minHeight: 50,
    },
    label: {
        width: 100,
        fontSize: 17,
        fontWeight: '500',
        color: '#000',
    },
    input: {
        flex: 1,
        fontSize: 17,
        color: '#007AFF',
        paddingVertical: 12,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#C6C6C8',
        marginLeft: 16,
    },
    primaryButton: {
        backgroundColor: '#007AFF',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 16,
    },
    disabledButton: {
        backgroundColor: '#A1C6F8',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
    switchButton: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    switchButtonText: {
        color: '#007AFF',
        fontSize: 16,
    }
});
