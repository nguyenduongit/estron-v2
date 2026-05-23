import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACTIVE_TINT = '#007AFF';
const INACTIVE_TINT = '#8E8E93';
const BAR_BACKGROUND = '#F9F9F9';

export default function CustomTabNavigator({ state, descriptors, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();
    const bottomInset = Platform.OS === 'web' ? 0 : insets.bottom;
    const tabContentHeight = Platform.OS === 'web' ? 60 : 58;

    return (
        <View style={[styles.container, { height: tabContentHeight + bottomInset, paddingBottom: bottomInset }]}>
            <View style={[styles.tabs, { height: tabContentHeight }]}>
                {state.routes.map((route, index) => {
                    const descriptor = descriptors[route.key];
                    const options = descriptor.options;
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
                            style={styles.tabButton}
                        >
                            <View style={styles.iconWrap}>
                                {options.tabBarIcon?.({ focused, color, size: 29 })}
                            </View>
                            <Text numberOfLines={1} style={[styles.label, { color }]}>
                                {label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: BAR_BACKGROUND,
        borderTopColor: '#C6C6C8',
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    tabs: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tabButton: {
        flex: 1,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 3,
    },
    iconWrap: {
        height: 31,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        marginTop: 0,
        fontSize: 10,
        fontWeight: '500',
    },
});
