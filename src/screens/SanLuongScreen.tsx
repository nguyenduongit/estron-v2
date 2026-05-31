import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Modal, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchUserData, saveUserData } from '../utils/supabase';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getEstronMonthRange, getEstronDays } from '../utils/dateUtils';
import { Ionicons } from '@expo/vector-icons';

export default function SanLuongScreen() {
    const navigation = useNavigation<any>();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [fullUserData, setFullUserData] = useState<any>(null);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editValue, setEditValue] = useState('');

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const userDataString = await AsyncStorage.getItem('user');
            if (!userDataString) return;
            const user = JSON.parse(userDataString);
            const phone = user.phone;
            if (!phone) return;

            const userData = await fetchUserData(user);
            setFullUserData(userData);

            // Tính toán tháng Estron hiện tại
            const { startDate, endDate, estronMonth } = getEstronMonthRange();
            const estronDays = getEstronDays(startDate, endDate);

            const nangSuat = userData?.nangSuat || {};
            const congDoanList = userData?.congDoan || [];
            const dinhMucMap: { [key: string]: number } = {};
            congDoanList.forEach((cd: any) => {
                dinhMucMap[cd.maCongDoan] = cd.dinhMuc;
            });

            let tongCongThangDaThucHien = 0;
            let tongThoiGianCanThucHienThang = 0;

            const formattedData = estronDays
                .map(dateStr => {
                    const dayData = nangSuat[dateStr];
                    const sanLuong = dayData?.sanLuong || [];
                    const hasData = dayData !== undefined;
                    
                    const [yyyy, mm, dd] = dateStr.split('-').map(Number);
                    const isSunday = new Date(yyyy, mm - 1, dd).getDay() === 0;

                    // Tự động ẩn các block ngày chủ nhật nếu không có dữ liệu
                    if (isSunday && !hasData) {
                        return null;
                    }

                    const isSaturday = new Date(yyyy, mm - 1, dd).getDay() === 6;
                    const defaultThucHien = isSunday ? 0 : (isSaturday ? 240 : 480);

                    const hoTro = hasData ? (Number(dayData.thoiGianHoTro) || 0) : 0;
                    const thucHien = hasData ? (dayData.thoiGianThucHien !== undefined ? Number(dayData.thoiGianThucHien) : defaultThucHien) : 0;

                    // Gom nhóm theo mã công đoạn và tính tổng số lượng
                    const groupedMap: { [key: string]: number } = {};
                    sanLuong.forEach((item: any) => {
                        groupedMap[item.maCongDoan] = (groupedMap[item.maCongDoan] || 0) + item.soLuong;
                    });

                    let congSanPham = 0;
                    const groupedArray = Object.keys(groupedMap).map(ma => {
                        const totalSoLuong = groupedMap[ma];
                        const dinhMuc = dinhMucMap[ma] || 1; // tránh chia cho 0
                        congSanPham += (totalSoLuong / dinhMuc);
                        return {
                            maCongDoan: ma,
                            totalSoLuong
                        };
                    });

                    // Tính công trong ngày
                    const tongCongNgay = (hoTro / 480) + congSanPham;
                    const tongThoiGianThucHienTrongNgay = thucHien + hoTro;
                    const expectedCong = tongThoiGianThucHienTrongNgay / 480;

                    let congColor = '#34C759'; // Xanh lá
                    if (expectedCong > tongCongNgay) {
                        congColor = '#FF3B30'; // Đỏ
                    }

                    const tongCongNgayDisplay = hasData ? tongCongNgay.toFixed(2) : null;

                    const shortDate = `${dd < 10 ? '0' + dd : dd}/${mm < 10 ? '0' + mm : mm}`;

                    const isUp = expectedCong <= tongCongNgay;

                    if (hasData) {
                        tongCongThangDaThucHien += tongCongNgay;
                        tongThoiGianCanThucHienThang += tongThoiGianThucHienTrongNgay;
                    }

                    return {
                        dateStr,
                        shortDate,
                        items: groupedArray,
                        hoTro: hasData ? dayData.thoiGianHoTro : undefined,
                        tongThoiGianThucHienTrongNgay: hasData ? tongThoiGianThucHienTrongNgay : undefined,
                        tongCongNgayDisplay,
                        congColor,
                        isUp,
                        isSunday
                    };
                })
                .filter((day): day is NonNullable<typeof day> => day !== null);
            setData(formattedData);

            const tongCongThangDaThucHienStr = tongCongThangDaThucHien.toFixed(2);
            const tongCongThangCanThucHien = tongThoiGianCanThucHienThang / 480;
            const tongCongThangCanThucHienStr = tongCongThangCanThucHien.toFixed(1);

            const isTargetMet = tongCongThangDaThucHien >= tongCongThangCanThucHien;
            const valueColor = isTargetMet ? '#34C759' : '#FF3B30';

            navigation.setOptions({
                headerTitleText: (
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitleLeft}>Sản lượng tháng {estronMonth}</Text>
                        <View style={[styles.headerTitleRightContainer, { backgroundColor: valueColor }]}>
                            <Text style={styles.headerTitleRight}>
                                {tongCongThangDaThucHienStr}/{tongCongThangCanThucHienStr}
                            </Text>
                        </View>
                    </View>
                )
            });
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu sản lượng:", error);
        } finally {
            setLoading(false);
        }
    }, [navigation]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const openEditModal = (day: any, item: any, type: 'sanluong' | 'hotro') => {
        setEditingItem({ day, item, type });
        setEditValue(type === 'sanluong' ? item.totalSoLuong.toString() : item.hoTro.toString());
        setEditModalVisible(true);
    };

    const handleUpdate = async () => {
        if (!fullUserData || !editingItem) return;

        const newValue = Number(editValue);
        if (isNaN(newValue)) {
            if (Platform.OS === 'web') {
                alert("Vui lòng nhập số hợp lệ");
            } else {
                Alert.alert("Lỗi", "Vui lòng nhập số hợp lệ");
            }
            return;
        }

        const dateStr = editingItem.day.dateStr;
        const updatedUserData = { ...fullUserData };

        if (editingItem.type === 'sanluong') {
            // Cập nhật số lượng của mã công đoạn
            const sanLuongList = updatedUserData.nangSuat[dateStr].sanLuong;
            // Vì sanLuong có thể chứa nhiều dòng cùng mã (trước khi grouped), 
            // nên ta cần logic để cập nhật hoặc gộp. Để đơn giản, ta sẽ gán giá trị mới cho mã này.
            // Loại bỏ các dòng cũ của mã này
            const filtered = sanLuongList.filter((i: any) => i.maCongDoan !== editingItem.item.maCongDoan);
            // Thêm 1 dòng mới với tổng số lượng mới
            filtered.push({ maCongDoan: editingItem.item.maCongDoan, soLuong: newValue });
            updatedUserData.nangSuat[dateStr].sanLuong = filtered;
        } else {
            // Cập nhật Hổ trợ
            updatedUserData.nangSuat[dateStr].thoiGianHoTro = newValue;
        }

        try {
            setLoading(true);
            const userString = await AsyncStorage.getItem('user');
            const user = JSON.parse(userString!);
            await saveUserData(user, updatedUserData);
            setEditModalVisible(false);
            loadData();
        } catch (e) {
            console.error(e);
            if (Platform.OS === 'web') {
                alert("Không thể cập nhật dữ liệu");
            } else {
                Alert.alert("Lỗi", "Không thể cập nhật dữ liệu");
            }
            setLoading(false);
        }
    };

    const performDelete = async () => {
        if (!fullUserData || !editingItem) return;
        const dateStr = editingItem.day.dateStr;
        const updatedUserData = { ...fullUserData };

        if (editingItem.type === 'sanluong') {
            const filtered = updatedUserData.nangSuat[dateStr].sanLuong.filter(
                (i: any) => i.maCongDoan !== editingItem.item.maCongDoan
            );
            updatedUserData.nangSuat[dateStr].sanLuong = filtered;
        } else {
            updatedUserData.nangSuat[dateStr].thoiGianHoTro = 0;
        }

        try {
            setLoading(true);
            const userString = await AsyncStorage.getItem('user');
            const user = JSON.parse(userString!);
            await saveUserData(user, updatedUserData);
            setEditModalVisible(false);
            loadData();
        } catch (e) {
            console.error(e);
            if (Platform.OS === 'web') {
                alert("Không thể xóa dữ liệu");
            } else {
                Alert.alert("Lỗi", "Không thể xóa dữ liệu");
            }
            setLoading(false);
        }
    };

    const handleDelete = () => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm("Bạn có chắc chắn muốn xóa dữ liệu này không?");
            if (confirmed) {
                performDelete();
            }
        } else {
            Alert.alert(
                "Xác nhận xóa",
                "Bạn có chắc chắn muốn xóa dữ liệu này không?",
                [
                    { text: "Hủy", style: "cancel" },
                    {
                        text: "Xóa",
                        style: "destructive",
                        onPress: performDelete
                    }
                ]
            );
        }
    };

    return (
        <View style={styles.screen}>
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : data.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyMessage}>Chưa có dữ liệu sản lượng</Text>
                </View>
            ) : (
                <ScrollView 
                    style={styles.scrollView} 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                >
                    {data.map(day => (
                        <View key={day.dateStr} style={styles.card}>
                            <View style={styles.dateHeader}>
                                <View style={styles.col1}>
                                    <Text style={styles.dateText}>{day.shortDate}</Text>
                                </View>
                                <View style={styles.col2}>
                                    {/* Column 2 header is empty for now */}
                                </View>
                                <View style={styles.col3}>
                                    {day.tongCongNgayDisplay !== null && (
                                        <View style={styles.congContainer}>
                                            <Ionicons
                                                name={day.isUp ? "caret-up" : "caret-down"}
                                                size={16}
                                                color={day.congColor}
                                                style={styles.congIcon}
                                            />
                                            <Text style={styles.congText}>
                                                <Text style={styles.boldText}>{day.tongCongNgayDisplay}</Text>
                                                {day.tongThoiGianThucHienTrongNgay !== undefined && (
                                                    <Text style={styles.thucHienText}>/{day.tongThoiGianThucHienTrongNgay}</Text>
                                                )}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                            <View style={styles.itemsContainer}>
                                {day.items.map((item: any, index: number) => {
                                    return (
                                        <Pressable
                                            key={item.maCongDoan}
                                            onLongPress={() => openEditModal(day, item, 'sanluong')}
                                            style={({ pressed }) => [
                                                styles.itemRow,
                                                index === day.items.length - 1 && (!day.hoTro || day.hoTro <= 0) && styles.itemRowLast,
                                                pressed && { backgroundColor: '#F2F2F7' }
                                            ]}
                                        >
                                            <View style={styles.col1} />
                                            <View style={styles.col2}>
                                                <Text style={styles.itemMa}>{item.maCongDoan}</Text>
                                            </View>
                                            <View style={styles.col3}>
                                                <Text style={styles.itemSoLuong}>
                                                    {item.totalSoLuong}
                                                    <Text style={styles.unitText}> pcs</Text>
                                                </Text>
                                            </View>
                                        </Pressable>
                                    );
                                })}
                                {day.items.length === 0 && (
                                    <View style={styles.itemRow}>
                                        <View style={styles.col1} />
                                        <View style={styles.col2}>
                                            <Text style={styles.emptyText}>Không có sản lượng</Text>
                                        </View>
                                        <View style={styles.col3} />
                                    </View>
                                )}
                                {day.hoTro !== undefined && Number(day.hoTro) > 0 && (
                                    <Pressable
                                        onLongPress={() => openEditModal(day, { hoTro: day.hoTro }, 'hotro')}
                                        style={({ pressed }) => [
                                            styles.itemRow,
                                            styles.itemRowLast,
                                            pressed && { backgroundColor: '#F2F2F7' }
                                        ]}
                                    >
                                        <View style={styles.col1} />
                                        <View style={styles.col2}>
                                            <Text style={styles.itemMa}>Hổ trợ</Text>
                                        </View>
                                        <View style={styles.col3}>
                                            <Text style={styles.itemSoLuong}>
                                                {day.hoTro}
                                                <Text style={styles.unitText}> phút</Text>
                                            </Text>
                                        </View>
                                    </Pressable>
                                )}
                            </View>
                        </View>
                    ))}
                </ScrollView>
            )}

            <Modal
                animationType="fade"
                transparent={true}
                visible={editModalVisible}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setEditModalVisible(false)}
                >
                    <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingItem?.type === 'sanluong' ? `Sửa: ${editingItem.item.maCongDoan}` : 'Sửa Hổ trợ'}
                            </Text>
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>
                                {editingItem?.type === 'sanluong' ? 'Số lượng (pcs)' : 'Thời gian (phút)'}
                            </Text>
                            <TextInput
                                style={styles.textInput}
                                value={editValue}
                                onChangeText={setEditValue}
                                keyboardType="numeric"
                                autoFocus
                                selectTextOnFocus
                            />
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.deleteButton]}
                                onPress={handleDelete}
                            >
                                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                <Text style={styles.deleteButtonText}>Xóa</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.updateButton]}
                                onPress={handleUpdate}
                            >
                                <Text style={styles.updateButtonText}>Cập nhật</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyMessage: {
        fontSize: 17,
        color: '#8E8E93',
        fontWeight: '400',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 16,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        marginHorizontal: 16,
        marginBottom: 16,
        overflow: 'hidden',
    },
    dateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        backgroundColor: '#F9F9F9',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#C6C6C8',
    },
    col1: {
        width: '25%',
        paddingLeft: 16,
        justifyContent: 'center',
    },
    col2: {
        flex: 1,
        justifyContent: 'center',
    },
    col3: {
        width: 100,
        paddingRight: 16,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    dateText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000000',
    },
    boldText: {
        fontWeight: '600',
    },
    congContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    congIcon: {
        marginRight: 4,
    },
    congText: {
        fontSize: 16,
        color: '#000000',
    },
    thucHienText: {
        fontSize: 12,
        fontWeight: '400',
        color: '#8E8E93',
    },
    itemsContainer: {
        // removed paddingLeft: 16 to handle it in col1
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#C6C6C8',
    },
    itemRowLast: {
        borderBottomWidth: 0,
    },
    itemMa: {
        fontSize: 17,
        color: '#000000',
    },
    itemSoLuong: {
        fontSize: 16,
        color: '#007AFF',
    },
    unitText: {
        fontSize: 12,
        fontStyle: 'italic',
        color: '#8E8E93',
        fontWeight: '400',
    },
    emptyText: {
        fontSize: 17,
        color: '#8E8E93',
        fontStyle: 'italic',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        width: '85%',
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000000',
    },
    inputWrapper: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: '#F2F2F7',
        borderRadius: 8,
        padding: 12,
        fontSize: 17,
        color: '#000000',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        height: 48,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    updateButton: {
        backgroundColor: '#007AFF',
    },
    updateButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
    deleteButton: {
        backgroundColor: '#FFF5F5',
        borderWidth: 1,
        borderColor: '#FF3B30',
    },
    deleteButtonText: {
        color: '#FF3B30',
        fontSize: 17,
        fontWeight: '600',
        marginLeft: 4,
    },
    headerTitleContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    headerTitleLeft: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    headerTitleRightContainer: {
        position: 'absolute',
        right: 8,
        padding: 4,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleRight: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});