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
  type ScrollViewInstance,
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
  Check,
  ChevronRight,
  CircleAlert,
  Info,
  TriangleAlert,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useNavigation, useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import carefold from '../../assets/carefold.png';
import { c, layout, radius, space, type } from '../theme/tokens';

/* ───────────────────────── Text ───────────────────────── */

export function Text({
  variant = 'body',
  color = c.ink,
  tabular = false,
  style,
  ...props
}: TextProps & {
  variant?: keyof typeof type;
  color?: string;
  tabular?: boolean;
}) {
  return (
    <NativeText
      {...props}
      style={[
        type[variant],
        { color },
        tabular && { fontVariant: ['tabular-nums'] },
        style,
      ]}
    />
  );
}

/* ───────────────────────── Buttons ───────────────────────── */

type ButtonVariant =
  | 'primary'
  | 'lime'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger';
const buttonColors: Record<
  ButtonVariant,
  { bg: string; pressed: string; ink: string; border?: string }
> = {
  primary: { bg: c.ink, pressed: c.inkSoft, ink: c.onInk },
  lime: { bg: c.lime, pressed: c.limePressed, ink: c.ink },
  secondary: { bg: c.surface, pressed: c.surfaceStrong, ink: c.ink },
  outline: {
    bg: c.screen,
    pressed: c.surface,
    ink: c.ink,
    border: c.lineStrong,
  },
  ghost: { bg: 'transparent', pressed: c.surface, ink: c.ink },
  danger: { bg: c.errorSurface, pressed: '#FFDCD5', ink: c.error },
};
export function Button({
  title,
  onPress,
  variant = 'primary',
  icon: Icon,
  trailingIcon: Trailing,
  busy,
  disabled,
  compact = false,
  size = 'large',
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: LucideIcon;
  trailingIcon?: LucideIcon;
  busy?: boolean;
  disabled?: boolean;
  compact?: boolean;
  size?: 'large' | 'medium' | 'small';
}) {
  const tone = buttonColors[variant];
  const off = disabled && !busy;
  const ink = off ? c.disabledInk : tone.ink;
  const height = size === 'large' ? 56 : size === 'medium' ? 46 : 38;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        {
          minHeight: height,
          paddingHorizontal: size === 'small' ? space.base : space.lg,
          backgroundColor: off ? c.disabled : pressed ? tone.pressed : tone.bg,
          borderWidth: tone.border ? 1 : 0,
          borderColor: tone.border,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        compact && { alignSelf: 'flex-start' },
      ]}
    >
      {busy ? (
        <>
          <ActivityIndicator color={ink} size="small" />
          <Text
            variant={size === 'small' ? 'smallStrong' : 'strong'}
            color={ink}
            numberOfLines={1}
            style={{ flexShrink: 1 }}
          >
            {title}
          </Text>
        </>
      ) : (
        <>
          {Icon && (
            <Icon
              size={size === 'small' ? 16 : 19}
              color={variant === 'primary' && !off ? c.lime : ink}
              strokeWidth={2.4}
            />
          )}
          <Text
            variant={size === 'small' ? 'smallStrong' : 'strong'}
            style={{ flexShrink: 1, textAlign: 'center' }}
            color={ink}
          >
            {title}
          </Text>
          {Trailing && (
            <Trailing size={size === 'small' ? 16 : 18} color={ink} />
          )}
        </>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon: Icon,
  label,
  onPress,
  tone = 'surface',
  size = 44,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  tone?: 'surface' | 'ink' | 'plain' | 'lime' | 'outline';
  size?: number;
  disabled?: boolean;
}) {
  const bg =
    tone === 'ink'
      ? c.ink
      : tone === 'lime'
        ? c.lime
        : tone === 'surface'
          ? c.surface
          : c.screen;
  const ink = tone === 'ink' ? c.lime : c.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={size < 44 ? (44 - size) / 2 : 0}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: tone === 'outline' ? 1 : 0,
          borderColor: c.line,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        },
      ]}
    >
      <Icon size={Math.round(size * 0.45)} color={ink} strokeWidth={2.2} />
    </Pressable>
  );
}

