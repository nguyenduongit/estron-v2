import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Platform,
    ActivityIndicator,
    Modal,
    TextInput,
    Alert,
    Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getEstronMonthRange, getEstronDays } from '../utils/dateUtils';
import { fetchMonthlySchedule, saveMonthlySchedule } from '../utils/supabase';

interface LichTrinhScreenProps {
    onClose: () => void;
}

export default function LichTrinhScreen({ onClose }: LichTrinhScreenProps) {
    const { startDate, endDate, estronMonth, estronYear } = getEstronMonthRange();
    const days = getEstronDays(startDate, endDate);

    // App state
    const [user, setUser] = useState<any>(null);
    const [schedule, setSchedule] = useState<Record<string, number | string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Edit Modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingDate, setEditingDate] = useState('');
    const [isDayOff, setIsDayOff] = useState(false);
    const [workMinutes, setWorkMinutes] = useState('480');

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

    useEffect(() => {
        const loadData = async () => {
            try {
                const userStr = await AsyncStorage.getItem('user');
                if (userStr) {
                    const parsedUser = JSON.parse(userStr);
                    setUser(parsedUser);
                    
                    const monthlySchedule = await fetchMonthlySchedule(
                        parsedUser.id,
                        estronYear,
                        estronMonth,
                        startDate,
                        endDate
                    );
                    if (monthlySchedule) {
                        setSchedule(monthlySchedule);
                    }
                }
            } catch (err) {
                console.error("Error loading schedule:", err);
            } finally {
                setLoading(false);
            }
        };
        
        loadData();
    }, []);

    const isToday = (dateStr: string) => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return dateStr === `${yyyy}-${mm}-${dd}`;
    };

    const formatHeaderDate = (dateStr: string) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `ngày ${d}/${m}/${y}`;
    };

    const openEditModal = (dateStr: string) => {
        const val = schedule[dateStr];
        setEditingDate(dateStr);
        if (val === 'Nghỉ') {
            setIsDayOff(true);
            setWorkMinutes('480');
        } else {
            setIsDayOff(false);
            setWorkMinutes(String(val ?? '480'));
        }
        setShowEditModal(true);
    };

    const handleSave = async () => {
        if (!user || !editingDate) return;

        if (!isDayOff) {
            const mins = parseInt(workMinutes, 10);
            if (isNaN(mins) || mins <= 0) {
                Alert.alert("Thông báo", "Vui lòng nhập số phút làm việc hợp lệ.");
                return;
            }
        }

        const newValue = isDayOff ? 'Nghỉ' : parseInt(workMinutes, 10);

        setSaving(true);
        try {
            const updatedSchedule = {
                ...schedule,
                [editingDate]: newValue
            };

            await saveMonthlySchedule(user.id, estronYear, estronMonth, updatedSchedule);
            setSchedule(updatedSchedule);
            setShowEditModal(false);
        } catch (err) {
            Alert.alert("Lỗi", "Không thể lưu lịch làm việc. Vui lòng thử lại!");
            console.error("Save schedule error:", err);
        } finally {
            setSaving(false);
        }
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

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Đang tải lịch trình...</Text>
                </View>
            ) : (
                /* Grid Container */
                <View style={styles.container}>
                    {/* Weekday Row */}
                    <View style={styles.weekdayRow}>
                        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((label) => {
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
                                const scheduleVal = schedule[dateStr];
                                const isOff = scheduleVal === 'Nghỉ';

                                return (
                                    <TouchableOpacity
                                        key={dateStr}
                                        style={styles.cell}
                                        onPress={() => openEditModal(dateStr)}
                                    >
                                        {/* Cell Top (60% Height): Day Number */}
                                        <View style={styles.cellTop}>
                                            {isCurrentToday ? (
                                                <View style={styles.todayCircle}>
                                                    <Text style={styles.todayCellText}>{d}</Text>
                                                </View>
                                            ) : (
                                                <Text style={[
                                                    styles.cellText,
                                                    isColSaturday && styles.saturdayText,
                                                    isColSunday && styles.sundayText
                                                ]}>
                                                    {d}
                                                </Text>
                                            )}
                                        </View>

                                        {/* Cell Bottom (40% Height): Target Minutes / Nghỉ */}
                                        <View style={styles.cellBottom}>
                                            <Text
                                                numberOfLines={1}
                                                style={[
                                                    styles.cellScheduleText,
                                                    isOff && styles.sundayScheduleText,
                                                    !isOff && isColSaturday && styles.saturdayScheduleText,
                                                    !isOff && isColSunday && styles.sundayScheduleText
                                                ]}
                                            >
                                                {scheduleVal ?? ''}
                                            </Text>
                                        </View>
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
            )}

            {/* Custom Edit Schedule Modal */}
            <Modal
                visible={showEditModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowEditModal(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setShowEditModal(false)}>
                    <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                        <Text style={styles.modalTitle}>Cập nhật lịch làm việc</Text>
                        <Text style={styles.modalSubtitle}>{formatHeaderDate(editingDate)}</Text>

                        {/* Segmented Control: Làm việc vs Nghỉ */}
                        <View style={styles.segmentedContainer}>
                            <TouchableOpacity
                                style={[styles.segmentBtn, !isDayOff && styles.segmentBtnActiveWork]}
                                onPress={() => setIsDayOff(false)}
                            >
                                <Text style={[styles.segmentBtnText, !isDayOff && styles.segmentBtnTextActive]}>
                                    Làm việc
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.segmentBtn, isDayOff && styles.segmentBtnActiveOff]}
                                onPress={() => setIsDayOff(true)}
                            >
                                <Text style={[styles.segmentBtnText, isDayOff && styles.segmentBtnTextActive]}>
                                    Nghỉ
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Working minutes input and presets */}
                        {!isDayOff && (
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Số phút làm việc</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={workMinutes}
                                    onChangeText={setWorkMinutes}
                                    keyboardType="numeric"
                                    maxLength={4}
                                    autoFocus={Platform.OS !== 'web'}
                                />

                                {/* Quick Presets */}
                                <View style={styles.presetRow}>
                                    <TouchableOpacity style={styles.presetBtn} onPress={() => setWorkMinutes('480')}>
                                        <Text style={styles.presetBtnText}>480 phút</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.presetBtn} onPress={() => setWorkMinutes('240')}>
                                        <Text style={styles.presetBtnText}>240 phút</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Actions */}
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalBtnCancel}
                                onPress={() => setShowEditModal(false)}
                                disabled={saving}
                            >
                                <Text style={styles.modalBtnTextCancel}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalBtnSave}
                                onPress={handleSave}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <Text style={styles.modalBtnTextSave}>Lưu</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
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
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        color: '#8E8E93',
    },
    container: {
        flex: 1,
        padding: 16,
        justifyContent: 'flex-start',
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
        marginVertical: 6,
        overflow: 'hidden',
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
    cellTop: {
        height: '60%',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cellBottom: {
        height: '40%',
        width: '100%',
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#E5E5EA',
    },
    todayCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyCell: {
        width: '13%',
        aspectRatio: 1,
        marginVertical: 6,
        backgroundColor: 'transparent',
    },
    cellText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    todayCellText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
    },
    cellScheduleText: {
        fontSize: 10,
        fontWeight: '500',
        color: '#8E8E93',
    },
    sundayText: {
        color: '#FF3B30',
    },
    saturdayText: {
        color: '#FF9500',
    },
    sundayScheduleText: {
        color: '#FF3B30',
        fontWeight: '700',
    },
    saturdayScheduleText: {
        color: '#FF9500',
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        maxWidth: 340,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginTop: -100, // Shift up to avoid keyboard overlap
        ...Platform.select({
            ios: {
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 10,
            },
            android: {
                elevation: 6,
            },
            web: {
                boxShadow: '0px 4px 12px rgba(0,0,0,0.15)',
            }
        }),
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 20,
    },
    segmentedContainer: {
        flexDirection: 'row',
        backgroundColor: '#F2F2F7',
        borderRadius: 8,
        padding: 2,
        width: '100%',
        marginBottom: 20,
    },
    segmentBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
    },
    segmentBtnActiveWork: {
        backgroundColor: '#007AFF',
    },
    segmentBtnActiveOff: {
        backgroundColor: '#FF3B30',
    },
    segmentBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
    },
    segmentBtnTextActive: {
        color: '#ffffff',
    },
    inputContainer: {
        width: '100%',
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 13,
        color: '#8E8E93',
        marginBottom: 8,
        fontWeight: '500',
    },
    textInput: {
        width: '100%',
        height: 44,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
        color: '#000000',
        backgroundColor: '#F8F9FA',
    },
    presetRow: {
        flexDirection: 'row',
        marginTop: 12,
        justifyContent: 'space-between',
    },
    presetBtn: {
        flex: 0.48,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#007AFF',
        borderRadius: 8,
        alignItems: 'center',
    },
    presetBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#007AFF',
    },
    modalActions: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#E5E5EA',
        paddingTop: 16,
    },
    modalBtnCancel: {
        flex: 0.48,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
    },
    modalBtnTextCancel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#8E8E93',
    },
    modalBtnSave: {
        flex: 0.48,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#007AFF',
    },
    modalBtnTextSave: {
        fontSize: 15,
        fontWeight: '600',
        color: '#ffffff',
    },
});
