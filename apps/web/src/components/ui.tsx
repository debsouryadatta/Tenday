import {
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
import { X, ArrowLeft, LoaderCircle, type LucideIcon } from 'lucide-react';
export function Brand() {
  return (
    <Link className="brand" to="/" aria-label="Tenday home">
      <img src={`${import.meta.env.BASE_URL}carefold.png`} alt="" />
      <span>Tenday</span>
    </Link>
  );
}
export function Button({
  children,
  icon: Icon,
  variant = 'primary',
  busy,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  busy?: boolean;
}) {
  return (
    <button
      {...props}
      type={props.type ?? 'button'}
      disabled={props.disabled || busy}
      aria-busy={busy || undefined}
      className={`button ${variant} ${className}`}
    >
      {busy ? (
        <LoaderCircle className="spin" size={19} />
      ) : (
        Icon && <Icon size={19} />
      )}
      <span>{children}</span>
    </button>
  );
}
export function Field({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input {...props} id={id} />
      {hint && <small>{hint}</small>}
    </label>
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
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <textarea {...props} id={id} />
      {hint && <small>{hint}</small>}
    </label>
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
export function Banner({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={`banner ${error ? 'error' : ''}`}
      role={error ? 'alert' : 'status'}
    >
      {children}
    </div>
  );
}
export function Empty({
  title,
  children,
  icon: Icon,
}: {
  title: string;
  children: ReactNode;
  icon: LucideIcon;
}) {
  return (
    <section className="empty">
      <span className="empty-icon">
        <Icon size={28} />
      </span>
      <h2>{title}</h2>
      <p>{children}</p>
    </section>
  );
}
export function Loading({
  children = 'Opening your private space…',
}: {
  children?: ReactNode;
}) {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={24} />
      <p>{children}</p>
    </div>
  );
}
export function PageTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-title">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
export function Sheet({
  title,
  subtitle,
  children,
  footer,
  backTo = '/',
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  backTo?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    titleId = useId(),
    navigate = useNavigate();
  useEffect(() => {
    const el = dialog.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="sheet"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        navigate(backTo);
      }}
    >
      <div className="sheet-heading">
        <button
          className="icon-button"
          aria-label="Close"
          onClick={() => navigate(backTo)}
        >
          <X size={23} />
        </button>
        <h1 id={titleId}>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="sheet-body">{children}</div>
      {footer && <footer className="sheet-footer">{footer}</footer>}
    </dialog>
  );
}
export function Back({ to = '/reports' }: { to?: string }) {
  return (
    <Link className="text-link back-link" to={to}>
      <ArrowLeft size={18} />
      Back
    </Link>
  );
}