/** Small text link with an optional trailing chevron. */
export function LinkButton({
  title,
  onPress,
  color = c.ink,
  chevron = true,
}: {
  title: string;
  onPress: () => void;
  color?: string;
  chevron?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [
        s.row,
        { gap: 2, minHeight: 32, opacity: pressed ? 0.55 : 1 },
      ]}
    >
      <Text variant="smallStrong" color={color}>
        {title}
      </Text>
      {chevron && <ChevronRight size={16} color={color} strokeWidth={2.4} />}
    </Pressable>
  );
}

/* ───────────────────────── Brand ───────────────────────── */

export function Emblem({
  size = 28,
  color = c.ink,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Image
      source={carefold}
      accessibilityIgnoresInvertColors
      style={{ width: size, height: size, tintColor: color }}
      resizeMode="contain"
    />
  );
}
export function Brand({
  large = false,
  wordmark = true,
}: {
  large?: boolean;
  wordmark?: boolean;
}) {
  if (large && !wordmark)
    return (
      <View
        accessible
        accessibilityLabel="Tenday"
        style={{
          width: 88,
          height: 88,
          borderRadius: 26,
          backgroundColor: c.ink,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Emblem size={52} color={c.lime} />
      </View>
    );
  return (
    <View
      style={[s.row, { gap: 7 }]}
      accessible
      accessibilityLabel="Tenday"
    >
      <Emblem size={large ? 36 : 22} />
      {wordmark && (
        <Text
          variant={large ? 'title' : 'heading'}
          style={{ fontFamily: type.section.fontFamily, letterSpacing: -0.6 }}
        >
          Tenday
        </Text>
      )}
    </View>
  );
}

export function Avatar({
  label,
  size = 40,
  tone = 'surface',
}: {
  label: string;
  size?: number;
  tone?: 'surface' | 'ink' | 'lime' | 'protein' | 'fat' | 'carbs';
}) {
  const bg = {
    surface: c.surface,
    ink: c.ink,
    lime: c.lime,
    protein: c.proteinSoft,
    fat: c.fatSoft,
    carbs: c.carbsSoft,
  }[tone];
  const ink = tone === 'ink' ? c.lime : c.ink;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        variant={size >= 48 ? 'section' : 'smallStrong'}
        color={ink}
        style={size < 48 ? { fontSize: Math.round(size * 0.38) } : undefined}
      >
        {label}
      </Text>
    </View>
  );
}

/* ───────────────────────── Screen ───────────────────────── */

export function Screen({
  children,
  footer,
  scroll = true,
  title,
  eyebrow,
  subtitle,
  back = false,
  close = false,
  trailing,
  scrollRef,
  bottomInset = 0,
  floating,
  tabbed = false,
}: {
  children: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  title?: string;
  eyebrow?: string;
  subtitle?: string;
  back?: boolean;
  close?: boolean;
  trailing?: ReactNode;
  scrollRef?: React.RefObject<ScrollViewInstance | null>;
  /** Extra space reserved at the end of the scroll content (e.g. tab bar). */
  bottomInset?: number;
  /** Absolutely positioned layer above the scroll view (e.g. a FAB). */
  floating?: ReactNode;
  /** Rendered above a tab bar that already pads the bottom safe area. */
  tabbed?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const contents = (
    <View style={[s.content, { paddingBottom: space.xxl + bottomInset }]}>
      {(back || close || trailing) && (
        <View style={[s.between, { marginBottom: space.lg, minHeight: 44 }]}>
          {back || close ? <ScreenBackButton close={close} /> : <View />}
          {trailing}
        </View>
      )}
      {title && (
        <View style={{ gap: space.sm, marginBottom: space.xl }}>
          {eyebrow && (
            <Text variant="eyebrow" color={c.secondary}>
              {eyebrow}
            </Text>
          )}
          <Text variant="display" accessibilityRole="header">
            {title}
          </Text>
          {subtitle && (
            <Text color={c.secondary} style={{ maxWidth: 520 }}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
      {children}
    </View>
  );
  return (
    <SafeAreaView style={s.screen} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            ref={scrollRef}
            style={s.flex}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}
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
              {
                paddingBottom: tabbed
                  ? space.sm
                  : Math.max(insets.bottom + space.sm, space.base),
              },
            ]}
          >
            <View style={s.footerInner}>{footer}</View>
          </View>
        )}
        {floating}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
function ScreenBackButton({ close }: { close: boolean }) {
  const router = useRouter();
  const navigation = useNavigation();
  return (
    <IconButton
      label={close ? 'Close' : 'Go back'}
      icon={close ? X : ArrowLeft}
      onPress={() =>
        navigation.canGoBack() ? navigation.goBack() : router.replace('/')
      }
    />
  );
}

/* ───────────────────────── Surfaces ───────────────────────── */

type CardTone = 'surface' | 'lime' | 'outline' | 'ink' | 'white' | 'neutral' | 'sage';
export function Card({
  children,
  tone = 'surface',
  style,
  onPress,
  accessibilityLabel,
}: {
  children: ReactNode;
  tone?: CardTone;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const t = tone === 'neutral' ? 'surface' : tone === 'sage' ? 'lime' : tone;
  const base: StyleProp<ViewStyle> = [
    s.card,
    {
      backgroundColor:
        t === 'lime'
          ? c.limeSoft
          : t === 'ink'
            ? c.ink
            : t === 'outline' || t === 'white'
              ? c.screen
              : c.surface,
      borderWidth: t === 'outline' ? 1 : 0,
      borderColor: c.line,
    },
    style,
  ];
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        base,
        { transform: [{ scale: pressed ? 0.985 : 1 }], opacity: pressed ? 0.92 : 1 },
      ]}
    >
      {children}
    </Pressable>
  ) : (
    <View style={base}>{children}</View>
  );
}

/** Groups rows inside one rounded surface with hairline separators. */
export function Group({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[s.group, style]}>
      {items.map((child, i) => (
        <View
          key={i}
          style={
            i > 0 && {
              borderTopWidth: StyleSheet.hairlineWidth,
              borderColor: c.lineStrong,
            }
          }
        >
          {child}
        </View>
      ))}
    </View>
  );
}

