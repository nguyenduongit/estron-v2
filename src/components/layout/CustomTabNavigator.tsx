import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const ACTIVE_TINT = '#007AFF';
const INACTIVE_TINT = '#8E8E93';
const TAB_BAR_HEIGHT = Platform.OS === 'web' ? 40 : 78;

export const CUSTOM_TAB_BAR_HEIGHT = TAB_BAR_HEIGHT;

export default function CustomTabNavigator({ state, descriptors, navigation }: BottomTabBarProps) {
    return (
        <View style={styles.container}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const focused = state.index === index;
                const color = focused ? ACTIVE_TINT : INACTIVE_TINT;
                const label =
                    typeof options.tabBarLabel === 'string'
                        ? options.tabBarLabel
                        : options.title ?? route.name;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!focused && !event.defaultPrevented) {
                        navigation.navigate(route.name, route.params);
                    }
                };

                const onLongPress = () => {
                    navigation.emit({
                        type: 'tabLongPress',
                        target: route.key,
                    });
                };

                return (
                    <Pressable
                        key={route.key}
                        accessibilityRole="button"
                        accessibilityState={focused ? { selected: true } : {}}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                        testID={options.tabBarButtonTestID}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        style={styles.item}
                    >
                        <View style={styles.icon}>
                            {options.tabBarIcon?.({ focused, color, size: 30 })}
                        </View>
                        <Text numberOfLines={1} style={[styles.label, { color }]}>
                            {label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: TAB_BAR_HEIGHT,
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#F9F9F9',
        borderTopColor: '#C6C6C8',
        borderTopWidth: StyleSheet.hairlineWidth,
        paddingTop: 7,
    },
    item: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        minWidth: 0,
    },
    icon: {
        height: 34,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        marginTop: 1,
        fontSize: 11,
        fontWeight: '500',
    },
});
