import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as NativeText,
  TextInput,
  View,
  type TextProps,
  type TextInputProps,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ChevronRight,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import carefold from '../../assets/carefold.png';
import { c, radius, space, type } from '../theme/tokens';

export function Text({
  variant = 'body',
  color = c.ink,
  style,
  ...props
}: TextProps & { variant?: keyof typeof type; color?: string }) {
  return <NativeText {...props} style={[type[variant], { color }, style]} />;
}
export function Button({
  title,
  onPress,
  variant = 'primary',
  icon: Icon,
  busy,
  disabled,
  compact = false,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  icon?: LucideIcon;
  busy?: boolean;
  disabled?: boolean;
  compact?: boolean;
}) {
  const ink =
    variant === 'primary'
      ? c.screen
      : variant === 'danger'
        ? c.error
        : c.forest;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        compact && { alignSelf: 'flex-start' },
        {
          backgroundColor: disabled
            ? c.disabled
            : variant === 'primary'
              ? pressed
                ? c.pressed
                : c.forest
              : variant === 'quiet'
                ? c.sage
                : c.screen,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: c.line,
          opacity: pressed && variant !== 'primary' ? 0.7 : 1,
        },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={ink} accessibilityLabel={title} />
      ) : (
        <>
          {Icon && <Icon size={20} color={ink} />}
          <Text
            variant="strong"
            style={{ flexShrink: 1, textAlign: 'center' }}
            color={disabled ? c.secondary : ink}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}
