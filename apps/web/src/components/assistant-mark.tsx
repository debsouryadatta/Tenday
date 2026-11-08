import { useEffect, useRef, useState } from 'react';

/**
 * The Tenday assistant mark for web: a chat bubble with eyes and a spark,
 * matching apps/mobile/src/components/assistant-mark.tsx (same 64-unit
 * geometry). Looping states are CSS keyframes (see `.am` in styles.css);
 * random idle moves use the Web Animations API. Respects reduced motion and
 * pauses while the document is hidden.
 */
export type MarkState = 'idle' | 'thinking' | 'happy' | 'sleep';
export type MarkKind = 'full' | 'line';

const BODY =
  'M32 9C46 9 55 17 55 30S46 51 32 51c-2.5 0-4.8-.3-7-.9L15 55l2-8.6C12 42.6 9 37 9 30 9 17 18 9 32 9Z';
const HAPPY_EYES = 'M22.5 31.5q3-5 6 0M35.5 31.5q3-5 6 0';
const CLOSED_EYES = 'M22.5 30.5h6M35.5 30.5h6';
function sparkPath(x: number, y: number, r: number) {
  const k = r * 0.15;
  return `M${x} ${y - r}Q${x + k} ${y - k} ${x + r} ${y}Q${x + k} ${y + k} ${x} ${y + r}Q${x - k} ${y + k} ${x - r} ${y}Q${x - k} ${y - k} ${x} ${y - r}Z`;
}
const SHAPES = {
  full: { eyeLeft: 22.5, eyeRight: 35.5, eyeTop: 24, eyeWidth: 6, eyeHeight: 11, sparkR: 9, halo: 3.5 },
  line: { eyeLeft: 23, eyeRight: 35.5, eyeTop: 25, eyeWidth: 5.5, eyeHeight: 10, sparkR: 8, halo: 4 },
} as const;
const IDLE_MOVES = ['blink', 'blink', 'blink2', 'lookLeft', 'lookRight', 'hop', 'twinkle', 'blink'] as const;
const LINE_MOVES = ['blink', 'blink2'] as const;
type Move = (typeof IDLE_MOVES)[number];
const LIVELY = 'cubic-bezier(.3,.7,.4,1)';
const IN_OUT = 'cubic-bezier(.42,0,.58,1)';

function useStill() {
  const [reduced, setReduced] = useState(
    () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [visible, setVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState !== 'hidden',
  );
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const onMq = () => setReduced(mq.matches);
    const onVis = () => setVisible(document.visibilityState !== 'hidden');
    mq.addEventListener('change', onMq);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      mq.removeEventListener('change', onMq);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);
  return { reduced, visible };
}

function play(el: Element | null, frames: Keyframe[], duration: number, easing = LIVELY, delay = 0) {
  return el?.animate(frames, { duration, easing, delay, fill: 'none' });
}

