import React from 'react';
import {
    Platform,
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type PlatformName = 'ios' | 'android' | 'web';

export interface CustomHeaderProps {
    title: React.ReactNode;
    backgroundColor?: string;
    titleColor?: string;
    height?: number;
    topInsetBackgroundColor?: string;
    containerStyle?: StyleProp<ViewStyle>;
    contentStyle?: StyleProp<ViewStyle>;
    titleStyle?: StyleProp<TextStyle>;
    platformOptions?: Partial<Record<PlatformName, Partial<Omit<CustomHeaderProps, 'title' | 'platformOptions'>>>>;
    headerLeft?: () => React.ReactNode;
    headerRight?: () => React.ReactNode;
}

const DEFAULT_BACKGROUND = '#007AFF';

export default function CustomHeader(props: CustomHeaderProps) {
    const platformProps = props.platformOptions?.[Platform.OS as PlatformName] ?? {};
    const merged = { ...props, ...platformProps };
    const {
        title,
        backgroundColor = DEFAULT_BACKGROUND,
        titleColor = '#ffffff',
        topInsetBackgroundColor = backgroundColor,
        height = Platform.OS === 'web' ? 56 : 52,
        containerStyle,
        contentStyle,
        titleStyle,
        headerLeft,
        headerRight,
    } = merged;

    const leftButton = headerLeft ? headerLeft() : null;
    const rightButton = headerRight ? headerRight() : null;
    const hasSideContent = Boolean(leftButton || rightButton);

    if (Platform.OS === 'web') {
        return (
            <View style={[styles.safeArea, { backgroundColor }, containerStyle]}>
                <View style={[styles.content, { height, backgroundColor }, contentStyle]}>
                    {hasSideContent && (
                        <View style={styles.leftContainer}>
                            {leftButton}
                        </View>
                    )}
                    {typeof title === 'string' || typeof title === 'number' ? (
                        <Text numberOfLines={1} style={[styles.title, { color: titleColor }, titleStyle]}>
                            {title}
                        </Text>
                    ) : (
                        <View style={styles.titleContainer}>
                            {title}
                        </View>
                    )}
                    {hasSideContent && (
                        <View style={styles.rightContainer}>
                            {rightButton}
                        </View>
                    )}
                </View>
            </View>
        );
    }

    const safeAreaEdges = ['top'] as const;

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: topInsetBackgroundColor }, containerStyle]} edges={safeAreaEdges}>
            <View style={[styles.content, { height, backgroundColor }, contentStyle]}>
                {hasSideContent && (
                    <View style={styles.leftContainer}>
                        {leftButton}
                    </View>
                )}
                {typeof title === 'string' || typeof title === 'number' ? (
                    <Text numberOfLines={1} style={[styles.title, { color: titleColor }, titleStyle]}>
                        {title}
                    </Text>
                ) : (
                    <View style={styles.titleContainer}>
                        {title}
                    </View>
                )}
                {hasSideContent && (
                    <View style={styles.rightContainer}>
                        {rightButton}
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        width: '100%',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#C6C6C8',
    },
    title: {
        flex: 1,
        minWidth: 0,
        textAlign: 'center',
        fontSize: 17,
        fontWeight: '600',
    },
    titleContainer: {
        flex: 1,
        minWidth: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    leftContainer: {
        width: 52,
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingLeft: 4,
        zIndex: 10,
    },
    rightContainer: {
        width: 52,
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingRight: 4,
        overflow: 'visible',
    },
});
