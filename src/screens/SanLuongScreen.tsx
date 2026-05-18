import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchUserData } from '../utils/blobStorage';
import { useFocusEffect } from '@react-navigation/native';
import { getEstronMonthRange, getEstronDays } from '../utils/dateUtils';

export default function SanLuongScreen() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const userDataString = await AsyncStorage.getItem('user');
            if (!userDataString) return;
            const user = JSON.parse(userDataString);
            const phone = user.phone;
            if (!phone) return;

            const userData = await fetchUserData(phone);
            
            // Tính toán tháng Estron hiện tại
            const { startDate, endDate, estronMonth } = getEstronMonthRange();
            const estronDays = getEstronDays(startDate, endDate);
            
            const nangSuat = userData?.nangSuat || {};
            
            const formattedData = estronDays.map(dateStr => {
                const dayData = nangSuat[dateStr];
                const sanLuong = dayData?.sanLuong || [];
                
                // Gom nhóm theo mã công đoạn và tính tổng số lượng
                const groupedMap: { [key: string]: number } = {};
                sanLuong.forEach((item: any) => {
                    groupedMap[item.maCongDoan] = (groupedMap[item.maCongDoan] || 0) + item.soLuong;
                });
                
                const groupedArray = Object.keys(groupedMap).map(ma => ({
                    maCongDoan: ma,
                    totalSoLuong: groupedMap[ma]
                }));
                
                const [yyyy, mm, dd] = dateStr.split('-').map(Number);
                const formattedDate = `Ngày ${dd} thg ${mm}, ${yyyy}`;
                
                return {
                    dateStr,
                    formattedDate,
                    items: groupedArray
                };
            });
            setData(formattedData);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu sản lượng:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Sản lượng</Text>
            </View>
            
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : data.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyMessage}>Chưa có dữ liệu sản lượng</Text>
                </View>
            ) : (
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                    {data.map(day => (
                        <View key={day.dateStr} style={styles.card}>
                            <View style={styles.dateHeader}>
                                <Text style={styles.dateText}>{day.formattedDate}</Text>
                            </View>
                            <View style={styles.itemsContainer}>
                                {day.items.map((item, index) => (
                                    <View 
                                        key={item.maCongDoan} 
                                        style={[
                                            styles.itemRow, 
                                            index === day.items.length - 1 && styles.itemRowLast
                                        ]}
                                    >
                                        <Text style={styles.itemMa}>Công đoạn: {item.maCongDoan}</Text>
                                        <Text style={styles.itemSoLuong}>{item.totalSoLuong}</Text>
                                    </View>
                                ))}
                                {day.items.length === 0 && (
                                    <Text style={styles.emptyText}>Không có sản lượng</Text>
                                )}
                            </View>
                        </View>
                    ))}
                </ScrollView>
            )}
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F9F9F9',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#C6C6C8',
    },
    dateText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000000',
    },
    itemsContainer: {
        paddingLeft: 16,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingRight: 16,
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
        fontSize: 17,
        color: '#007AFF',
        fontWeight: '600',
    },
    emptyText: {
        fontSize: 17,
        color: '#8E8E93',
        paddingVertical: 12,
        fontStyle: 'italic',
    },
});