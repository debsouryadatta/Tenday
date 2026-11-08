import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  AppState,
  Easing,
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { G, Path, Rect } from 'react-native-svg';
import { c } from '../theme/tokens';

/**
 * The Tenday assistant mark: a chat bubble with eyes and a spark, adapted from
 * MemoHack's animated mark and drawn in Night & Lime. Geometry is in a 64-unit
 * viewBox; timings are in ms. Moving parts are stacked Animated.Views so
 * transforms run on the native driver (and the same path works on web).
 */
export type MarkState = 'idle' | 'thinking' | 'happy' | 'sleep';
export type MarkKind = 'full' | 'line';

const VIEW = 64;
const BODY =
  'M32 9C46 9 55 17 55 30S46 51 32 51c-2.5 0-4.8-.3-7-.9L15 55l2-8.6C12 42.6 9 37 9 30 9 17 18 9 32 9Z';
const HAPPY_EYES = 'M22.5 31.5q3-5 6 0M35.5 31.5q3-5 6 0';
const CLOSED_EYES = 'M22.5 30.5h6M35.5 30.5h6';
export function sparkPath(x: number, y: number, r: number) {
  const k = r * 0.15;
  return `M${x} ${y - r}Q${x + k} ${y - k} ${x + r} ${y}Q${x + k} ${y + k} ${x} ${y + r}Q${x - k} ${y + k} ${x - r} ${y}Q${x - k} ${y - k} ${x} ${y - r}Z`;
}
const SPARK_X = 51;
const SPARK_Y = 12;
const SPARK_BOX = 14;
const SHAPES = {
  full: { eyeLeft: 22.5, eyeRight: 35.5, eyeTop: 24, eyeWidth: 6, eyeHeight: 11, sparkR: 9, halo: 3.5 },
  line: { eyeLeft: 23, eyeRight: 35.5, eyeTop: 25, eyeWidth: 5.5, eyeHeight: 10, sparkR: 8, halo: 4 },
} as const;

const LIVELY = Easing.bezier(0.3, 0.7, 0.4, 1);
const IN_OUT = Easing.bezier(0.42, 0, 0.58, 1);
const BLINK_LOW = 0.12;
const native = Platform.OS !== 'web';

const IDLE_MOVES = ['blink', 'blink', 'blink2', 'lookLeft', 'lookRight', 'hop', 'twinkle', 'blink'] as const;
const LINE_MOVES = ['blink', 'blink2'] as const;
type Move = (typeof IDLE_MOVES)[number];

function to(v: Animated.Value, value: number, duration: number, easing = LIVELY) {
  return Animated.timing(v, { toValue: value, duration, easing, useNativeDriver: native });
}
const wait = (ms: number) => Animated.delay(ms);

function useValues() {
  const ref = useRef<ReturnType<typeof make> | null>(null);
  function make() {
    return {
      bodyY: new Animated.Value(0),
      bodyX: new Animated.Value(1),
      bodyS: new Animated.Value(1),
      eyesX: new Animated.Value(0),
      eyesY: new Animated.Value(0),
      blink: new Animated.Value(1),
      eyes: new Animated.Value(1),
      happy: new Animated.Value(0),
      closed: new Animated.Value(0),
      turn: new Animated.Value(0),
      spark: new Animated.Value(1),
      sparkOpacity: new Animated.Value(1),
    };
  }
  if (!ref.current) ref.current = make();
  return ref.current;
}
type Values = ReturnType<typeof useValues>;

