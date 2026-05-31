import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Platform,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getScheduleSettings, saveScheduleSettings, ScheduleSettings, DEFAULT_SCHEDULE } from '../utils/schedule';

interface LichTrinhScreenProps {
    onClose: () => void;
}

export default function LichTrinhScreen({ onClose }: LichTrinhScreenProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form states (stored in minutes as string)
    const [weekdays, setWeekdays] = useState('480');
    const [saturday, setSaturday] = useState('240');
    const [sunday, setSunday] = useState('0');

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings = await getScheduleSettings();
                setWeekdays(settings.weekdays.toString());
                setSaturday(settings.saturday.toString());
                setSunday(settings.sunday.toString());
            } catch (e) {
                console.error("Error loading settings:", e);
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    const handleApplyPreset = (preset: ScheduleSettings) => {
        setWeekdays(preset.weekdays.toString());
        setSaturday(preset.saturday.toString());
        setSunday(preset.sunday.toString());
    };

    const handleSave = async () => {
        const weekdaysMin = Number(weekdays);
        const saturdayMin = Number(saturday);
        const sundayMin = Number(sunday);

        if (isNaN(weekdaysMin) || isNaN(saturdayMin) || isNaN(sundayMin)) {
            if (Platform.OS === 'web') {
                alert("Vui lòng nhập số phút hợp lệ (phải là số)");
            } else {
                Alert.alert("Lỗi", "Vui lòng nhập số phút hợp lệ (phải là số)");
            }
            return;
        }

        setSaving(true);
        try {
            await saveScheduleSettings({
                weekdays: weekdaysMin,
                saturday: saturdayMin,
                sunday: sundayMin
            });
            if (Platform.OS === 'web') {
                alert("Lưu thiết lập lịch trình thành công!");
            } else {
                Alert.alert("Thành công", "Đã lưu thiết lập lịch trình!");
            }
            onClose();
        } catch (e) {
            console.error("Error saving schedule settings:", e);
            if (Platform.OS === 'web') {
                alert("Không thể lưu thiết lập");
            } else {
                Alert.alert("Lỗi", "Không thể lưu thiết lập");
            }
        } finally {
            setSaving(false);
        }
    };

    // Helper to render hours representation
    const getHoursText = (minutesStr: string) => {
        const min = Number(minutesStr);
        if (isNaN(min) || min <= 0) return '0h';
        const hrs = min / 60;
        return `${Number(hrs.toFixed(1))}h`;
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.backButton}>
                    <Ionicons name="close-outline" size={26} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thiết lập lịch trình</Text>
                <View style={styles.headerRightPlaceholder} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.sectionTitle}>Chọn Lịch Nhanh (Presets)</Text>
                    <View style={styles.presetContainer}>
                        <TouchableOpacity
                            style={styles.presetButton}
                            onPress={() => handleApplyPreset({ weekdays: 480, saturday: 240, sunday: 0 })}
                        >
                            <Text style={styles.presetText}>Hành chính (T7 4h)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.presetButton}
                            onPress={() => handleApplyPreset({ weekdays: 480, saturday: 0, sunday: 0 })}
                        >
                            <Text style={styles.presetText}>Hành chính (Nghỉ T7)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.presetButton}
                            onPress={() => handleApplyPreset({ weekdays: 480, saturday: 480, sunday: 0 })}
                        >
                            <Text style={styles.presetText}>Tăng ca (T7 Full)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.presetButton}
                            onPress={() => handleApplyPreset({ weekdays: 720, saturday: 720, sunday: 0 })}
                        >
                            <Text style={styles.presetText}>Lịch 12h (Mỗi ngày)</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.sectionTitle}>Định Mức Giờ Làm Việc (Phút)</Text>
                    <View style={styles.card}>
                        {/* Thứ 2 - Thứ 6 */}
                        <View style={styles.inputRow}>
                            <View style={styles.labelCol}>
                                <Text style={styles.inputLabel}>Thứ 2 - Thứ 6</Text>
                                <Text style={styles.inputSubLabel}>Ngày làm việc thường</Text>
                            </View>
                            <View style={styles.valueCol}>
                                <TextInput
                                    style={styles.textInput}
                                    value={weekdays}
                                    onChangeText={setWeekdays}
                                    keyboardType="numeric"
                                    maxLength={4}
                                    returnKeyType="done"
                                />
                                <Text style={styles.unitText}>phút ({getHoursText(weekdays)})</Text>
                            </View>
                        </View>
                        
                        <View style={styles.divider} />

                        {/* Thứ 7 */}
                        <View style={styles.inputRow}>
                            <View style={styles.labelCol}>
                                <Text style={styles.inputLabel}>Thứ 7</Text>
                                <Text style={styles.inputSubLabel}>Ngày làm việc cuối tuần</Text>
                            </View>
                            <View style={styles.valueCol}>
                                <TextInput
                                    style={styles.textInput}
                                    value={saturday}
                                    onChangeText={setSaturday}
                                    keyboardType="numeric"
                                    maxLength={4}
                                    returnKeyType="done"
                                />
                                <Text style={styles.unitText}>phút ({getHoursText(saturday)})</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Chủ nhật */}
                        <View style={styles.inputRow}>
                            <View style={styles.labelCol}>
                                <Text style={styles.inputLabel}>Chủ nhật</Text>
                                <Text style={styles.inputSubLabel}>Ngày nghỉ định kỳ</Text>
                            </View>
                            <View style={styles.valueCol}>
                                <TextInput
                                    style={styles.textInput}
                                    value={sunday}
                                    onChangeText={setSunday}
                                    keyboardType="numeric"
                                    maxLength={4}
                                    returnKeyType="done"
                                />
                                <Text style={styles.unitText}>phút ({getHoursText(sunday)})</Text>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.infoBoxText}>
                        * Số phút định mức này sẽ được dùng để tính toán "Công chuẩn cần thực hiện" trong tuần và trong tháng của bạn.
                    </Text>

                    <TouchableOpacity
                        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text style={styles.saveButtonText}>Lưu Thiết Lập</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    centerContainer: {
        flex: 1,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 8,
        marginTop: 16,
        textTransform: 'uppercase',
        paddingLeft: 8,
    },
    presetContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    presetButton: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#E5E5EA',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 14,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
        elevation: 1,
    },
    presetText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 16,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 58,
    },
    labelCol: {
        flex: 1,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
    },
    inputSubLabel: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 2,
    },
    valueCol: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        width: 150,
    },
    textInput: {
        backgroundColor: '#F2F2F7',
        borderRadius: 6,
        width: 60,
        height: 36,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
        marginRight: 6,
    },
    unitText: {
        fontSize: 12,
        color: '#8E8E93',
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#C6C6C8',
        marginLeft: 16,
    },
    infoBoxText: {
        fontSize: 13,
        color: '#8E8E93',
        lineHeight: 18,
        paddingHorizontal: 8,
        marginBottom: 24,
    },
    saveButton: {
        backgroundColor: '#007AFF',
        borderRadius: 10,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 3,
    },
    saveButtonDisabled: {
        backgroundColor: '#A1C6F8',
    },
    saveButtonText: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '600',
    },
});
