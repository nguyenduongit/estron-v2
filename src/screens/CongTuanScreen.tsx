import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CongTuanScreen() {
    return (
        <View style={styles.screen}>
            <View style={styles.container}>
                <Text style={styles.placeholder}>Màn hình Công tuần</Text>
            </View>
        </View>
    );
}
const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#F2F2F7',
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
