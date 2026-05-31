import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchUserData } from '../utils/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { getEstronMonthRange, getEstronWeeks } from '../utils/dateUtils';
import { Ionicons } from '@expo/vector-icons';
import { getScheduleSettings, getTargetMinutesForDate } from '../utils/schedule';

// Thuật toán làm tròn và quy đổi tránh Floating Point Error
const floorTo3 = (num: number): number => {
    return Math.floor(num * 1000) / 1000;
};

const toInt = (num: number): number => {
    return Math.round(num * 1000);
};

export default function CongTuanScreen({ navigation }: any) {
    const [loading, setLoading] = useState(true);
    const [weeksData, setWeeksData] = useState<any[]>([]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const userDataString = await AsyncStorage.getItem('user');
            if (!userDataString) return;
            const user = JSON.parse(userDataString);
            const phone = user.phone;
            if (!phone) return;

            const [userData, schedule] = await Promise.all([
                fetchUserData(user),
                getScheduleSettings()
            ]);
            
            // Tính toán tuần Estron hiện tại
            const { startDate, endDate, estronMonth } = getEstronMonthRange();
            
            navigation.setOptions({
                headerTitleText: (
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitleLeft}>Công tuần tháng {estronMonth}</Text>
                    </View>
                )
            });

            const weeks = getEstronWeeks(startDate, endDate);
            
            const nangSuat = userData?.nangSuat || {};
            const congDoanList = userData?.congDoan || [];
            const dinhMucMap: { [key: string]: number } = {};
            congDoanList.forEach((cd: any) => {
                dinhMucMap[cd.maCongDoan] = cd.dinhMuc;
            });
            
            const formattedWeeks = weeks.map(week => {
                const stageIntSums: { [key: string]: number } = {};
                let supportIntSum = 0;
                let weeklyExpectedWork = 0;
                let hasAnyData = false;
                
                week.days.forEach(dateStr => {
                    const dayData = nangSuat[dateStr];
                    const sanLuong = dayData?.sanLuong || [];
                    const hasData = dayData !== undefined;
                    
                    const [yyyy, mm, dd] = dateStr.split('-').map(Number);
                    const dateObj = new Date(yyyy, mm - 1, dd);
                    const dayOfWeek = dateObj.getDay();
                    const isSunday = dayOfWeek === 0;
                    
                    if (isSunday && !hasData) {
                        return; // Tự động ẩn ngày Chủ nhật nếu không có dữ liệu
                    }
                    
                    if (hasData) {
                        hasAnyData = true;
                    }
                    
                    const hoTroMinutes = hasData ? (Number(dayData.thoiGianHoTro) || 0) : 0;
                    const defaultThucHien = getTargetMinutesForDate(dateObj, schedule);
                    const thucHien = hasData ? (dayData.thoiGianThucHien !== undefined ? Number(dayData.thoiGianThucHien) : defaultThucHien) : 0;
                    
                    // expected work for this day
                    const tongThoiGianThucHienTrongNgay = thucHien + hoTroMinutes;
                    const expectedCong = tongThoiGianThucHienTrongNgay / 480;
                    if (hasData) {
                        weeklyExpectedWork += expectedCong;
                    }
                    
                    // 1. Tính Công sản phẩm mỗi ngày
                    const dayGroupedQuantities: { [key: string]: number } = {};
                    sanLuong.forEach((item: any) => {
                        dayGroupedQuantities[item.maCongDoan] = (dayGroupedQuantities[item.maCongDoan] || 0) + item.soLuong;
                    });
                    
                    Object.keys(dayGroupedQuantities).forEach(ma => {
                        const soLuong = dayGroupedQuantities[ma];
                        const dinhMuc = dinhMucMap[ma] || 1;
                        const congSanPhamNgay = soLuong / dinhMuc;
                        const congSanPhamNgayFloor = floorTo3(congSanPhamNgay);
                        const congSanPhamNgayInt = toInt(congSanPhamNgayFloor);
                        
                        stageIntSums[ma] = (stageIntSums[ma] || 0) + congSanPhamNgayInt;
                    });
                    
                    // 2. Tính Công hỗ trợ mỗi ngày
                    if (hoTroMinutes > 0) {
                        const congHoTroNgay = hoTroMinutes / 480;
                        const congHoTroNgayFloor = floorTo3(congHoTroNgay);
                        const congHoTroNgayInt = toInt(congHoTroNgayFloor);
                        
                        supportIntSum += congHoTroNgayInt;
                    }
                });
                
                // Tạo danh sách các row hiển thị cho tuần
                const stageRows: Array<{ label: string; valueStr: string; type: 'sanluong' | 'hotro' }> = Object.keys(stageIntSums).map(ma => {
                    const totalInt = stageIntSums[ma];
                    const workValue = totalInt / 1000;
                    return {
                        label: ma,
                        valueStr: workValue.toFixed(3),
                        type: 'sanluong' as const
                    };
                });
                
                // Thêm row hỗ trợ dưới cùng nếu có
                if (supportIntSum > 0) {
                    const supportValue = supportIntSum / 1000;
                    stageRows.push({
                        label: 'Hổ trợ',
                        valueStr: supportValue.toFixed(3),
                        type: 'hotro' as const
                    });
                }
                
                // Tính tổng công tuần
                const totalStagesInt = Object.values(stageIntSums).reduce((a, b) => a + b, 0);
                const totalWeekInt = totalStagesInt + supportIntSum;
                const tongCongTuan = totalWeekInt / 1000;
                
                const isTargetMet = tongCongTuan >= weeklyExpectedWork;
                const statusColor = isTargetMet ? '#34C759' : '#FF3B30';
                
                const formatDayMonth = (d: Date) => {
                    const dd = d.getDate();
                    const mm = d.getMonth() + 1;
                    return `${dd < 10 ? '0' + dd : dd}/${mm < 10 ? '0' + mm : mm}`;
                };
                
                const rangeStr = `${formatDayMonth(week.startDate)} - ${formatDayMonth(week.endDate)}`;
                
                return {
                    weekIndex: week.weekIndex,
                    rangeStr,
                    tongCongTuanStr: tongCongTuan.toFixed(3),
                    weeklyExpectedWork,
                    weeklyExpectedWorkStr: weeklyExpectedWork.toFixed(1),
                    statusColor,
                    isUp: isTargetMet,
                    hasAnyData,
                    rows: stageRows
                };
            });
            
            setWeeksData(formattedWeeks);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu công tuần:", error);
        } finally {
            setLoading(false);
        }
    }, [navigation]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    return (
        <View style={styles.screen}>
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : weeksData.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyMessage}>Chưa có dữ liệu tuần</Text>
                </View>
            ) : (
                <ScrollView 
                    style={styles.scrollView} 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                >
                    {weeksData.map(week => {
                        return (
                            <View key={week.weekIndex} style={styles.card}>
                                {/* Header Tuần */}
                                <View style={styles.weekHeader}>
                                    <View style={styles.weekHeaderLeft}>
                                        <Text style={styles.weekTitle}>
                                            Tuần {week.weekIndex} <Text style={styles.weekRange}>({week.rangeStr})</Text>
                                        </Text>
                                    </View>
                                    <View style={styles.weekHeaderRight}>
                                        {week.hasAnyData && (
                                            <View style={styles.congContainer}>
                                                <Ionicons
                                                    name={week.isUp ? "caret-up" : "caret-down"}
                                                    size={16}
                                                    color={week.statusColor}
                                                    style={styles.congIcon}
                                                />
                                                <Text style={styles.congText}>
                                                    <Text style={styles.boldText}>{week.tongCongTuanStr}</Text>
                                                    {week.weeklyExpectedWork > 0 && (
                                                        <Text style={styles.thucHienText}>/{week.weeklyExpectedWorkStr}</Text>
                                                    )}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                                
                                {/* Rows - các mã công đoạn và hỗ trợ trong tuần */}
                                <View style={styles.rowsList}>
                                    {week.rows.map((row: any, idx: number) => {
                                        return (
                                            <View 
                                                key={row.label} 
                                                style={[
                                                    styles.itemRow,
                                                    idx === week.rows.length - 1 && styles.itemRowLast
                                                ]}
                                            >
                                                <View style={styles.col1} />
                                                <View style={styles.col2}>
                                                    <Text style={styles.itemMa}>{row.label}</Text>
                                                </View>
                                                <View style={styles.col3}>
                                                    <Text style={styles.itemSoLuong}>
                                                        {row.valueStr}
                                                        <Text style={styles.unitText}> công</Text>
                                                    </Text>
                                                </View>
                                            </View>
                                        );
                                    })}
                                    {week.rows.length === 0 && (
                                        <View style={[styles.itemRow, styles.itemRowLast]}>
                                            <View style={styles.col1} />
                                            <View style={styles.col2}>
                                                <Text style={styles.emptyText}>Không có sản lượng</Text>
                                            </View>
                                            <View style={styles.col3} />
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            )}
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
    weekHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#F9F9F9',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#C6C6C8',
    },
    weekHeaderLeft: {
        flexDirection: 'column',
    },
    weekHeaderRight: {
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    weekTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000000',
    },
    weekRange: {
        fontSize: 14,
        color: '#8E8E93',
        fontWeight: '500',
        fontStyle: 'italic',
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
    boldText: {
        fontWeight: '600',
    },
    thucHienText: {
        fontSize: 12,
        fontWeight: '400',
        color: '#8E8E93',
    },
    rowsList: {
        paddingVertical: 4,
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
        width: 130,
        paddingRight: 16,
        alignItems: 'flex-end',
        justifyContent: 'center',
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
});