export function IconButton({
  icon: Icon,
  label,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [s.iconButton, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Icon size={22} color={c.ink} />
    </Pressable>
  );
}
export function Brand({
  large = false,
  wordmark = true,
}: {
  large?: boolean;
  wordmark?: boolean;
}) {
  return (
    <View style={s.row}>
      <Image
        source={carefold}
        accessibilityLabel="Carefold emblem"
        style={{ width: large ? 112 : 40, height: large ? 112 : 40 }}
        resizeMode="contain"
      />
      {wordmark && <Text variant={large ? 'title' : 'heading'}>Tenday</Text>}
    </View>
  );
}
export function Screen({
  children,
  footer,
  scroll = true,
  title,
  subtitle,
  back = false,
  close = false,
  trailing,
}: {
  children: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  title?: string;
  subtitle?: string;
  back?: boolean;
  close?: boolean;
  trailing?: ReactNode;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const contents = (
    <View style={s.content}>
      {(back || close) && (
        <View style={[s.between, { marginBottom: space.lg }]}>
          <IconButton
            label={close ? 'Close' : 'Go back'}
            icon={close ? X : ArrowLeft}
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace('/')
            }
          />
          {trailing}
        </View>
      )}
      {title && (
        <View style={{ gap: space.sm, marginBottom: space.lg }}>
          <Text variant="title" accessibilityRole="header">
            {title}
          </Text>
          {subtitle && <Text color={c.secondary}>{subtitle}</Text>}
        </View>
      )}
      {children}
    </View>
  );
  return (
    <SafeAreaView style={s.screen} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {scroll ? (
          <ScrollView
            style={s.flex}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
          >
            {contents}
          </ScrollView>
        ) : (
          contents
        )}
        {footer && (
          <View
            style={[
              s.footer,
              { paddingBottom: Math.max(insets.bottom, space.base) },
            ]}
          >
            {footer}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Card({
  children,
  tone = 'neutral',
  style,
  onPress,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'sage' | 'outline';
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const base: StyleProp<ViewStyle> = [
    s.card,
    {
      backgroundColor:
        tone === 'sage' ? c.sage : tone === 'outline' ? c.screen : c.surface,
      borderWidth: tone === 'outline' ? 1 : 0,
      borderColor: c.line,
    },
    style,
  ];
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [base, { opacity: pressed ? 0.75 : 1 }]}
    >
      {children}
    </Pressable>
  ) : (
    <View style={base}>{children}</View>
  );
}
export function Input({
  label,
  hint,
  ...props
}: TextInputProps & { label: string; hint?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: space.sm, flexShrink: 1 }}>
      <Text variant="small" color={c.secondary}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.muted}
        {...props}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        style={[
          s.input,
          focused && { borderColor: c.forest },
          props.multiline && { minHeight: 110, textAlignVertical: 'top' },
          props.style,
        ]}
      />
      {hint && (
        <Text variant="small" color={c.muted}>
          {hint}
        </Text>
      )}
    </View>
  );
}
export function NumberInput({
  value,
  onChangeValue,
  nullable = false,
  ...props
}: Omit<TextInputProps, 'value' | 'onChangeText'> & {
  label: string;
  value: number | null;
  nullable?: boolean;
  onChangeValue: (value: number | null) => void;
}) {
  const focused = useRef(false);
  const [raw, setRaw] = useState(value === null ? '' : String(value));
  useEffect(() => {
    if (!focused.current) setRaw(value === null ? '' : String(value));
  }, [value]);
  return (
    <Input
      {...props}
      keyboardType={props.keyboardType ?? 'decimal-pad'}
      value={raw}
      onFocus={() => {
        focused.current = true;
      }}
      onBlur={() => {
        focused.current = false;
        setRaw(value === null ? '' : String(value));
      }}
      onChangeText={(text) => {
        setRaw(text);
        if (!text.trim()) onChangeValue(nullable ? null : 0);
        else if (
          /^-?(?:\d+\.?\d*|\.\d+)$/.test(text) &&
          Number.isFinite(Number(text))
        )
          onChangeValue(Number(text));
      }}
    />
  );
}
export function Choice({
  title,
  subtitle,
  selected,
  onPress,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  selected?: boolean;
  onPress: () => void;
  icon?: LucideIcon;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        s.choice,
        {
          backgroundColor: selected ? c.sage : c.screen,
          borderColor: selected ? c.forest : c.line,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      {Icon && <Icon size={24} color={c.forest} />}
      <View style={{ flex: 1, gap: space.xs }}>
        <Text variant="strong">{title}</Text>
        {subtitle && (
          <Text variant="small" color={c.secondary}>
            {subtitle}
          </Text>
        )}
      </View>
      <View
        style={[
          s.radio,
          {
            borderColor: selected ? c.forest : c.muted,
            backgroundColor: selected ? c.forest : c.screen,
          },
        ]}
      />
    </Pressable>
  );
}
export function Banner({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[s.banner, { backgroundColor: error ? c.errorSurface : c.sage }]}
    >
      <Text variant="small" color={error ? c.error : c.forest}>
        {children}
      </Text>
    </View>
  );
}
export function Section({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View
      style={[s.between, { marginTop: space.xl, marginBottom: space.base }]}
    >
      <Text variant="section" accessibilityRole="header">
        {title}
      </Text>
      {action && (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          style={s.smallAction}
        >
          <Text variant="small" color={c.forest}>
            {action}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
export function Row({
  title,
  subtitle,
  icon: Icon,
  trailing,
  onPress,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  trailing?: ReactNode;
  onPress?: () => void;
}) {
  const body = (
    <>
      {Icon && (
        <View style={s.tile}>
          <Icon size={22} color={c.forest} />
        </View>
      )}
      <View style={{ flex: 1, gap: space.xs }}>
        <Text variant="strong">{title}</Text>
        {subtitle && (
          <Text variant="small" color={c.secondary}>
            {subtitle}
          </Text>
        )}
      </View>
      {trailing}
      {onPress && <ChevronRight size={18} color={c.muted} />}
    </>
  );
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress} style={s.listRow}>
      {body}
    </Pressable>
  ) : (
    <View style={s.listRow}>{body}</View>
  );
}
export function Empty({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <View style={s.empty}>
      <View style={s.emptyTile}>
        <Icon size={32} color={c.forest} strokeWidth={1.5} />
      </View>
      <Text variant="section" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      <Text color={c.secondary} style={{ textAlign: 'center', maxWidth: 330 }}>
        {body}
      </Text>
      {action}
    </View>
  );
}
export function Loading({ label = 'Opening your day…' }: { label?: string }) {
  return (
    <Screen>
      <View style={s.empty}>
        <Brand large wordmark={false} />
        <ActivityIndicator color={c.forest} />
        <Text color={c.secondary}>{label}</Text>
      </View>
    </Screen>
  );
}
export function ProgressRing({
  fraction,
  children,
}: {
  fraction: number;
  children: ReactNode;
}) {
  const circumference = 2 * Math.PI * 51;
  return (
    <View
      style={{
        width: 124,
        height: 124,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={124} height={124} style={StyleSheet.absoluteFill}>
        <Circle
          cx={62}
          cy={62}
          r={51}
          fill="none"
          stroke={c.line}
          strokeWidth={7}
        />
        <Circle
          cx={62}
          cy={62}
          r={51}
          fill="none"
          stroke={c.forest}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={
            circumference * (1 - Math.max(0, Math.min(fraction, 1)))
          }
          rotation={-90}
          origin="62,62"
        />
      </Svg>
      {children}
    </View>
  );
}
export const s = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: c.screen },
  content: {
    width: '100%',
    maxWidth: 780,
    alignSelf: 'center',
    padding: space.base,
    paddingTop: space.lg,
    paddingBottom: space.xl,
    flexGrow: 1,
  },
  footer: {
    width: '100%',
    maxWidth: 780,
    alignSelf: 'center',
    padding: space.base,
    paddingBottom: space.lg,
    gap: space.sm,
    backgroundColor: c.screen,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: c.line,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  between: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  stack: { gap: space.base },
  button: {
    minHeight: 50,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { borderRadius: radius.lg, padding: space.lg, gap: space.md },
  input: {
    ...type.body,
    color: c.ink,
    borderWidth: 1,
    borderColor: c.controlBorder,
    borderRadius: radius.sm,
    padding: space.md,
    minHeight: 50,
    backgroundColor: c.screen,
  },
  choice: {
    minHeight: 76,
    padding: space.base,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.base,
  },
  radio: { width: 20, height: 20, borderRadius: radius.pill, borderWidth: 2 },
  banner: { padding: space.base, borderRadius: radius.md },
  smallAction: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: space.sm,
  },
  listRow: {
    minHeight: 76,
    paddingVertical: space.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: c.line,
  },
  tile: {
    width: 44,
    height: 44,
    backgroundColor: c.surface,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.base,
    paddingVertical: space.xxl,
  },
  emptyTile: {
    width: 76,
    height: 76,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.sage,
    marginBottom: space.sm,
  },
});
