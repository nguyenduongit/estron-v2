import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Alert, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { fetchUserData, saveUserData, fetchMonthlySchedule } from '../utils/supabase';
import { getEstronMonthRange, formatLocalDateStr, getLocalISOString } from '../utils/dateUtils';

interface CongDoan {
    maCongDoan: string;
    dinhMuc: number;
}

export default function NhapLieuScreen() {
    const navigation = useNavigation<any>();
    const [user, setUser] = useState<any>(null);
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // User Data State
    const [danhSachCongDoan, setDanhSachCongDoan] = useState<CongDoan[]>([]);
    const [maCongDoan, setMaCongDoan] = useState('');
    const [soLuong, setSoLuong] = useState('');

    // Support time and monthly schedule states
    const [thoiGianHoTro, setThoiGianHoTro] = useState('0');
    const [monthlySchedule, setMonthlySchedule] = useState<Record<string, number | string>>({});

    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [fullData, setFullData] = useState<any>(null);

    // Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newMa, setNewMa] = useState('');
    const [newDinhMuc, setNewDinhMuc] = useState('');

    // Custom Picker & Edit Stage Modal States
    const [showDropdown, setShowDropdown] = useState(false);
    const [showEditStageModal, setShowEditStageModal] = useState(false);
    const [editingStageItem, setEditingStageItem] = useState<CongDoan | null>(null);
    const [editStageMa, setEditStageMa] = useState('');
    const [editStageDinhMuc, setEditStageDinhMuc] = useState('');

    const loadUserData = useCallback(async (targetDate: Date) => {
        setIsLoadingData(true);
        try {
            const userDataString = await AsyncStorage.getItem('user');
            if (userDataString) {
                const u = JSON.parse(userDataString);
                setUser(u);

                const data: any = await fetchUserData(u, targetDate);

                // Fetch monthly schedule config
                const { startDate, endDate, estronMonth, estronYear } = getEstronMonthRange(targetDate);
                const sched = await fetchMonthlySchedule(u.id, estronYear, estronMonth, startDate, endDate);
                if (sched) {
                    setMonthlySchedule(sched);
                }

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
                    const initialData = { congDoan: [], nangSuat: {} };
                    setFullData(initialData);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingData(false);
        }
    }, []);

    const { estronMonth, estronYear } = getEstronMonthRange(date);
    const estronMonthKey = `${estronYear}-${estronMonth}`;

    // Reload when screen gains focus or month changes
    useFocusEffect(
        useCallback(() => {
            loadUserData(date);
        }, [estronMonthKey, loadUserData])
    );

    // Load initial support time from DB when selected date changes
    useEffect(() => {
        const dateStr = formatLocalDateStr(date);
        if (fullData && fullData.nangSuat && fullData.nangSuat[dateStr]) {
            const dataForDate = fullData.nangSuat[dateStr];
            setThoiGianHoTro(dataForDate.thoiGianHoTro !== undefined ? dataForDate.thoiGianHoTro.toString() : '0');
        } else {
            setThoiGianHoTro('0');
        }
    }, [date, fullData]);

    // Derive calculated thoiGianThucHien = (Scheduled working minutes) - (Support minutes)
    const getCalculatedThucHien = () => {
        const dateStr = formatLocalDateStr(date);
        let scheduledMins = 480; // default fallback

        if (monthlySchedule && monthlySchedule[dateStr] !== undefined) {
            const val = monthlySchedule[dateStr];
            scheduledMins = val === 'Nghỉ' ? 0 : Number(val);
        } else {
            // Fallback defaults
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 0) scheduledMins = 0;
            else if (dayOfWeek === 6) scheduledMins = 240;
            else scheduledMins = 480;
        }

        const supportMins = Number(thoiGianHoTro) || 0;
        return Math.max(0, scheduledMins - supportMins);
    };

    const thoiGianThucHien = getCalculatedThucHien();

    const showToast = () => {
        const message = "Thời gian thực hiện được tính tự động từ Lịch trình tháng. Vui lòng chỉnh sửa trong Lịch trình tháng.";
        if (Platform.OS === 'web') {
            const goToSchedule = window.confirm(message + "\n\nBạn có muốn di chuyển đến Lịch trình tháng?");
            if (goToSchedule) {
                navigation.navigate('LichTrinh');
            }
        } else {
            Alert.alert(
                "Thông báo",
                message,
                [
                    { text: "Hủy", style: "cancel" },
                    {
                        text: "Đến Lịch trình tháng",
                        onPress: () => {
                            navigation.navigate('LichTrinh');
                        }
                    }
                ]
            );
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

        const updatedData = { ...fullData, congDoan: updatedList };
        setFullData(updatedData);

        try {
            await saveUserData(user, updatedData);
        } catch (e) {
            console.error("Save cong doan error:", e);
        }

        setShowAddModal(false);
        setNewMa('');
        setNewDinhMuc('');
    };

    const handleLongPressStage = (item: CongDoan) => {
        setShowDropdown(false);
        setEditingStageItem(item);
        setEditStageMa(item.maCongDoan);
        setEditStageDinhMuc(item.dinhMuc.toString());
        setShowEditStageModal(true);
    };

    const handleUpdateStage = async () => {
        if (!editingStageItem) return;
        if (!editStageMa || !editStageDinhMuc) {
            Platform.OS === 'web' ? alert('Vui lòng nhập đủ thông tin') : Alert.alert('Lỗi', 'Vui lòng nhập đủ thông tin');
            return;
        }

        const norm = Number(editStageDinhMuc);
        if (isNaN(norm)) {
            Platform.OS === 'web' ? alert('Định mức phải là số') : Alert.alert('Lỗi', 'Định mức phải là số');
            return;
        }

        const updatedList = danhSachCongDoan.map((cd) => {
            if (cd.maCongDoan === editingStageItem.maCongDoan) {
                return { maCongDoan: editStageMa.trim(), dinhMuc: norm };
            }
            return cd;
        });

        setDanhSachCongDoan(updatedList);
        if (maCongDoan === editingStageItem.maCongDoan) {
            setMaCongDoan(editStageMa.trim());
        }

        const updatedData = { ...fullData, congDoan: updatedList };
        setFullData(updatedData);

        try {
            await saveUserData(user, updatedData);
            if (Platform.OS === 'web') {
                alert('Cập nhật công đoạn thành công!');
            } else {
                Alert.alert('Thành công', 'Đã cập nhật công đoạn!');
            }
        } catch (e) {
            console.error("Update cong doan error:", e);
        }

        setShowEditStageModal(false);
        setEditingStageItem(null);
    };

    const handleDeleteStage = async () => {
        if (!editingStageItem) return;

        const performDelete = async () => {
            const updatedList = danhSachCongDoan.filter(
                (cd) => cd.maCongDoan !== editingStageItem.maCongDoan
            );

            setDanhSachCongDoan(updatedList);
            if (maCongDoan === editingStageItem.maCongDoan) {
                if (updatedList.length > 0) {
                    setMaCongDoan(updatedList[0].maCongDoan);
                } else {
                    setMaCongDoan('');
                }
            }

            const updatedData = { ...fullData, congDoan: updatedList };
            setFullData(updatedData);

            try {
                await saveUserData(user, updatedData);
                if (Platform.OS === 'web') {
                    alert('Xóa công đoạn thành công!');
                } else {
                    Alert.alert('Thành công', 'Đã xóa công đoạn!');
                }
            } catch (e) {
                console.error("Delete cong doan error:", e);
            }

            setShowEditStageModal(false);
            setEditingStageItem(null);
        };

        const message = `Bạn có chắc chắn muốn xóa công đoạn "${editingStageItem.maCongDoan}" không?`;

        if (Platform.OS === 'web') {
            const confirmDelete = window.confirm(message);
            if (confirmDelete) {
                await performDelete();
            }
        } else {
            Alert.alert(
                "Xác nhận xóa",
                message,
                [
                    { text: "Hủy", style: "cancel" },
                    { text: "Xóa", style: "destructive", onPress: performDelete }
                ]
            );
        }
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
            const dateStr = formatLocalDateStr(date);
            const updatedData = {
                ...fullData,
                nangSuat: {
                    ...(fullData?.nangSuat || {}),
                    [dateStr]: {
                        thoiGianThucHien: thoiGianThucHien,
                        thoiGianHoTro: thoiGianHoTro === '' ? 0 : Number(thoiGianHoTro),
                        sanLuong: [
                            ...(fullData?.nangSuat?.[dateStr]?.sanLuong || []),
                            {
                                maCongDoan,
                                soLuong: Number(soLuong),
                                timestamp: getLocalISOString()
                            }
                        ]
                    }
                }
            };

            await saveUserData(user, updatedData);
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
            <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
            >
                <View style={styles.formGroup}>
                    {/* Ngày tháng */}
                    <View style={styles.row}>
                        <Text style={styles.label}>Ngày</Text>
                        {Platform.OS === 'web' ? (
                            <View style={[styles.valueContainer, { position: 'relative' }]}>
                                <Text style={styles.dateText}>{formatDate(date)}</Text>
                                <input
                                    type="date"
                                    value={formatLocalDateStr(date)}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            const [y, m, d] = e.target.value.split('-').map(Number);
                                            setDate(new Date(y, m - 1, d));
                                        }
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
                    <View style={[styles.row, { zIndex: 10 }]}>
                        <Text style={styles.label}>Công đoạn</Text>
                        <View style={styles.valueContainer}>
                            {danhSachCongDoan.length > 0 ? (
                                <View style={{ position: 'relative', zIndex: 11, height: 36, marginRight: 4, justifyContent: 'center' }}>
                                    <TouchableOpacity
                                        style={[
                                            styles.pickerTouch,
                                            showDropdown && styles.pickerTouchOpen
                                        ]}
                                        onPress={() => setShowDropdown(!showDropdown)}
                                    >
                                        <Text style={styles.pickerText}>{maCongDoan || 'Chọn mã'}</Text>
                                        <Ionicons name={showDropdown ? "chevron-up" : "chevron-down"} size={16} color="#007AFF" style={styles.chevronIcon} />
                                    </TouchableOpacity>

                                    {showDropdown && (
                                        <View style={styles.dropdownListContainer}>
                                            <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled={true}>
                                                {danhSachCongDoan.map((item) => (
                                                    <TouchableOpacity
                                                        key={item.maCongDoan}
                                                        style={[
                                                            styles.dropdownItem,
                                                            maCongDoan === item.maCongDoan && styles.dropdownItemActive
                                                        ]}
                                                        onPress={() => {
                                                            setMaCongDoan(item.maCongDoan);
                                                            setShowDropdown(false);
                                                        }}
                                                        onLongPress={() => {
                                                            setShowDropdown(false);
                                                            handleLongPressStage(item);
                                                        }}
                                                        delayLongPress={500}
                                                    >
                                                        <Text style={[
                                                            styles.dropdownItemText,
                                                            maCongDoan === item.maCongDoan && styles.dropdownItemTextActive
                                                        ]}>
                                                            {item.maCongDoan}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    )}
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.pickerTouch}
                                    onPress={() => setShowAddModal(true)}
                                >
                                    <Text style={styles.pickerPlaceholder}>Chưa có mã</Text>
                                    <Ionicons name="add-circle" size={16} color="#8E8E93" style={styles.chevronIcon} />
                                </TouchableOpacity>
                            )}
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

                    <View style={styles.divider} />

                    {/* Thời gian thực hiện */}
                    <View style={styles.row}>
                        <Text style={styles.label}>Thời gian thực hiện</Text>
                        <TouchableOpacity onPress={showToast} style={styles.valueContainer}>
                            <TextInput
                                style={[styles.input, { color: '#8E8E93' }]}
                                value={thoiGianThucHien.toString()}
                                placeholder="Nhập phút"
                                placeholderTextColor="#C7C7CC"
                                editable={false}
                                pointerEvents="none"
                            />
                        </TouchableOpacity>
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

            {/* Modal Sửa/Xóa Công Đoạn */}
            <Modal visible={showEditStageModal} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Chỉnh sửa công đoạn</Text>

                        <View style={styles.modalInputGroup}>
                            <Text style={styles.modalLabel}>Mã công đoạn</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Ví dụ: 5.2"
                                placeholderTextColor="#C7C7CC"
                                value={editStageMa}
                                onChangeText={setEditStageMa}
                            />
                        </View>

                        <View style={styles.modalInputGroup}>
                            <Text style={styles.modalLabel}>Định mức</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Ví dụ: 1135"
                                placeholderTextColor="#C7C7CC"
                                value={editStageDinhMuc}
                                onChangeText={setEditStageDinhMuc}
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.modalActionsRow}>
                            <TouchableOpacity
                                style={styles.modalBtnDelete}
                                onPress={handleDeleteStage}
                            >
                                <Ionicons name="trash-outline" size={18} color="#FFF" style={{ marginRight: 4 }} />
                                <Text style={styles.modalBtnTextDelete}>Xóa</Text>
                            </TouchableOpacity>

                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <TouchableOpacity
                                    style={styles.modalBtnCancel}
                                    onPress={() => {
                                        setShowEditStageModal(false);
                                        setEditingStageItem(null);
                                    }}
                                >
                                    <Text style={styles.modalBtnTextCancel}>Hủy</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.modalBtnSave}
                                    onPress={handleUpdateStage}
                                >
                                    <Text style={styles.modalBtnTextSave}>Lưu</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
    },
    formGroup: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 50,
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
    pickerTouch: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 36,
        paddingHorizontal: 12,
        backgroundColor: '#E5F1FF',
        borderRadius: 8,
        minWidth: 100,
        borderWidth: 1,
        borderColor: '#B3D7FF',
    },
    pickerTouchOpen: {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        borderBottomWidth: 0,
    },
    pickerText: {
        fontSize: 17,
        color: '#007AFF',
        fontWeight: '600',
        marginRight: 4,
    },
    pickerPlaceholder: {
        fontSize: 17,
        color: '#8E8E93',
        marginRight: 4,
    },
    chevronIcon: {
        marginLeft: 2,
    },
    dropdownListContainer: {
        position: 'absolute',
        top: 35,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        borderWidth: 1,
        borderColor: '#B3D7FF',
        borderTopWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
        zIndex: 9999,
        overflow: 'hidden',
    },
    dropdownScrollView: {
        maxHeight: 200,
    },
    dropdownItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E5E5EA',
        backgroundColor: '#FFFFFF',
    },
    dropdownItemActive: {
        backgroundColor: '#E5F1FF',
    },
    dropdownItemText: {
        fontSize: 16,
        color: '#000000',
    },
    dropdownItemTextActive: {
        color: '#007AFF',
        fontWeight: '600',
    },
    modalActionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
    },
    modalBtnDelete: {
        backgroundColor: '#FF3B30',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalBtnTextDelete: {
        fontSize: 16,
        color: '#FFF',
        fontWeight: '600',
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
        marginTop: 16,
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
