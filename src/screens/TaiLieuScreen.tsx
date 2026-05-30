import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    DeviceEventEmitter,
    Alert,
    Platform,
    TextInput,
    ScrollView,
    BackHandler
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const SOLDER_ERRORS = [
    { code: '3.1', desc: 'Sai thông số yêu cầu, sai dây, sai vị trí.' },
    { code: '3.2', desc: 'Mỗi hàn không đạt theo PC, không tan chảy, dơ.' },
    { code: '3.3', desc: 'Đứt dây, trầy dây, tuột dây, fiber.' },
    { code: '3.4', desc: 'Biến dạng NVL trong quá trình Solder: chảy cáp, cong cáp, biến dạng contact pin (electrode), PCB do lực hoặc bất cẩn thao tác.' },
    { code: '3.5', desc: 'Lỗi NVL.' },
    { code: '3.6', desc: 'Solder chết, rụng contact pin.' },
    { code: '3.7', desc: 'Khác.' },
    { code: '17.1', desc: 'Thiếu hàng.' },
    { code: '17.2', desc: 'Dư hàng.' },
];

const KPI_CRITERIA = {
    title: 'TIÊU CHÍ & ĐIỂM ĐÁNH GIÁ HIỆU QUẢ - TRÁCH NHIỆM CÔNG VIỆC',
    subtitle: 'CỦA NHÂN VIÊN KHỐI SẢN XUẤT NĂM 2026',
    appliedDate: 'Áp dụng: 01-01-2026',
    totalScore: 65,
    categories: [
        {
            id: '1',
            name: '1. Chất lượng công việc hoặc sản phẩm',
            maxPoints: 25,
            items: [
                { id: '1.1', desc: 'Mục tiêu chất lượng của chuyền', points: 4 },
                { id: '1.2', desc: 'Khiếu nại từ khách hàng (IQA)', points: 2, note: 'Điểm tính trên 1 lần phát sinh & có ảnh hưởng trực tiếp' },
                { id: '1.3', desc: 'Vượt trội 6 tháng liên tiếp không có lỗi chất lượng', points: 3 },
                { id: '1.4', desc: 'Lỗi chất lượng', points: 14, note: 'Căn cứ theo bảng quy định +/- điểm đánh giá chất lượng' },
                {
                    id: '1.5',
                    desc: 'Tổng công tham gia sản xuất ở các công đoạn điều chuyển (khác nhóm, khác dòng sản phẩm).',
                    example: 'Lưu ý: Nhóm Mix: chỉ áp dụng cho Tin-Solder-Glue-SWH. (Tinning cho sản phẩm Linum&N-ear được tính chung là 1 dòng sản phẩm)',
                    points: 2
                },
                { id: '1.5a', desc: 'Tổng công/năm >30 công & đạt đủ sản lượng & chất lượng.', points: 2 },
                { id: '1.5b', desc: 'Tổng công/năm 5.5 đến 30 công & đạt đủ sản lượng & chất lượng.', points: 1 }
            ]
        },
        {
            id: '2',
            name: '2. Tuân thủ quy trình làm việc & Thông tin liên quan',
            maxPoints: 15,
            items: [
                {
                    id: '2.1',
                    desc: 'Hiểu rõ thông tin, yêu cầu công việc và thực hiện đúng theo quy trình hướng dẫn',
                    example: 'Ví dụ: Ghi lộn phiếu, ghi sai phiếu, giao hàng trễ, nhầm hộp, nhầm size, quên báo sản lượng, sai ống keo, sai số máy sấy,...',
                    points: 15,
                    note: '-0.5/lần'
                }
            ]
        },
        {
            id: '3',
            name: '3. Nội quy - An toàn lao động',
            maxPoints: 10,
            items: [
                {
                    id: '3.1',
                    desc: 'Gọn gàng, ngăn nắp trước, trong & sau khi làm việc.',
                    example: 'Ví dụ: lau dọn bàn, ghế xếp gọn, trùm kính+máy, vị trí để hàng, chỉ để những vật dụng cần thiết phục vụ cho sản xuất trên khu vực bàn làm việc',
                    points: 4,
                    note: '-0.5/lần'
                },
                { id: '3.2', desc: 'Bảo quản trang thiết bị, công cụ dụng cụ sạch sẽ, không gây hư hỏng.', points: 3, note: '-0.5/lần' },
                {
                    id: '3.3',
                    desc: 'Tự giác chấp hành tốt nội quy công ty/quy định về an toàn lao động.',
                    example: 'Ví dụ: tắt đèn, khí, máy, ra vào ca đúng giờ, tiếng ồn...',
                    points: 3,
                    note: '-0.5/lần'
                }
            ]
        },
        {
            id: '4',
            name: '4. Tinh thần trách nhiệm & Hợp tác',
            maxPoints: 15,
            items: [
                {
                    id: '4.1',
                    desc: 'Tích cực, chủ động, có trách nhiệm',
                    example: 'Ví dụ: không chủ động, không tương tác trong công việc...',
                    points: 9,
                    note: '-1/lần'
                },
                { id: '4.2', desc: 'Tuân theo điều động của cấp trên', points: 3, note: '-1/lần' },
                {
                    id: '4.3',
                    desc: 'Đoàn kết, hỗ trợ, giúp đỡ đồng nghiệp khi cần',
                    example: 'Ví dụ: không tham gia hoạt động chung của chuyền hoặc công ty, không hỗ trợ đồng nghiệp...',
                    points: 3,
                    note: '-1/lần'
                }
            ]
        }
    ]
};

