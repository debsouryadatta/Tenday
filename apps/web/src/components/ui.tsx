import {
  Children,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  CircleAlert,
  Info,
  LoaderCircle,
  TriangleAlert,
  X,
  type LucideIcon,
} from 'lucide-react';

const emblemSrc = `${import.meta.env.BASE_URL}carefold.png`;

/* ───────────── Brand ───────────── */

/** The Carefold emblem, tinted with a CSS mask so it can be any colour. */
export function Emblem({
  size = 28,
  color = 'var(--ink)',
}: {
  size?: number;
  color?: string;
}) {
  return (
    <span
      aria-hidden
      className="emblem"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        WebkitMaskImage: `url(${emblemSrc})`,
        maskImage: `url(${emblemSrc})`,
      }}
    />
  );
}
export function Brand({ link = true }: { link?: boolean }) {
  const body = (
    <>
      <Emblem size={22} />
      <span>Tenday</span>
    </>
  );
  return link ? (
    <Link className="brand" to="/" aria-label="Tenday home">
      {body}
    </Link>
  ) : (
    <span className="brand" aria-label="Tenday">
      {body}
    </span>
  );
}
export function BrandTile({ size = 88 }: { size?: number }) {
  return (
    <span
      className="brand-tile"
      role="img"
      aria-label="Tenday"
      style={{ width: size, height: size, borderRadius: size * 0.3 }}
    >
      <Emblem size={size * 0.6} color="var(--lime)" />
    </span>
  );
}
export type AvatarTone = 'surface' | 'ink' | 'lime' | 'protein' | 'fat' | 'carbs';
export function Avatar({
  label,
  size = 40,
  tone = 'surface',
}: {
  label: string;
  size?: number;
  tone?: AvatarTone;
}) {
  return (
    <span
      className={`avatar tone-${tone}`}
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {label}
    </span>
  );
}

/* ───────────── Buttons ───────────── */

export type ButtonVariant =
  | 'primary'
  | 'lime'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger';
export function Button({
  children,
  icon: Icon,
  trailingIcon: Trailing,
  variant = 'primary',
  size = 'large',
  busy,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: LucideIcon;
  trailingIcon?: LucideIcon;
  variant?: ButtonVariant;
  size?: 'large' | 'medium' | 'small';
  busy?: boolean;
}) {
  const iconSize = size === 'small' ? 16 : 19;
  return (
    <button
      {...props}
      type={props.type ?? 'button'}
      disabled={props.disabled || busy}
      aria-busy={busy || undefined}
      className={`button ${variant} ${size} ${className}`}
    >
      {busy ? (
        <LoaderCircle className="spin" size={iconSize} />
      ) : (
        Icon && <Icon className="button-icon" size={iconSize} strokeWidth={2.4} />
      )}
      <span>{children}</span>
      {Trailing && !busy && <Trailing size={iconSize - 1} />}
    </button>
  );
}
/** A react-router link styled as a button. */
export function ButtonLink({
  to,
  children,
  icon: Icon,
  variant = 'primary',
  size = 'large',
  className = '',
  state,
}: {
  to: string;
  children: ReactNode;
  icon?: LucideIcon;
  variant?: ButtonVariant;
  size?: 'large' | 'medium' | 'small';
  className?: string;
  state?: unknown;
}) {
  return (
    <Link to={to} state={state} className={`button ${variant} ${size} ${className}`}>
      {Icon && (
        <Icon className="button-icon" size={size === 'small' ? 16 : 19} strokeWidth={2.4} />
      )}
      <span>{children}</span>
    </Link>
  );
}
export function IconButton({
  icon: Icon,
  label,
  tone = 'surface',
  size = 44,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
  label: string;
  tone?: 'surface' | 'ink' | 'plain' | 'lime' | 'outline';
  size?: number;
}) {
  return (
    <button
      {...props}
      type={props.type ?? 'button'}
      aria-label={label}
      title={label}
      className={`icon-button tone-${tone} ${className}`}
      style={{ width: size, height: size, ...props.style }}
    >
      <Icon size={Math.round(size * 0.45)} strokeWidth={2.2} />
    </button>
  );
}
export function IconLink({
  to,
  icon: Icon,
  label,
  tone = 'surface',
  size = 44,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  tone?: 'surface' | 'ink' | 'plain' | 'lime' | 'outline';
  size?: number;
}) {
  return (
    <Link
      to={to}
      aria-label={label}
      title={label}
      className={`icon-button tone-${tone}`}
      style={{ width: size, height: size }}
    >
      <Icon size={Math.round(size * 0.45)} strokeWidth={2.2} />
    </Link>
  );
}
export function LinkButton({
  children,
  to,
  onClick,
  chevron = true,
  className = '',
  state,
}: {
  children: ReactNode;
  to?: string;
  onClick?: () => void;
  chevron?: boolean;
  className?: string;
  state?: unknown;
}) {
  const body = (
    <>
      {children}
      {chevron && <ChevronRight size={16} strokeWidth={2.4} />}
    </>
  );
  return to ? (
    <Link className={`link-button ${className}`} to={to} state={state}>
      {body}
    </Link>
  ) : (
    <button type="button" className={`link-button ${className}`} onClick={onClick}>
      {body}
    </button>
  );
}