/* ───────────────────────── Inputs ───────────────────────── */

export function Input({
  label,
  hint,
  error,
  trailing,
  ...props
}: TextInputProps & {
  label: string;
  hint?: string;
  error?: string;
  trailing?: ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: space.sm, flexShrink: 1 }}>
      <Text variant="smallStrong" color={c.inkSoft}>
        {label}
      </Text>
      <View
        style={[
          s.inputWrap,
          focused && { borderColor: c.ink, backgroundColor: c.screen },
          !!error && { borderColor: c.error },
          props.multiline && { alignItems: 'flex-start' },
        ]}
      >
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={c.muted}
          selectionColor={c.ink}
          cursorColor={c.ink}
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
            props.multiline && {
              minHeight: 112,
              textAlignVertical: 'top',
              paddingTop: 14,
            },
            props.style,
          ]}
        />
        {trailing}
      </View>
      {(error || hint) && (
        <Text variant="caption" color={error ? c.error : c.secondary}>
          {error || hint}
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
  hint?: string;
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
          backgroundColor: selected ? c.screen : c.surface,
          borderColor: selected ? c.ink : 'transparent',
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      {Icon && (
        <View
          style={[
            s.tile,
            { backgroundColor: selected ? c.lime : c.screen },
          ]}
        >
          <Icon size={22} color={c.ink} strokeWidth={2} />
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
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
            borderColor: selected ? c.ink : c.lineStrong,
            backgroundColor: selected ? c.ink : 'transparent',
          },
        ]}
      >
        {selected && <Check size={13} color={c.lime} strokeWidth={3.2} />}
      </View>
    </Pressable>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  disabled,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <View accessibilityRole="tablist" style={s.segmented}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on, disabled }}
            disabled={disabled}
            onPress={() => onChange(o.value)}
            style={[
              s.segment,
              on && {
                backgroundColor: c.screen,
                shadowColor: c.ink,
                shadowOpacity: 0.08,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              },
            ]}
          >
            <Text variant="smallStrong" color={on ? c.ink : c.secondary}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({
  label,
  icon: Icon,
  onPress,
  tone = 'surface',
  selected,
}: {
  label: string;
  icon?: LucideIcon;
  onPress?: () => void;
  tone?: 'surface' | 'lime' | 'ink' | 'outline' | 'warning' | 'success';
  selected?: boolean;
}) {
  const t = selected ? 'ink' : tone;
  const bg = {
    surface: c.surface,
    lime: c.limeSoft,
    ink: c.ink,
    outline: c.screen,
    warning: c.warningSurface,
    success: c.successSurface,
  }[t];
  const ink = {
    surface: c.ink,
    lime: c.limeInk,
    ink: c.onInk,
    outline: c.ink,
    warning: c.warning,
    success: c.success,
  }[t];
  const body = (pressed = false) => (
    <View
      style={[
        s.chip,
        {
          backgroundColor: bg,
          borderWidth: t === 'outline' ? 1 : 0,
          borderColor: c.lineStrong,
          opacity: pressed ? 0.7 : 1,
          minHeight: onPress ? 38 : 26,
          paddingHorizontal: onPress ? 14 : 10,
        },
      ]}
    >
      {Icon && (
        <Icon size={onPress ? 15 : 13} color={t === 'ink' ? c.lime : ink} strokeWidth={2.4} />
      )}
      <Text variant={onPress ? 'smallStrong' : 'caption'} color={ink}>
        {label}
      </Text>
    </View>
  );
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
    >
      {({ pressed }) => body(pressed)}
    </Pressable>
  ) : (
    body()
  );
}

