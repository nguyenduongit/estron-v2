import React from 'react';
import {
    Platform,
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type PlatformName = 'ios' | 'android' | 'web';

export interface HeaderAction {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    onPress: () => void;
    color?: string;
    size?: number;
    accessibilityLabel?: string;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
}

export interface CustomHeaderProps {
    title: string;
    backgroundColor?: string;
    titleColor?: string;
    height?: number;
    topInsetBackgroundColor?: string;
    leftAction?: HeaderAction;
    rightAction?: HeaderAction;
    containerStyle?: StyleProp<ViewStyle>;
    contentStyle?: StyleProp<ViewStyle>;
    titleStyle?: StyleProp<TextStyle>;
    platformOptions?: Partial<Record<PlatformName, Partial<Omit<CustomHeaderProps, 'title' | 'platformOptions'>>>>;
}

const DEFAULT_BACKGROUND = '#007AFF';
const DEFAULT_TINT = '#007AFF';

export default function CustomHeader(props: CustomHeaderProps) {
    const platformProps = props.platformOptions?.[Platform.OS as PlatformName] ?? {};
    const merged = { ...props, ...platformProps };
    const {
        title,
        backgroundColor = DEFAULT_BACKGROUND,
        titleColor = '#ffffff',
        topInsetBackgroundColor = backgroundColor,
        height = Platform.OS === 'web' ? 56 : 52,
        leftAction,
        rightAction,
        containerStyle,
        contentStyle,
        titleStyle,
    } = merged;

    const safeAreaEdges = Platform.OS === 'web' ? [] : (['top'] as const);

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: topInsetBackgroundColor }, containerStyle]} edges={safeAreaEdges}>
            <View style={[styles.content, { height, backgroundColor }, contentStyle]}>
                <View style={styles.side}>
                    {leftAction ? <ActionButton action={leftAction} /> : null}
                </View>

                <Text numberOfLines={1} style={[styles.title, { color: titleColor }, titleStyle]}>
                    {title}
                </Text>

                <View style={[styles.side, styles.rightSide]}>
                    {rightAction ? <ActionButton action={rightAction} /> : null}
                </View>
            </View>
        </SafeAreaView>
    );
}

function ActionButton({ action }: { action: HeaderAction }) {
    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={action.accessibilityLabel}
            disabled={action.disabled}
            onPress={action.onPress}
            style={[styles.actionButton, action.disabled && styles.actionButtonDisabled, action.style]}
        >
            <Ionicons name={action.icon} size={action.size ?? 24} color={action.color ?? DEFAULT_TINT} />
        </TouchableOpacity>
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
    side: {
        width: 52,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    rightSide: {
        alignItems: 'flex-end',
    },
    actionButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonDisabled: {
        opacity: 0.35,
    },
    title: {
        flex: 1,
        minWidth: 0,
        textAlign: 'center',
        fontSize: 17,
        fontWeight: '600',
    },
});