function blink(v: Values, delay = 0) {
  return Animated.sequence([wait(delay), to(v.blink, BLINK_LOW, 100, IN_OUT), to(v.blink, 1, 100, IN_OUT)]);
}
function hop(v: Values) {
  return Animated.parallel([
    Animated.sequence([to(v.bodyY, -4, 180), to(v.bodyY, 0, 180)]),
    Animated.sequence([wait(180), to(v.bodyX, 1.05, 180), to(v.bodyX, 0.98, 120), to(v.bodyX, 1, 120)]),
    Animated.sequence([wait(180), to(v.bodyS, 0.93, 180), to(v.bodyS, 1.02, 120), to(v.bodyS, 1, 120)]),
  ]);
}
function move(v: Values, m: Move): Animated.CompositeAnimation {
  switch (m) {
    case 'blink':
      return blink(v);
    case 'blink2':
      return Animated.sequence([blink(v), blink(v)]);
    case 'lookLeft':
    case 'lookRight':
      return Animated.parallel([
        Animated.sequence([to(v.eyesX, m === 'lookLeft' ? -3 : 3, 280), wait(620), to(v.eyesX, 0, 280)]),
        blink(v, 1060),
      ]);
    case 'hop':
      return hop(v);
    case 'twinkle':
      return Animated.parallel([
        Animated.sequence([to(v.turn, 90, 350), to(v.turn, 180, 350), to(v.turn, 0, 0)]),
        Animated.sequence([to(v.spark, 1.35, 350), to(v.spark, 1, 350)]),
      ]);
  }
}
function settle(v: Values) {
  return Animated.parallel([
    to(v.bodyY, 0, 200),
    to(v.bodyX, 1, 200),
    to(v.bodyS, 1, 200),
    to(v.eyesX, 0, 280),
    to(v.eyesY, 0, 280),
    to(v.blink, 1, 200),
    to(v.eyes, 1, 150),
    to(v.happy, 0, 150),
    to(v.closed, 0, 150),
    to(v.turn, 0, 200),
    to(v.spark, 1, 200),
    to(v.sparkOpacity, 1, 150),
  ]);
}
function enter(v: Values, state: Exclude<MarkState, 'idle'>): Animated.CompositeAnimation {
  switch (state) {
    case 'thinking':
      v.turn.setValue(0);
      return Animated.parallel([
        to(v.eyesX, 2, 280),
        to(v.eyesY, -3, 280),
        Animated.loop(Animated.sequence([wait(2288), to(v.blink, BLINK_LOW, 156, IN_OUT), to(v.blink, 1, 156, IN_OUT)])),
        Animated.loop(Animated.timing(v.turn, { toValue: 360, duration: 1600, easing: Easing.linear, useNativeDriver: native })),
        Animated.loop(Animated.sequence([to(v.spark, 1.25, 800, Easing.linear), to(v.spark, 1, 800, Easing.linear)])),
        Animated.loop(Animated.sequence([to(v.bodyY, -1.5, 600, IN_OUT), to(v.bodyY, 0, 600, IN_OUT)])),
      ]);
    case 'happy':
      return Animated.parallel([to(v.eyes, 0, 150), to(v.happy, 1, 150), hop(v)]);
    case 'sleep':
      return Animated.parallel([to(v.eyes, 0, 150), to(v.closed, 1, 150), to(v.sparkOpacity, 0.45, 150)]);
  }
}

function useStill() {
  const [reduced, setReduced] = useState(false);
  const [active, setActive] = useState(AppState.currentState !== 'background');
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduced).catch(() => {});
    const a = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    const b = AppState.addEventListener('change', (s) => setActive(s === 'active'));
    return () => {
      a.remove();
      b.remove();
    };
  }, []);
  return { reduced, active };
}

function Spark({ kind, color, halo }: { kind: MarkKind; color: string; halo: string }) {
  const { sparkR, halo: w } = SHAPES[kind];
  const d = sparkPath(SPARK_X, SPARK_Y, sparkR);
  return (
    <>
      <Path d={d} fill={halo} stroke={halo} strokeWidth={w} />
      <Path d={d} fill={color} />
    </>
  );
}

