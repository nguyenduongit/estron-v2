import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getEstronMonthRange, getEstronDays } from '../utils/dateUtils';

interface LichTrinhScreenProps {
    onClose: () => void;
}

export default function LichTrinhScreen({ onClose }: LichTrinhScreenProps) {
    const { startDate, endDate, estronMonth, estronYear } = getEstronMonthRange();
    const days = getEstronDays(startDate, endDate);

    // Calculate empty cells needed at the beginning of the grid
    // startDate.getDay() returns 0 for Sunday, 1 for Monday, ..., 6 for Saturday
    // We want Monday to be the first column (index 0), so we map:
    // Mon (1) -> 0, Tue (2) -> 1, ..., Sat (6) -> 5, Sun (0) -> 6
    const startDayOfWeek = startDate.getDay();
    const emptyCellsBefore = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const gridDays: string[] = Array(emptyCellsBefore).fill('');
    gridDays.push(...days);

    // Pad the end to fill the grid (either 35 or 42 cells depending on length)
    const totalCells = gridDays.length <= 35 ? 35 : 42;
    while (gridDays.length < totalCells) {
        gridDays.push('');
    }

    const isToday = (dateStr: string) => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return dateStr === `${yyyy}-${mm}-${dd}`;
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.backButton}>
                    <Ionicons name="close-outline" size={26} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Lịch trình tháng {estronMonth}/{estronYear}</Text>
                <View style={styles.headerRightPlaceholder} />
            </View>

            {/* Grid Container */}
            <View style={styles.container}>
                {/* Weekday Row */}
                <View style={styles.weekdayRow}>
                    {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((label, idx) => {
                        const isSaturday = label === 'T7';
                        const isSunday = label === 'CN';
                        return (
                            <Text
                                key={label}
                                style={[
                                    styles.weekdayText,
                                    isSaturday && styles.saturdayText,
                                    isSunday && styles.sundayText
                                ]}
                            >
                                {label}
                            </Text>
                        );
                    })}
                </View>

                {/* Days Grid */}
                <View style={styles.grid}>
                    {gridDays.map((dateStr, index) => {
                        if (dateStr) {
                            const [y, m, d] = dateStr.split('-').map(Number);
                            const isColSaturday = index % 7 === 5;
                            const isColSunday = index % 7 === 6;
                            const isCurrentToday = isToday(dateStr);

                            return (
                                <TouchableOpacity
                                    key={dateStr}
                                    style={[
                                        styles.cell,
                                        isCurrentToday && styles.todayCell
                                    ]}
                                >
                                    <Text style={[
                                        styles.cellText,
                                        isCurrentToday && styles.todayCellText,
                                        isColSaturday && !isCurrentToday && styles.saturdayText,
                                        isColSunday && !isCurrentToday && styles.sundayText
                                    ]}>
                                        {d}
                                    </Text>
                                </TouchableOpacity>
                            );
                        } else {
                            return (
                                <View key={`empty-${index}`} style={styles.emptyCell} />
                            );
                        }
                    })}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 56,
        backgroundColor: '#ffffff',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#C6C6C8',
    },
    backButton: {
        paddingVertical: 8,
        paddingRight: 16,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000000',
        textAlign: 'center',
        flex: 1,
    },
    headerRightPlaceholder: {
        width: 42,
    },
    container: {
        flex: 1,
        padding: 16,
        justifyContent: 'flex-start', // Align calendar to the top
    },
    weekdayRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingVertical: 8,
        marginBottom: 4,
    },
    weekdayText: {
        width: '13%',
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: '100%',
    },
    cell: {
        width: '13%',
        aspectRatio: 1,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#E5E5EA',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 6,
        ...Platform.select({
            ios: {
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
            web: {
                boxShadow: '0px 1px 3px rgba(0,0,0,0.1)',
            }
        }),
    },
    todayCell: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    emptyCell: {
        width: '13%',
        aspectRatio: 1,
        marginVertical: 6,
        backgroundColor: 'transparent',
    },
    cellText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
    },
    todayCellText: {
        color: '#ffffff',
    },
    sundayText: {
        color: '#FF3B30',
    },
    saturdayText: {
        color: '#FF9500',
    },
});