/* ───────────── Inputs ───────────── */

export function Field({
  label,
  hint,
  trailing,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  trailing?: ReactNode;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="field-box">
        <input {...props} id={id} aria-describedby={hint ? `${id}-hint` : undefined} />
        {trailing}
      </div>
      {hint && (
        <small id={`${id}-hint`} className="field-hint">
          {hint}
        </small>
      )}
    </div>
  );
}
export function TextArea({
  label,
  hint,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="field-box">
        <textarea {...props} id={id} aria-describedby={hint ? `${id}-hint` : undefined} />
      </div>
      {hint && (
        <small id={`${id}-hint`} className="field-hint">
          {hint}
        </small>
      )}
    </div>
  );
}
export function NumberField({
  value,
  onValue,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  value: number | null;
  onValue(value: number | null): void;
  label: string;
  hint?: string;
}) {
  const [text, setText] = useState(value === null ? '' : String(value));
  const projected = useRef(value);
  useEffect(() => {
    if (!Object.is(projected.current, value)) {
      projected.current = value;
      setText(value === null ? '' : String(value));
    }
  }, [value]);
  return (
    <Field
      {...props}
      type="text"
      inputMode="decimal"
      value={text}
      onChange={(e) => {
        const next = e.target.value;
        if (!/^-?\d*\.?\d*$/.test(next)) return;
        setText(next);
        const number =
          next === '' || next === '-' || next === '.' || next === '-.'
            ? null
            : Number(next);
        projected.current = number;
        onValue(number);
      }}
    />
  );
}
export function Choice({
  title,
  subtitle,
  selected,
  onClick,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  selected?: boolean;
  onClick: () => void;
  icon?: LucideIcon;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={!!selected}
      className={`choice ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      {Icon && (
        <span className="choice-tile">
          <Icon size={22} strokeWidth={2} />
        </span>
      )}
      <span className="choice-text">
        <strong>{title}</strong>
        {subtitle && <small>{subtitle}</small>}
      </span>
      <span className="choice-radio">
        {selected && <Check size={13} strokeWidth={3.2} />}
      </span>
    </button>
  );
}
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  disabled,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange(value: T): void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          disabled={disabled}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
export type ChipTone = 'surface' | 'lime' | 'ink' | 'outline' | 'warning' | 'success';
export function Chip({
  label,
  icon: Icon,
  tone = 'surface',
  onClick,
  to,
}: {
  label: string;
  icon?: LucideIcon;
  tone?: ChipTone;
  onClick?: () => void;
  to?: string;
}) {
  const interactive = !!(onClick || to);
  const cls = `chip tone-${tone} ${interactive ? 'interactive' : ''}`;
  const body = (
    <>
      {Icon && <Icon size={interactive ? 15 : 13} strokeWidth={2.4} />}
      <span>{label}</span>
    </>
  );
  if (to)
    return (
      <Link className={cls} to={to}>
        {body}
      </Link>
    );
  if (onClick)
    return (
      <button type="button" className={cls} onClick={onClick}>
        {body}
      </button>
    );
  return <span className={cls}>{body}</span>;
}

/* ───────────── Feedback ───────────── */

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
  const Icon = t === 'error' ? CircleAlert : t === 'warning' ? TriangleAlert : Info;
  return (
    <div className={`banner tone-${t}`} role={t === 'error' ? 'alert' : 'status'}>
      <Icon size={18} strokeWidth={2.2} className="banner-icon" />
      <div className="banner-body">
        {title && <strong>{title}</strong>}
        {typeof children === 'string' ? <p>{children}</p> : children}
        {action}
      </div>
    </div>
  );
}
export function Empty({
  title,
  children,
  icon: Icon,
  action,
}: {
  title: string;
  children: ReactNode;
  icon: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <section className="empty">
      <span className="empty-icon">
        <Icon size={28} strokeWidth={1.8} />
      </span>
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </section>
  );
}
export function Loading({
  children = 'Opening your day…',
}: {
  children?: ReactNode;
}) {
  return (
    <div className="loading" role="status">
      <BrandTile />
      <p>
        <LoaderCircle className="spin" size={18} />
        {children}
      </p>
    </div>
  );
}

/* ───────────── Layout ───────────── */

export function PageTitle({
  title,
  eyebrow,
  subtitle,
  action,
}: {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-title">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && <div className="page-title-action">{action}</div>}
    </header>
  );
}
export function Section({
  title,
  action,
  subtitle,
}: {
  title: string;
  action?: ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {action}
      </div>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}
export function Group({ children }: { children: ReactNode }) {
  return (
    <div className="group">
      {Children.toArray(children).filter(Boolean)}
    </div>
  );
}
export function Sheet({
  title,
  eyebrow,
  subtitle,
  children,
  footer,
  trailing,
  backTo = '/',
  hero,
}: {
  title?: string;
  eyebrow?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  trailing?: ReactNode;
  backTo?: string;
  hero?: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    titleId = useId(),
    navigate = useNavigate();
  useEffect(() => {
    const el = dialog.current;
    el?.showModal();
    document.documentElement.classList.add('sheet-open');
    return () => {
      el?.close();
      document.documentElement.classList.remove('sheet-open');
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="sheet"
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : 'Dialog'}
      onCancel={(e) => {
        e.preventDefault();
        navigate(backTo);
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) navigate(backTo);
      }}
    >
      <div className="sheet-panel">
        <span className="sheet-grabber" aria-hidden />
        <div className="sheet-scroll">
          <div className="sheet-top">
            <IconButton icon={X} label="Close" onClick={() => navigate(backTo)} />
            {trailing}
          </div>
          {hero}
          {title && (
            <div className="sheet-heading">
              {eyebrow && <span className="eyebrow">{eyebrow}</span>}
              <h1 id={titleId}>{title}</h1>
              {subtitle && <p>{subtitle}</p>}
            </div>
          )}
          <div className="sheet-body">{children}</div>
        </div>
        {footer && <footer className="sheet-footer">{footer}</footer>}
      </div>
    </dialog>
  );
}
export function Back({ to = '/reports', label = 'Go back' }: { to?: string; label?: string }) {
  return <IconLink to={to} icon={ArrowLeft} label={label} />;
}

/* ───────────── Data display ───────────── */

export function ProgressRing({
  fraction,
  children,
  size = 124,
  stroke = 10,
  color = 'var(--ink)',
  track = 'var(--surfaceStrong)',
  label,
}: {
  fraction: number;
  children?: ReactNode;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const f = Math.max(0, Math.min(fraction, 1));
  return (
    <div
      className="ring"
      style={{ width: size, height: size }}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <svg width={size} height={size} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        {f > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - f)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="ring-progress"
          />
        )}
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}
export function Bar({
  fraction,
  color,
  height = 6,
}: {
  fraction: number;
  color: string;
  height?: number;
}) {
  const f = Math.max(0, Math.min(fraction, 1));
  return (
    <span className="bar" style={{ height }}>
      <span
        style={{
          width: `${f * 100}%`,
          minWidth: f > 0 ? height : 0,
          background: color,
        }}
      />
    </span>
  );
}
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
    <div className="macro-tile" aria-label={`${label} ${Math.round(value)} ${unit === 'g' ? 'grams' : unit}`} role="group">
      <span className="macro-label">
        <i style={{ background: color }} />
        {label}
      </span>
      <strong className="metric-sm">
        {Math.round(value)}
        <small> {unit}</small>
      </strong>
      <Bar fraction={fraction} color={color} height={5} />
    </div>
  );
}
