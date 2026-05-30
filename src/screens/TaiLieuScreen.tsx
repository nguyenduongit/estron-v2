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
});