/* ───────────────────────── Feedback ───────────────────────── */

export function Banner({
  children,
  error = false,
  tone,
  title,
  action,
}: {
  children: ReactNode;
  error?: boolean;
  tone?: 'info' | 'error' | 'warning' | 'lime';
  title?: string;
  action?: ReactNode;
}) {
  const t = tone ?? (error ? 'error' : 'info');
  const bg = {
    info: c.surface,
    error: c.errorSurface,
    warning: c.warningSurface,
    lime: c.limeSoft,
  }[t];
  const ink = {
    info: c.inkSoft,
    error: c.error,
    warning: c.warning,
    lime: c.limeInk,
  }[t];
  const Icon =
    t === 'error' ? CircleAlert : t === 'warning' ? TriangleAlert : Info;
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[s.banner, { backgroundColor: bg }]}
    >
      <Icon size={18} color={ink} strokeWidth={2.2} style={{ marginTop: 1 }} />
      <View style={{ flex: 1, gap: space.xs }}>
        {title && (
          <Text variant="smallStrong" color={t === 'info' ? c.ink : ink}>
            {title}
          </Text>
        )}
        {typeof children === 'string' ? (
          <Text variant="small" color={ink}>
            {children}
          </Text>
        ) : (
          children
        )}
        {action}
      </View>
    </View>
  );
}

export function Section({
  title,
  action,
  onPress,
  subtitle,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
  subtitle?: string;
}) {
  return (
    <View style={{ marginTop: space.xl, marginBottom: space.md, gap: 2 }}>
      <View style={s.between}>
        <Text variant="section" accessibilityRole="header">
          {title}
        </Text>
        {action && onPress && <LinkButton title={action} onPress={onPress} />}
      </View>
      {subtitle && (
        <Text variant="small" color={c.secondary}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

export function Row({
  title,
  subtitle,
  icon: Icon,
  leading,
  trailing,
  onPress,
  chevron = true,
  padded = false,
  accessibilityLabel,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  /** Use inside a `Group` (adds horizontal padding). */
  padded?: boolean;
  accessibilityLabel?: string;
}) {
  const body = (
    <>
      {leading ??
        (Icon && (
          <View style={s.tile}>
            <Icon size={20} color={c.ink} strokeWidth={2} />
          </View>
        ))}
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="strong" numberOfLines={2}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="small" color={c.secondary} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
      {trailing}
      {onPress && chevron && (
        <ChevronRight size={18} color={c.muted} strokeWidth={2.2} />
      )}
    </>
  );
  const style = [s.listRow, padded && { paddingHorizontal: space.base }];
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        style,
        pressed && { backgroundColor: padded ? c.surfaceStrong : c.surface },
      ]}
    >
      {body}
    </Pressable>
  ) : (
    <View style={style}>{body}</View>
  );
}

export function Empty({
  icon: Icon,
  title,
  body,
  action,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <View style={[s.empty, compact && { flexGrow: 0, paddingVertical: space.xl }]}>
      <View style={s.emptyTile}>
        <Icon size={28} color={c.ink} strokeWidth={1.8} />
      </View>
      <Text variant="section" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      <Text
        color={c.secondary}
        style={{ textAlign: 'center', maxWidth: 320 }}
      >
        {body}
      </Text>
      {action && <View style={{ marginTop: space.sm }}>{action}</View>}
    </View>
  );
}

export function Loading({ label = 'Opening your day…' }: { label?: string }) {
  return (
    <SafeAreaView style={[s.screen, { alignItems: 'center', justifyContent: 'center', gap: space.lg }]}>
      <Brand large wordmark={false} />
      <View style={{ alignItems: 'center', gap: space.sm, alignSelf: 'stretch' }}>
        <ActivityIndicator color={c.ink} size="small" />
        <Text variant="small" color={c.secondary} style={{ textAlign: 'center', alignSelf: 'stretch' }}>
          {label}
        </Text>
      </View>
    </SafeAreaView>
  );
}

/* ───────────────────────── Data display ───────────────────────── */

export function ProgressRing({
  fraction,
  children,
  size = 124,
  stroke = 10,
  color = c.ink,
  track = c.surfaceStrong,
}: {
  fraction: number;
  children?: ReactNode;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const f = Math.max(0, Math.min(fraction, 1));
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={track}
          strokeWidth={stroke}
        />
        {f > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - f)}
            rotation={-90}
            origin={`${size / 2},${size / 2}`}
          />
        )}
      </Svg>
      {children}
    </View>
  );
}

