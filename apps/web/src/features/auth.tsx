import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Camera,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  FlaskConical,
  LogOut,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import {
  DEMO_PROFILES,
  localDay,
  accountNameSchema,
  authError,
  emailSchema,
  passwordSchema,
  type DemoSlug,
} from '@tenday/domain';
import { useIdentity } from '../../../mobile/src/lib/auth-session';
import { useApp } from '../lib/app-state';
import {
  Avatar,
  Banner,
  Brand,
  BrandTile,
  Button,
  Chip,
  Field,
  Group,
  IconButton,
  Segmented,
  Sheet,
} from '../components/ui';
import { DEMO_TONES } from '../components/shell';

export function DemoCards({
  onChoose,
  busy,
  active,
  opening,
}: {
  onChoose(slug: DemoSlug): void;
  busy?: boolean;
  active?: DemoSlug | null;
  opening?: string;
}) {
  return (
    <Group>
      {DEMO_PROFILES.map((person) => {
        const current = active === person.slug;
        return (
          <button
            type="button"
            className={`demo-row ${busy && opening !== person.slug ? 'dim' : ''}`}
            key={person.slug}
            aria-label={`Open ${person.name} shared demo`}
            aria-busy={opening === person.slug || undefined}
            disabled={busy || current}
            onClick={() => onChoose(person.slug)}
          >
            <Avatar label={person.initials} size={46} tone={DEMO_TONES[person.slug]} />
            <span className="demo-text">
              <strong>{person.name}</strong>
              <small>{opening === person.slug ? 'Opening…' : person.title}</small>
            </span>
            {current ? (
              <Chip label="Current" icon={Check} tone="lime" />
            ) : (
              <ChevronRight size={18} className="muted-icon" />
            )}
          </button>
        );
      })}
    </Group>
  );
}
export function Authentication() {
  const identity = useIdentity(),
    navigate = useNavigate();
  const [step, setStep] = useState<'signIn' | 'signUp'>('signIn'),
    [name, setName] = useState(''),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [show, setShow] = useState(false),
    [busy, setBusy] = useState(''),
    [error, setError] = useState('');
  const locked = useRef(false);
  async function submit(demo?: DemoSlug) {
    if (locked.current) return;
    setError('');
    if (!demo) {
      if (!emailSchema.safeParse(email).success) {
        setError('Enter a valid email address.');
        return;
      }
      if (step === 'signUp' && !accountNameSchema.safeParse(name).success) {
        setError('Enter your name (2–60 characters).');
        return;
      }
      if (
        !password ||
        password.length > 128 ||
        (step === 'signUp' && !passwordSchema.safeParse(password).success)
      ) {
        setError(
          step === 'signUp'
            ? 'Choose a password with 12–128 characters.'
            : 'Enter your password.',
        );
        return;
      }
    }
    locked.current = true;
    setBusy(demo ?? 'account');
    navigate('/', { replace: true });
    try {
      if (demo)
        await identity.authenticate('demo', { profile: demo, day: localDay() });
      else
        await identity.authenticate('password', {
          flow: step,
          email: emailSchema.parse(email),
          password,
          ...(step === 'signUp' ? { name: name.trim() } : {}),
        });
      setPassword('');
    } catch {
      setError(
        demo
          ? 'The demo could not open. Check your connection and try again.'
          : authError(step),
      );
    } finally {
      locked.current = false;
      setBusy('');
    }
  }
  return (
    <div className="auth-page">
      <section className="auth-hero" aria-hidden>
        <BrandTile size={72} />
        <div>
          <h2>Your day, understood.</h2>
          <p>Meals in seconds. Reports made clear. One helpful next step, every day.</p>
        </div>
        <ul>
          <li>
            <span><Camera size={18} strokeWidth={2.2} /></span>
            Snap, say or type a meal and review the estimate
          </li>
          <li>
            <span><Sparkles size={18} strokeWidth={2.2} /></span>
            Guidance grounded in your own goal and records
          </li>
          <li>
            <span><FlaskConical size={18} strokeWidth={2.2} /></span>
            Lab values kept with their original source
          </li>
        </ul>
      </section>
      <section className="auth-form">
        <Brand link={false} />
        <div className="auth-title">
          <h1>
            {step === 'signIn' ? 'Welcome\nback.' : 'Make every\nday clearer.'}
          </h1>
          <p>
            Snap a meal, understand a lab report and get one helpful next step,
            every day.
          </p>
        </div>
        <Segmented
          label="Account action"
          value={step}
          disabled={!!busy}
          onChange={(mode) => {
            setStep(mode);
            setError('');
          }}
          options={[
            { value: 'signIn', label: 'Sign in' },
            { value: 'signUp', label: 'Create account' },
          ]}
        />
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          {step === 'signUp' && (
            <Field
              label="Your name"
              placeholder="How should Tenday greet you?"
              autoComplete="name"
              value={name}
              maxLength={60}
              required
              disabled={!!busy}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <Field
            label="Email"
            placeholder="you@example.com"
            type="email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            value={email}
            maxLength={254}
            required
            disabled={!!busy}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Field
            label="Password"
            placeholder={step === 'signUp' ? 'At least 12 characters' : 'Your password'}
            type={show ? 'text' : 'password'}
            autoComplete={step === 'signIn' ? 'current-password' : 'new-password'}
            value={password}
            maxLength={128}
            required
            disabled={!!busy}
            hint={
              step === 'signUp'
                ? 'A long phrase is easy to remember and hard to guess.'
                : undefined
            }
            onChange={(e) => setPassword(e.target.value)}
            trailing={
              <IconButton
                icon={show ? EyeOff : Eye}
                label={show ? 'Hide password' : 'Show password'}
                tone="plain"
                size={40}
                onClick={() => setShow(!show)}
              />
            }
          />
          {(error || identity.error) && (
            <Banner error>{error || identity.error}</Banner>
          )}
          <Button
            type="submit"
            trailingIcon={ArrowRight}
            busy={busy === 'account'}
            disabled={!!busy}
          >
            {step === 'signIn' ? 'Sign in' : 'Create account'}
          </Button>
        </form>
        <div className="divider-label">
          <span>Or try a demo</span>
        </div>
        <DemoCards
          busy={!!busy}
          opening={busy && busy !== 'account' ? busy : undefined}
          onChoose={(slug) => void submit(slug)}
        />
        <p className="caption center">
          Demos are shared and fictional. Anyone can see and change them, so
          please use sample information only.
        </p>
      </section>
    </div>
  );
}
export function AccountPage() {
  const identity = useIdentity(),
    navigate = useNavigate(),
    { pending } = useApp();
  const blocked = pending.length > 0;
  const account = identity.account;
  async function move(slug?: DemoSlug) {
    if (blocked) return;
    navigate('/', { replace: true });
    if (slug) await identity.switchDemo(slug);
    else await identity.leave();
  }
  return (
    <Sheet
      hero={
        <div className="account-hero">
          <Avatar
            label={account?.name?.slice(0, 1).toUpperCase() ?? '·'}
            size={76}
            tone={account?.demo ? DEMO_TONES[account.demo] : 'ink'}
          />
          <h1>{account?.name}</h1>
          {account?.demo ? (
            <Chip label="Shared demo profile" tone="lime" />
          ) : (
            <p>{account?.email}</p>
          )}
        </div>
      }
      footer={
        <Button
          icon={LogOut}
          variant="secondary"
          disabled={blocked}
          onClick={() => void move()}
        >
          Sign out
        </Button>
      }
    >
      <div className="stack">
        {account?.demo ? (
          <Banner tone="lime">
            Everyone using this demo can see and change its meals, reports and
            conversation. Keep personal information in your own account.
          </Banner>
        ) : (
          <Banner>
            Sign in with the same email and password on Android or the web to
            open this account anywhere.
          </Banner>
        )}
        {blocked && (
          <Banner error title="Finish pending entries first">
            Retry or remove the entries waiting on Today before switching.
            Unsent drafts stay with this account.
          </Banner>
        )}
        <Group>
          <button
            type="button"
            className="row-button"
            onClick={() => navigate('/goal')}
          >
            <span className="row-tile">
              <SlidersHorizontal size={20} strokeWidth={2} />
            </span>
            <span className="row-text">
              <strong>Goal & preferences</strong>
              <small>Your daily reference and what Tenday remembers</small>
            </span>
            <ChevronRight size={18} className="muted-icon" />
          </button>
        </Group>
        <span className="eyebrow spaced">Switch demo profile</span>
        <DemoCards
          active={account?.demo}
          busy={blocked}
          onChoose={(slug) => void move(slug)}
        />
        <p className="caption">
          Signing out keeps your saved records. Email verification and password
          recovery aren’t enabled in this preview.
        </p>
      </div>
    </Sheet>
  );
}
