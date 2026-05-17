import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function NhapLieuScreen() {
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [maCongDoan, setMaCongDoan] = useState('CD001');
    const [soLuong, setSoLuong] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    const [danhSachCongDoan, setDanhSachCongDoan] = useState(['CD001', 'CD002', 'CD003']);

    const handleAddCongDoan = () => {
        if (Platform.OS === 'web') {
            const newCode = window.prompt('Nhập mã công đoạn mới:');
            if (newCode) {
                setDanhSachCongDoan([...danhSachCongDoan, newCode]);
                setMaCongDoan(newCode);
            }
        } else if (Platform.OS === 'ios') {
            Alert.prompt(
                'Thêm mã công đoạn',
                'Nhập mã công đoạn mới:',
                [
                    { text: 'Hủy', style: 'cancel' },
                    { 
                        text: 'Thêm', 
                        onPress: (newCode) => {
                            if (newCode) {
                                setDanhSachCongDoan([...danhSachCongDoan, newCode]);
                                setMaCongDoan(newCode);
                            }
                        }
                    }
                ],
                'plain-text'
            );
        } else {
             const newCode = `CD00${danhSachCongDoan.length + 1}`;
             setDanhSachCongDoan([...danhSachCongDoan, newCode]);
             setMaCongDoan(newCode);
             Alert.alert('Thông báo', `Đã thêm mã tự động: ${newCode}`);
        }
    };

    const uploadToBlob = async (filename: string, data: string, token: string) => {
        const response = await fetch(`https://blob.vercel-storage.com/${filename}`, {
            method: 'PUT',
            headers: {
                'authorization': `Bearer ${token}`,
                'x-api-version': '7',
                'x-content-type': 'application/json',
                'x-access': 'public',
            },
            body: data
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }

        return await response.json();
    };

    const handleSave = async () => {
        if (!soLuong) {
            Platform.OS === 'web' ? alert('Vui lòng nhập số lượng') : Alert.alert('Lỗi', 'Vui lòng nhập số lượng');
            return;
        }

        setIsSaving(true);
        try {
            const data = {
                ngay: date.toISOString().split('T')[0],
                maCongDoan,
                soLuong: Number(soLuong),
                timestamp: new Date().toISOString()
            };

            const filename = `data/${Date.now()}.json`;
            // Vercel Blob Token: Need to set this in Vercel project environment variables (EXPO_PUBLIC_BLOB_READ_WRITE_TOKEN)
            const token = process.env.EXPO_PUBLIC_BLOB_READ_WRITE_TOKEN;

            if (token) {
                await uploadToBlob(filename, JSON.stringify(data), token);
            } else {
                console.warn('Vui lòng cấu hình EXPO_PUBLIC_BLOB_READ_WRITE_TOKEN trong file .env');
                // Simulate network request if token is missing
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            if (Platform.OS === 'web') {
                alert('Lưu thành công!');
            } else {
                Alert.alert('Thành công', 'Dữ liệu đã được lưu!');
            }
            setSoLuong('');
        } catch (error: any) {
            console.error('Lỗi khi lưu:', error);
            if (Platform.OS === 'web') {
                alert('Lỗi: ' + error.message);
            } else {
                Alert.alert('Lỗi', 'Không thể lưu dữ liệu: ' + error.message);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const formatDate = (d: Date) => {
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Nhập liệu</Text>
            </View>
            <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
                <View style={styles.formGroup}>
                    {/* Ngày tháng */}
                    <View style={styles.row}>
                        <Text style={styles.label}>Ngày</Text>
                        {Platform.OS === 'web' ? (
                            <input 
                                type="date" 
                                value={date.toISOString().split('T')[0]} 
                                onChange={(e) => {
                                    if (e.target.value) setDate(new Date(e.target.value));
                                }}
                                style={{ border: 'none', background: 'transparent', fontSize: 17, color: '#007AFF', textAlign: 'right', outline: 'none' }}
                            />
                        ) : (
                            <TouchableOpacity style={styles.valueContainer} onPress={() => setShowDatePicker(true)}>
                                <Text style={styles.dateText}>{formatDate(date)}</Text>
                                <Ionicons name="calendar-outline" size={20} color="#007AFF" style={styles.icon} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {showDatePicker && Platform.OS !== 'web' && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display="default"
                            onChange={(event, selectedDate) => {
                                setShowDatePicker(false);
                                if (selectedDate) setDate(selectedDate);
                            }}
                        />
                    )}

                    <View style={styles.divider} />

                    {/* Mã công đoạn */}
                    <View style={styles.row}>
                        <Text style={styles.label}>Công đoạn</Text>
                        <View style={styles.valueContainer}>
                            <View style={styles.pickerWrapper}>
                                <Picker
                                    selectedValue={maCongDoan}
                                    onValueChange={(itemValue) => setMaCongDoan(itemValue)}
                                    style={styles.picker}
                                >
                                    {danhSachCongDoan.map((cd) => (
                                        <Picker.Item key={cd} label={cd} value={cd} />
                                    ))}
                                </Picker>
                            </View>
                            <TouchableOpacity onPress={handleAddCongDoan} style={styles.iconButton}>
                                <Ionicons name="add-circle" size={22} color="#007AFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Số lượng */}
                    <View style={styles.row}>
                        <Text style={styles.label}>Số lượng</Text>
                        <TextInput
                            style={styles.input}
                            value={soLuong}
                            onChangeText={setSoLuong}
                            placeholder="Nhập số lượng"
                            placeholderTextColor="#C7C7CC"
                            keyboardType="numeric"
                            returnKeyType="done"
                        />
                    </View>
                </View>

                <TouchableOpacity 
                    style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveButtonText}>Lưu dữ liệu</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    header: {
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 16,
        paddingBottom: 8,
        paddingTop: 16,
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: '700',
        color: '#000000',
        letterSpacing: 0.37,
    },
    container: {
        flex: 1,
    },
    formGroup: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        marginHorizontal: 16,
        marginTop: 24,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        minHeight: 44,
        paddingVertical: 8,
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
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 17,
        color: '#007AFF',
        marginRight: 8,
    },
    icon: {
        marginLeft: 4,
    },
    iconButton: {
        marginLeft: 8,
        padding: 4,
    },
    pickerWrapper: {
        width: 120,
        ...(Platform.OS === 'web' && {
            borderWidth: 0,
        }),
    },
    picker: {
        width: '100%',
        color: '#007AFF',
        ...(Platform.OS === 'web' && {
            border: 'none',
            backgroundColor: 'transparent',
            fontSize: 17,
            textAlign: 'right',
            outline: 'none',
            appearance: 'none',
        }),
    },
    input: {
        flex: 1,
        fontSize: 17,
        color: '#007AFF',
        textAlign: 'right',
        marginLeft: 16,
    },
    saveButton: {
        backgroundColor: '#007AFF',
        borderRadius: 10,
        marginHorizontal: 16,
        marginTop: 32,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: '#A1C6F8',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
});