export function Bar({
  fraction,
  color,
  track = c.surfaceStrong,
  height = 6,
}: {
  fraction: number;
  color: string;
  track?: string;
  height?: number;
}) {
  const f = Math.max(0, Math.min(fraction, 1));
  return (
    <View
      style={{
        height,
        borderRadius: height,
        backgroundColor: track,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${f * 100}%`,
          minWidth: f > 0 ? height : 0,
          height,
          borderRadius: height,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

/** A macro tile: dot, label, big value, and a share-of-meal bar. */
export function MacroTile({
  label,
  value,
  unit = 'g',
  color,
  fraction,
}: {
  label: string;
  value: number;
  unit?: string;
  color: string;
  fraction: number;
}) {
  return (
    <View
      style={s.macroTile}
      accessible
      accessibilityLabel={`${label} ${Math.round(value)} ${unit === 'g' ? 'grams' : unit}`}
    >
      <View style={[s.row, { gap: 6 }]}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        <Text variant="caption" color={c.secondary}>
          {label}
        </Text>
      </View>
      <Text variant="metricSm" tabular>
        {Math.round(value)}
        <Text variant="small" color={c.secondary}>
          {' '}
          {unit}
        </Text>
      </Text>
      <Bar fraction={fraction} color={color} height={5} />
    </View>
  );
}

export const s = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: c.screen },
  content: {
    width: '100%',
    maxWidth: layout.maxContent,
    alignSelf: 'center',
    paddingHorizontal: layout.gutter,
    paddingTop: space.md,
    flexGrow: 1,
  },
  footer: {
    width: '100%',
    paddingTop: space.md,
    paddingHorizontal: layout.gutter,
    backgroundColor: c.screen,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: c.line,
  },
  footerInner: {
    width: '100%',
    maxWidth: layout.maxContent - layout.gutter * 2,
    alignSelf: 'center',
    gap: space.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  between: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  stack: { gap: space.md },
  button: {
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingVertical: space.sm,
  },
  card: { borderRadius: radius.lg, padding: space.lg, gap: space.md },
  group: {
    borderRadius: radius.lg,
    backgroundColor: c.surface,
    overflow: 'hidden',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: radius.md,
    backgroundColor: c.surface,
    paddingRight: space.xs,
  },
  input: {
    ...type.body,
    flex: 1,
    color: c.ink,
    paddingHorizontal: space.base,
    paddingVertical: 13,
    minHeight: 52,
  },
  choice: {
    minHeight: 76,
    padding: space.base,
    borderRadius: radius.lg,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmented: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: c.surface,
  },
  segment: {
    flex: 1,
    minHeight: 42,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  banner: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.base,
    borderRadius: radius.md,
  },
  listRow: {
    minHeight: 68,
    paddingVertical: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  tile: {
    width: 44,
    height: 44,
    backgroundColor: c.screen,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingVertical: space.xxl,
  },
  emptyTile: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.limeSoft,
    marginBottom: space.sm,
  },
  macroTile: {
    flex: 1,
    minWidth: 92,
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    padding: 14,
    gap: space.sm,
  },
});
