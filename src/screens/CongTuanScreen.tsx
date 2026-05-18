import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function CongTuanScreen() {
    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Công tuần</Text>
            </View>
            <View style={styles.container}>
                <Text style={styles.placeholder}>Màn hình Công tuần</Text>
            </View>
        </SafeAreaView>
    );
}
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
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
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F2F2F7',
    },
    placeholder: {
        fontSize: 17,
        color: '#8E8E93',
        fontWeight: '400',
    },
});