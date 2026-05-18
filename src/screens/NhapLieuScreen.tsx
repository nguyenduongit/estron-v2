import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchUserData, saveUserData } from '../utils/blobStorage';

interface CongDoan {
    maCongDoan: string;
    dinhMuc: number;
}

export default function NhapLieuScreen() {
    const [user, setUser] = useState<any>(null);
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // User Data State
    const [danhSachCongDoan, setDanhSachCongDoan] = useState<CongDoan[]>([]);
    const [maCongDoan, setMaCongDoan] = useState('');
    const [soLuong, setSoLuong] = useState('');
    const [thoiGianThucHien, setThoiGianThucHien] = useState('480');
    const [thoiGianHoTro, setThoiGianHoTro] = useState('0');

    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [fullData, setFullData] = useState<any>(null);

    // Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newMa, setNewMa] = useState('');
    const [newDinhMuc, setNewDinhMuc] = useState('');

    useEffect(() => {
        loadUserData();
    }, []);

    useEffect(() => {
        if (fullData && fullData.nangSuat) {
            const dateStr = date.toISOString().split('T')[0];
            const dataForDate = fullData.nangSuat[dateStr];
            if (dataForDate) {
                setThoiGianThucHien(dataForDate.thoiGianThucHien !== undefined ? dataForDate.thoiGianThucHien.toString() : '480');
                setThoiGianHoTro(dataForDate.thoiGianHoTro !== undefined ? dataForDate.thoiGianHoTro.toString() : '0');
            } else {
                setThoiGianThucHien('480');
                setThoiGianHoTro('0');
            }
        } else {
            setThoiGianThucHien('480');
            setThoiGianHoTro('0');
        }
    }, [date, fullData]);

    const loadUserData = async () => {
        setIsLoadingData(true);
        try {
            const userDataString = await AsyncStorage.getItem('user');
            if (userDataString) {
                const u = JSON.parse(userDataString);
                setUser(u);

                const data = await fetchUserData(u.phone);
                if (data) {
                    if (data.sanLuong && !data.nangSuat) {
                        data.nangSuat = {};
                        for (const [d, arr] of Object.entries(data.sanLuong)) {
                            data.nangSuat[d] = {
                                thoiGianThucHien: 0,
                                thoiGianHoTro: 0,
                                sanLuong: arr
                            };
                        }
                        delete data.sanLuong;
                    }
                    if (!data.nangSuat) data.nangSuat = {};

                    setFullData(data);
                    if (data.congDoan) {
                        setDanhSachCongDoan(data.congDoan);
                        if (data.congDoan.length > 0) {
                            setMaCongDoan(data.congDoan[0].maCongDoan);
                        }
                    }
                } else {
                    // Initialize empty data
                    const initialData = { congDoan: [], nangSuat: {} };
                    setFullData(initialData);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleSaveNewCongDoan = async () => {
        if (!newMa || !newDinhMuc) {
            Platform.OS === 'web' ? alert('Vui lòng nhập đủ thông tin') : Alert.alert('Lỗi', 'Vui lòng nhập đủ thông tin');
            return;
        }

        const norm = Number(newDinhMuc);
        if (isNaN(norm)) {
            Platform.OS === 'web' ? alert('Định mức phải là số') : Alert.alert('Lỗi', 'Định mức phải là số');
            return;
        }

        const newCd: CongDoan = { maCongDoan: newMa.trim(), dinhMuc: norm };
        const updatedList = [...danhSachCongDoan, newCd];
        setDanhSachCongDoan(updatedList);
        setMaCongDoan(newCd.maCongDoan);

        // Update full data
        const updatedData = { ...fullData, congDoan: updatedList };
        setFullData(updatedData);

        // Save immediately to Blob
        try {
            await saveUserData(user.phone, updatedData);
        } catch (e) {
            console.error("Save cong doan error:", e);
        }

        setShowAddModal(false);
        setNewMa('');
        setNewDinhMuc('');
    };

    const handleSave = async () => {
        if (!soLuong) {
            Platform.OS === 'web' ? alert('Vui lòng nhập số lượng') : Alert.alert('Lỗi', 'Vui lòng nhập số lượng');
            return;
        }
        if (!maCongDoan) {
            Platform.OS === 'web' ? alert('Vui lòng chọn hoặc thêm mã công đoạn') : Alert.alert('Lỗi', 'Vui lòng chọn hoặc thêm mã công đoạn');
            return;
        }

        setIsSaving(true);
        try {
            const dateStr = date.toISOString().split('T')[0];
            const updatedData = { ...fullData };

            if (!updatedData.nangSuat) updatedData.nangSuat = {};

            if (!updatedData.nangSuat[dateStr]) {
                updatedData.nangSuat[dateStr] = {
                    thoiGianThucHien: thoiGianThucHien === '' ? 480 : Number(thoiGianThucHien),
                    thoiGianHoTro: thoiGianHoTro === '' ? 0 : Number(thoiGianHoTro),
                    sanLuong: []
                };
            } else {
                updatedData.nangSuat[dateStr].thoiGianThucHien = thoiGianThucHien === '' ? 480 : Number(thoiGianThucHien);
                updatedData.nangSuat[dateStr].thoiGianHoTro = thoiGianHoTro === '' ? 0 : Number(thoiGianHoTro);
            }

            updatedData.nangSuat[dateStr].sanLuong.push({
                maCongDoan,
                soLuong: Number(soLuong),
                timestamp: new Date().toISOString()
            });

            await saveUserData(user.phone, updatedData);
            setFullData(updatedData);

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

    const selectedCongDoanData = danhSachCongDoan.find(c => c.maCongDoan === maCongDoan);

    if (isLoadingData) {
        return (
            <View style={styles.screenContainer}>
                <SafeAreaView style={styles.safeArea} edges={['top']} />
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.screenContainer}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Nhập liệu</Text>
                </View>
            </SafeAreaView>
            <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
                <View style={styles.formGroup}>
                    {/* Ngày tháng */}
                    <View style={styles.row}>
                        <Text style={styles.label}>Ngày</Text>
                        {Platform.OS === 'web' ? (
                            <View style={[styles.valueContainer, { position: 'relative' }]}>
                                <Text style={styles.dateText}>{formatDate(date)}</Text>
                                <input
                                    type="date"
                                    value={date.toISOString().split('T')[0]}
                                    onChange={(e) => {
                                        if (e.target.value) setDate(new Date(e.target.value));
                                    }}
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                />
                            </View>
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
                                {danhSachCongDoan.length > 0 ? (
                                    <Picker
                                        selectedValue={maCongDoan}
                                        onValueChange={(itemValue) => setMaCongDoan(itemValue)}
                                        style={styles.picker}
                                    >
                                        {danhSachCongDoan.map((cd) => (
                                            <Picker.Item key={cd.maCongDoan} label={cd.maCongDoan} value={cd.maCongDoan} />
                                        ))}
                                    </Picker>
                                ) : (
                                    <Text style={{ color: '#8E8E93', marginRight: 8, fontSize: 17 }}>Chưa có mã</Text>
                                )}
                            </View>
                            <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.iconButton}>
                                <Ionicons name="add-circle" size={22} color="#007AFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Hiển thị định mức */}
                    {selectedCongDoanData && (
                        <>
                            <View style={styles.divider} />
                            <View style={styles.row}>
                                <Text style={styles.label}>Định mức</Text>
                                <Text style={styles.infoText}>{selectedCongDoanData.dinhMuc}</Text>
                            </View>
                        </>
                    )}

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

                    {/* Thời gian thực hiện */}
                    <View style={styles.row}>
                        <Text style={styles.label}>Thời gian thực hiện</Text>
                        <TextInput
                            style={styles.input}
                            value={thoiGianThucHien}
                            onChangeText={setThoiGianThucHien}
                            placeholder="Nhập phút"
                            placeholderTextColor="#C7C7CC"
                            keyboardType="numeric"
                            returnKeyType="done"
                            onFocus={() => {
                                if (thoiGianThucHien === '480') setThoiGianThucHien('');
                            }}
                            onBlur={() => {
                                if (thoiGianThucHien.trim() === '') setThoiGianThucHien('480');
                            }}
                        />
                    </View>

                    <View style={styles.divider} />

                    {/* Thời gian hỗ trợ */}
                    <View style={styles.row}>
                        <Text style={styles.label}>Thời gian hỗ trợ</Text>
                        <TextInput
                            style={styles.input}
                            value={thoiGianHoTro}
                            onChangeText={setThoiGianHoTro}
                            placeholder="Nhập phút"
                            placeholderTextColor="#C7C7CC"
                            keyboardType="numeric"
                            returnKeyType="done"
                            onFocus={() => {
                                if (thoiGianHoTro === '0') setThoiGianHoTro('');
                            }}
                            onBlur={() => {
                                if (thoiGianHoTro.trim() === '') setThoiGianHoTro('0');
                            }}
                        />
                    </View>

                    <View style={styles.divider} />
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, (isSaving || danhSachCongDoan.length === 0) && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={isSaving || danhSachCongDoan.length === 0}
                >
                    {isSaving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveButtonText}>Lưu dữ liệu</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>

            {/* Modal Thêm Công Đoạn */}
            <Modal visible={showAddModal} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Thêm công đoạn</Text>
                        <View style={styles.modalInputGroup}>
                            <Text style={styles.modalLabel}>Mã công đoạn</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Ví dụ: 5.2"
                                placeholderTextColor="#C7C7CC"
                                value={newMa}
                                onChangeText={setNewMa}
                            />
                        </View>
                        <View style={styles.modalInputGroup}>
                            <Text style={styles.modalLabel}>Định mức</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Ví dụ: 1135"
                                placeholderTextColor="#C7C7CC"
                                value={newDinhMuc}
                                onChangeText={setNewDinhMuc}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowAddModal(false)}>
                                <Text style={styles.modalBtnTextCancel}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalBtnSave} onPress={handleSaveNewCongDoan}>
                                <Text style={styles.modalBtnTextSave}>Thêm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    safeArea: {
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
        backgroundColor: '#F2F2F7',
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
        width: 155,
        flexShrink: 0,
        fontSize: 17,
        color: '#000000',
        fontWeight: '400',
    },
    valueContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        minWidth: 0,
    },
    dateText: {
        fontSize: 17,
        color: '#007AFF',
        textAlign: 'right', // Căn phải text
        flex: 1,           // Chiếm hết không gian để căn phải hiệu quả
    },

    icon: {
        marginLeft: 4,
    },
    iconButton: {
        marginLeft: 8,
        paddingVertical: 4,
        paddingLeft: 8,
        paddingRight: 0,
    },
    pickerWrapper: {
        flex: 1,
        minWidth: 0,
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
            direction: 'rtl',
            outline: 'none',
            appearance: 'none',
        }),
    },
    infoText: {
        flex: 1,
        fontSize: 17,
        color: '#8E8E93',
        textAlign: 'right',
        minWidth: 0,
    },
    input: {
        flex: 1,
        fontSize: 17,
        color: '#007AFF',
        textAlign: 'right',
        marginLeft: 8,
        minWidth: 0,
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

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 14,
        width: '100%',
        maxWidth: 340,
        padding: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalInputGroup: {
        marginBottom: 16,
    },
    modalLabel: {
        fontSize: 15,
        color: '#333',
        marginBottom: 8,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#E5E5EA',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#FAFAFA',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
    modalBtnCancel: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginRight: 8,
    },
    modalBtnTextCancel: {
        fontSize: 16,
        color: '#FF3B30',
        fontWeight: '500',
    },
    modalBtnSave: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    modalBtnTextSave: {
        fontSize: 16,
        color: '#FFF',
        fontWeight: '600',
    }
});