export default function TaiLieuScreen({ navigation }: any) {
    const [userName, setUserName] = useState('');
    const [userPhone, setUserPhone] = useState('');
    const [activeSubScreen, setActiveSubScreen] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            const data = await AsyncStorage.getItem('user');
            if (data) {
                const u = JSON.parse(data);
                setUserName(u.name || '');
                setUserPhone(u.phone || '');
            }
        };
        fetchUser();
    }, []);

    // Cập nhật header title và back button của tab theo trạng thái sub-screen
    useEffect(() => {
        if (activeSubScreen === 'solder') {
            navigation.setOptions({
                headerTitleText: (
                    <View style={styles.headerTitleContainer}>
                        <TouchableOpacity onPress={() => setActiveSubScreen(null)} style={styles.headerBackButton}>
                            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitleLeft}>Tra cứu mã lỗi Solder</Text>
                    </View>
                )
            });
        } else if (activeSubScreen === 'kpi') {
            navigation.setOptions({
                headerTitleText: (
                    <View style={styles.headerTitleContainer}>
                        <TouchableOpacity onPress={() => setActiveSubScreen(null)} style={styles.headerBackButton}>
                            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitleLeft}>Tiêu chí đánh giá KPI</Text>
                    </View>
                )
            });
        } else {
            navigation.setOptions({
                headerTitleText: (
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitleLeft}>Tài liệu</Text>
                    </View>
                )
            });
        }
    }, [activeSubScreen, navigation]);

    // Xử lý nút back vật lý trên Android
    useEffect(() => {
        const backAction = () => {
            if (activeSubScreen !== null) {
                setActiveSubScreen(null);
                return true;
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction
        );

        return () => backHandler.remove();
    }, [activeSubScreen]);

    const handleLogout = () => {
        if (Platform.OS === 'web') {
            if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                DeviceEventEmitter.emit('onLogout');
            }
        } else {
            Alert.alert(
                'Đăng xuất',
                'Bạn có chắc chắn muốn đăng xuất?',
                [
                    { text: 'Hủy', style: 'cancel' },
                    { text: 'Đăng xuất', style: 'destructive', onPress: () => DeviceEventEmitter.emit('onLogout') }
                ]
            );
        }
    };

    // Lọc mã lỗi dựa trên tìm kiếm
    const filteredErrors = SOLDER_ERRORS.filter(error => {
        const q = searchQuery.toLowerCase().trim();
        return error.code.includes(q) || error.desc.toLowerCase().includes(q);
    });

    if (activeSubScreen === 'solder') {
        return (
            <View style={styles.screen}>
                <View style={styles.searchWrapper}>
                    <View style={styles.searchContainer}>
                        <Ionicons name="search-outline" size={20} color="#8E8E93" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Tìm kiếm mã lỗi hoặc mô tả..."
                            placeholderTextColor="#8E8E93"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
                                <Ionicons name="close-circle" size={18} color="#8E8E93" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <ScrollView 
                    style={styles.subScreenScroll} 
                    contentContainerStyle={styles.subScreenContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.errorListGroup}>
                        {filteredErrors.map((error, index) => (
                            <View 
                                key={error.code} 
                                style={[
                                    styles.errorRow,
                                    index === filteredErrors.length - 1 && styles.errorRowLast
                                ]}
                            >
                                <View style={styles.errorHeader}>
                                    <View style={styles.codeBadge}>
                                        <Text style={styles.codeText}>{error.code}</Text>
                                    </View>
                                </View>
                                <Text style={styles.errorDesc}>{error.desc}</Text>
                            </View>
                        ))}
                        {filteredErrors.length === 0 && (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="alert-circle-outline" size={48} color="#C6C6C8" />
                                <Text style={styles.emptyText}>Không tìm thấy mã lỗi nào</Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </View>
        );
    }

    if (activeSubScreen === 'kpi') {
        return (
            <View style={styles.screen}>
                <ScrollView 
                    style={styles.subScreenScroll} 
                    contentContainerStyle={styles.subScreenContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header info */}
                    <View style={styles.kpiDocHeader}>
                        <Text style={styles.kpiDocTitle}>{KPI_CRITERIA.title}</Text>
                        <Text style={styles.kpiDocSubtitle}>{KPI_CRITERIA.subtitle}</Text>
                        <View style={styles.kpiDocMeta}>
                            <Text style={styles.kpiDocDate}>{KPI_CRITERIA.appliedDate}</Text>
                            <View style={styles.totalBadge}>
                                <Text style={styles.totalBadgeLabel}>Tổng điểm:</Text>
                                <Text style={styles.totalBadgeValue}>{KPI_CRITERIA.totalScore}đ</Text>
                            </View>
                        </View>
                    </View>

                    {/* Categories */}
                    {KPI_CRITERIA.categories.map((category) => (
                        <View key={category.id} style={styles.kpiCard}>
                            <View style={styles.kpiCardHeader}>
                                <Text style={styles.kpiCardTitle}>{category.name}</Text>
                                <View style={styles.kpiCardPointsBadge}>
                                    <Text style={styles.kpiCardPointsText}>{category.maxPoints}đ</Text>
                                </View>
                            </View>
                            
                            <View style={styles.kpiCardBody}>
                                {category.items.map((item, idx) => (
                                    <View 
                                        key={item.id} 
                                        style={[
                                            styles.kpiItemRow,
                                            idx === category.items.length - 1 && styles.kpiItemRowLast
                                        ]}
                                    >
                                        <View style={styles.kpiItemTop}>
                                            <View style={styles.kpiItemIdBadge}>
                                                <Text style={styles.kpiItemIdText}>{item.id}</Text>
                                            </View>
                                            <Text style={styles.kpiItemDesc}>{item.desc}</Text>
                                            <View style={styles.kpiItemPoints}>
                                                <Text style={styles.kpiItemPointsText}>{item.points}đ</Text>
                                            </View>
                                        </View>

                                        {item.example && (
                                            <Text style={styles.kpiItemExample}>{item.example}</Text>
                                        )}

                                        {item.note && (
                                            <View style={styles.kpiItemNoteBox}>
                                                <Ionicons name="alert-circle-outline" size={14} color="#FF3B30" style={{ marginRight: 4 }} />
                                                <Text style={styles.kpiItemNoteText}>{item.note}</Text>
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <ScrollView 
                style={styles.scrollView} 
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                {/* Block Profile */}
                <View style={styles.userInfoGroup}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Tài khoản</Text>
                        <Text style={styles.value}>{userName}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <Text style={styles.label}>Số điện thoại</Text>
                        <Text style={styles.value}>{userPhone}</Text>
                    </View>
                </View>

                {/* Block Danh sách tài liệu */}
                <View style={styles.userInfoGroup}>
                    <TouchableOpacity style={styles.row} onPress={() => { setSearchQuery(''); setActiveSubScreen('solder'); }}>
                        <Text style={styles.label}>Tra cứu mã lỗi Solder</Text>
                        <Ionicons name="chevron-forward" size={20} color="#C6C6C8" />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.row} onPress={() => setActiveSubScreen('kpi')}>
                        <Text style={styles.label}>Tiêu chí đánh giá KPI</Text>
                        <Ionicons name="chevron-forward" size={20} color="#C6C6C8" />
                    </TouchableOpacity>
                </View>

                {/* Nút Đăng xuất */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Đăng xuất</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    scrollView: {
        flex: 1,
    },
    container: {
        paddingTop: 24,
        paddingBottom: Platform.OS === 'web' ? 60 : 100,
    },
    userInfoGroup: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        marginHorizontal: 16,
        overflow: 'hidden',
        marginBottom: 24,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        minHeight: 44,
        paddingVertical: 12,
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
    value: {
        fontSize: 17,
        color: '#8E8E93',
    },
    logoutButton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        marginHorizontal: 16,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoutText: {
        color: '#FF3B30',
        fontSize: 17,
        fontWeight: '600',
    },
    // Header Styles
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
    headerBackButton: {
        position: 'absolute',
        left: 8,
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Search Sub-screen Styles
    searchWrapper: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 44,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#000000',
        paddingVertical: 8,
    },
    clearSearchButton: {
        padding: 4,
    },
    subScreenScroll: {
        flex: 1,
    },
    subScreenContent: {
        paddingBottom: Platform.OS === 'web' ? 60 : 100,
    },
    errorListGroup: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 24,
        overflow: 'hidden',
    },
    errorRow: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#C6C6C8',
    },
    errorRowLast: {
        borderBottomWidth: 0,
    },
    errorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    codeBadge: {
        backgroundColor: '#007AFF15',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    codeText: {
        color: '#007AFF',
        fontWeight: '700',
        fontSize: 14,
    },
    errorDesc: {
        fontSize: 16,
        color: '#333333',
        lineHeight: 22,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    emptyText: {
        color: '#8E8E93',
        fontSize: 16,
        marginTop: 8,
    },
    // KPI Styles
    kpiDocHeader: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    kpiDocTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#007AFF',
        textAlign: 'center',
        lineHeight: 22,
    },
    kpiDocSubtitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333333',
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 18,
    },
    kpiDocMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#C6C6C8',
    },
    kpiDocDate: {
        fontSize: 12,
        color: '#8E8E93',
        fontStyle: 'italic',
    },
    totalBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#34C75915',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    totalBadgeLabel: {
        fontSize: 13,
        color: '#34C759',
        fontWeight: '500',
        marginRight: 4,
    },
    totalBadgeValue: {
        fontSize: 13,
        color: '#34C759',
        fontWeight: '700',
    },
    kpiCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        marginHorizontal: 16,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    kpiCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F9F9F9',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#C6C6C8',
    },
    kpiCardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#000000',
        flex: 1,
        marginRight: 8,
    },
    kpiCardPointsBadge: {
        backgroundColor: '#FF950015',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    kpiCardPointsText: {
        color: '#FF9500',
        fontWeight: '700',
        fontSize: 13,
    },
    kpiCardBody: {
        paddingHorizontal: 16,
    },
    kpiItemRow: {
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E5E5EA',
    },
    kpiItemRowLast: {
        borderBottomWidth: 0,
    },
    kpiItemTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    kpiItemIdBadge: {
        backgroundColor: '#F2F2F7',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginRight: 8,
        marginTop: 2,
    },
    kpiItemIdText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#555555',
    },
    kpiItemDesc: {
        fontSize: 15,
        color: '#333333',
        flex: 1,
        lineHeight: 20,
    },
    kpiItemPoints: {
        backgroundColor: '#007AFF10',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 8,
        marginTop: 2,
    },
    kpiItemPointsText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#007AFF',
    },
    kpiItemExample: {
        fontSize: 13,
        color: '#8E8E93',
        marginTop: 6,
        paddingLeft: 32,
        lineHeight: 18,
    },
    kpiItemNoteBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF3B3008',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginTop: 6,
        marginLeft: 32,
        alignSelf: 'flex-start',
    },
    kpiItemNoteText: {
        fontSize: 12,
        color: '#FF3B30',
        fontWeight: '500',
    },
});
