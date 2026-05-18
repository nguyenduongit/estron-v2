import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function CongTuanScreen() {
    return (
        <View style={styles.screenContainer}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Công tuần</Text>
                </View>
            </SafeAreaView>
            <View style={styles.container}>
                <Text style={styles.placeholder}>Màn hình Công tuần</Text>
            </View>
        </View>
    );
}
const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    safeArea: {
        backgroundColor: '#007AFF',
    },
    header: {
        backgroundColor: '#007AFF',
        paddingVertical: 10,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
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