export function AssistantMark({
  size = 32,
  state = 'idle',
  live = true,
  kind = 'full',
  color = c.ink,
  halo,
  accessibilityLabel,
  style,
}: {
  size?: number;
  state?: MarkState;
  /** Random idle moves (blink, glance, hop, twinkle). Other states animate regardless. */
  live?: boolean;
  /** `full` is the ink bubble with lime face; `line` is an outline icon in `color`. */
  kind?: MarkKind;
  color?: string;
  /** Colour behind the spark (match the surface the mark sits on). */
  halo?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const v = useValues();
  const { reduced, active } = useStill();
  const shown: MarkState = kind === 'line' ? 'idle' : state;
  const animate = !reduced && active;
  const first = useRef(true);
  useEffect(() => {
    if (!animate) return;
    let anim: Animated.CompositeAnimation | null = null;
    if (!first.current) settle(v).start();
    first.current = false;
    if (shown !== 'idle') {
      anim = enter(v, shown);
      anim.start();
    }
    return () => {
      anim?.stop();
    };
  }, [shown, animate, v]);
  useEffect(() => {
    if (!live || !animate || shown !== 'idle') return;
    const moves: readonly Move[] = kind === 'line' ? LINE_MOVES : IDLE_MOVES;
    let last: Move | undefined;
    let timer: ReturnType<typeof setTimeout>;
    let current: Animated.CompositeAnimation | null = null;
    const step = () => {
      let m: Move;
      do m = moves[Math.floor(Math.random() * moves.length)];
      while (m === last && !m.startsWith('blink'));
      last = m;
      current = move(v, m);
      current.start();
      timer = setTimeout(step, kind === 'line' ? 9000 + Math.random() * 6000 : 2500 + Math.random() * 4000);
    };
    timer = setTimeout(step, 600 + Math.random() * 2600);
    return () => {
      clearTimeout(timer);
      current?.stop();
    };
  }, [live, animate, shown, kind, v]);

  const unit = size / VIEW;
  const s = SHAPES[kind];
  const full = kind === 'full';
  const bodyFill = full ? c.ink : 'none';
  const eyeFill = full ? c.lime : color;
  const sparkFill = full ? c.lime : color;
  const haloFill = halo ?? (full ? c.ink : c.screen);
  const box = `0 0 ${VIEW} ${VIEW}`;
  const body = (
    <Path
      d={BODY}
      fill={bodyFill}
      stroke={full ? undefined : color}
      strokeWidth={full ? undefined : 5}
      strokeLinejoin="round"
    />
  );
  const face = (d: string) => (
    <Path d={d} fill="none" stroke={eyeFill} strokeWidth={3} strokeLinecap="round" />
  );

  if (!animate || (!live && shown === 'idle'))
    return (
      <View
        accessible={!!accessibilityLabel}
        accessibilityRole={accessibilityLabel ? 'image' : undefined}
        accessibilityLabel={accessibilityLabel}
        style={[{ width: size, height: size, pointerEvents: 'none' }, style]}
      >
        <Svg width={size} height={size} viewBox={box}>
          {body}
          {shown === 'happy' ? (
            face(HAPPY_EYES)
          ) : shown === 'sleep' ? (
            face(CLOSED_EYES)
          ) : (
            <G transform={shown === 'thinking' ? 'translate(2 -3)' : undefined}>
              <Rect x={s.eyeLeft} y={s.eyeTop} width={s.eyeWidth} height={s.eyeHeight} rx={s.eyeWidth / 2} fill={eyeFill} />
              <Rect x={s.eyeRight} y={s.eyeTop} width={s.eyeWidth} height={s.eyeHeight} rx={s.eyeWidth / 2} fill={eyeFill} />
            </G>
          )}
          <G opacity={shown === 'sleep' ? 0.45 : 1}>
            <Spark kind={kind} color={sparkFill} halo={haloFill} />
          </G>
        </Svg>
      </View>
    );

  const eye = (left: number): ViewStyle => ({
    position: 'absolute',
    left: left * unit,
    top: 0,
    width: s.eyeWidth * unit,
    height: s.eyeHeight * unit,
    borderRadius: (s.eyeWidth / 2) * unit,
    backgroundColor: eyeFill,
  });
  const mul = (a: Animated.Value) => Animated.multiply(a, unit);
  return (
    <View
      accessible={!!accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      style={[{ width: size, height: size, pointerEvents: 'none' }, style]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ translateY: mul(v.bodyY) }, { scaleX: v.bodyX }, { scaleY: v.bodyS }] },
        ]}
      >
        <Svg width={size} height={size} viewBox={box}>
          {body}
        </Svg>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { transform: [{ translateX: mul(v.eyesX) }, { translateY: mul(v.eyesY) }] },
          ]}
        >
          <Animated.View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: s.eyeTop * unit,
              height: s.eyeHeight * unit,
              opacity: v.eyes,
              transform: [{ scaleY: v.blink }],
            }}
          >
            <View style={eye(s.eyeLeft)} />
            <View style={eye(s.eyeRight)} />
          </Animated.View>
          {full && (
            <>
              <Animated.View style={[StyleSheet.absoluteFill, { opacity: v.happy }]}>
                <Svg width={size} height={size} viewBox={box}>
                  {face(HAPPY_EYES)}
                </Svg>
              </Animated.View>
              <Animated.View style={[StyleSheet.absoluteFill, { opacity: v.closed }]}>
                <Svg width={size} height={size} viewBox={box}>
                  {face(CLOSED_EYES)}
                </Svg>
              </Animated.View>
            </>
          )}
        </Animated.View>
      </Animated.View>
      <Animated.View
        style={{
          position: 'absolute',
          left: (SPARK_X - SPARK_BOX) * unit,
          top: (SPARK_Y - SPARK_BOX) * unit,
          width: SPARK_BOX * 2 * unit,
          height: SPARK_BOX * 2 * unit,
          opacity: v.sparkOpacity,
          transform: [
            { rotate: v.turn.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) },
            { scale: v.spark },
          ],
        }}
      >
        <Svg
          width={SPARK_BOX * 2 * unit}
          height={SPARK_BOX * 2 * unit}
          viewBox={`${SPARK_X - SPARK_BOX} ${SPARK_Y - SPARK_BOX} ${SPARK_BOX * 2} ${SPARK_BOX * 2}`}
        >
          <Spark kind={kind} color={sparkFill} halo={haloFill} />
        </Svg>
      </Animated.View>
    </View>
  );
}
