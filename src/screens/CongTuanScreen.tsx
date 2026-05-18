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
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholder: {
        fontSize: 17,
        color: '#8E8E93',
        fontWeight: '400',
    },
});