export function AssistantMark({
  size = 32,
  state = 'idle',
  live = true,
  kind = 'full',
  color = 'var(--ink)',
  halo,
  label,
  className = '',
}: {
  size?: number;
  state?: MarkState;
  /** Random idle moves. Other states animate regardless. */
  live?: boolean;
  /** `full`: ink bubble with lime face. `line`: outline icon in `color`. */
  kind?: MarkKind;
  color?: string;
  /** Colour behind the spark (match the surface the mark sits on). */
  halo?: string;
  label?: string;
  className?: string;
}) {
  const { reduced, visible } = useStill();
  const shown: MarkState = kind === 'line' ? 'idle' : state;
  const animate = !reduced && visible;
  const body = useRef<SVGGElement>(null),
    eyes = useRef<SVGGElement>(null),
    lids = useRef<SVGGElement>(null),
    spark = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!live || !animate || shown !== 'idle') return;
    const moves: readonly Move[] = kind === 'line' ? LINE_MOVES : IDLE_MOVES;
    let last: Move | undefined;
    let timer: ReturnType<typeof setTimeout>;
    const running: (Animation | undefined)[] = [];
    const blink = (delay = 0) =>
      play(lids.current, [{ transform: 'scaleY(1)' }, { transform: 'scaleY(.12)', easing: IN_OUT }, { transform: 'scaleY(1)' }], 200, IN_OUT, delay);
    const step = () => {
      let m: Move;
      do m = moves[Math.floor(Math.random() * moves.length)];
      while (m === last && !m.startsWith('blink'));
      last = m;
      switch (m) {
        case 'blink':
          running.push(blink());
          break;
        case 'blink2':
          running.push(blink(), blink(220));
          break;
        case 'lookLeft':
        case 'lookRight': {
          const x = m === 'lookLeft' ? -3 : 3;
          running.push(
            play(
              eyes.current,
              [
                { transform: 'translate(0,0)' },
                { transform: `translate(${x}px,0)`, offset: 0.24 },
                { transform: `translate(${x}px,0)`, offset: 0.76 },
                { transform: 'translate(0,0)' },
              ],
              1180,
            ),
            blink(1060),
          );
          break;
        }
        case 'hop':
          running.push(
            play(
              body.current,
              [
                { transform: 'translateY(0) scale(1,1)' },
                { transform: 'translateY(-4px) scale(1,1)', offset: 0.3 },
                { transform: 'translateY(0) scale(1.05,.93)', offset: 0.6 },
                { transform: 'translateY(0) scale(.98,1.02)', offset: 0.8 },
                { transform: 'translateY(0) scale(1,1)' },
              ],
              600,
            ),
          );
          break;
        case 'twinkle':
          running.push(
            play(
              spark.current,
              [
                { transform: 'rotate(0deg) scale(1)' },
                { transform: 'rotate(90deg) scale(1.35)' },
                { transform: 'rotate(180deg) scale(1)' },
              ],
              700,
            ),
          );
          break;
      }
      timer = setTimeout(step, kind === 'line' ? 9000 + Math.random() * 6000 : 2500 + Math.random() * 4000);
    };
    timer = setTimeout(step, 600 + Math.random() * 2600);
    return () => {
      clearTimeout(timer);
      running.forEach((a) => a?.cancel());
    };
  }, [live, animate, shown, kind]);

  const s = SHAPES[kind];
  const full = kind === 'full';
  const eyeFill = full ? 'var(--lime)' : color;
  const haloFill = halo ?? (full ? 'var(--ink)' : 'var(--screen)');
  const d = sparkPath(51, 12, s.sparkR);
  const face = (p: string, cls: string) => (
    <path className={cls} d={p} fill="none" stroke={eyeFill} strokeWidth={3} strokeLinecap="round" />
  );
  return (
    <svg
      className={`am ${className}`}
      data-state={shown}
      data-kind={kind}
      data-still={animate ? undefined : ''}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <g ref={body} className="am-body">
        <path
          d={BODY}
          fill={full ? 'var(--ink)' : 'none'}
          stroke={full ? undefined : color}
          strokeWidth={full ? undefined : 5}
          strokeLinejoin="round"
        />
        <g ref={eyes} className="am-eyes">
          <g ref={lids} className="am-lids" style={{ transformOrigin: `32px ${s.eyeTop + s.eyeHeight / 2}px` }}>
            <rect x={s.eyeLeft} y={s.eyeTop} width={s.eyeWidth} height={s.eyeHeight} rx={s.eyeWidth / 2} fill={eyeFill} />
            <rect x={s.eyeRight} y={s.eyeTop} width={s.eyeWidth} height={s.eyeHeight} rx={s.eyeWidth / 2} fill={eyeFill} />
          </g>
          {full && face(HAPPY_EYES, 'am-happy')}
          {full && face(CLOSED_EYES, 'am-closed')}
        </g>
      </g>
      <g ref={spark} className="am-spark">
        <path d={d} fill={haloFill} stroke={haloFill} strokeWidth={s.halo} />
        <path d={d} fill={full ? 'var(--lime)' : color} />
      </g>
    </svg>
  );
}
