import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, LogOut, ShieldCheck } from 'lucide-react';
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
import { Banner, Brand, Button, Field, Sheet } from '../components/ui';

export function DemoCards({
  onChoose,
  busy,
  active,
}: {
  onChoose(slug: DemoSlug): void;
  busy?: boolean;
  active?: DemoSlug | null;
}) {
  return (
    <div className="demo-choices">
      {DEMO_PROFILES.map((person) => (
        <button
          type="button"
          className="demo-choice"
          key={person.slug}
          disabled={busy || active === person.slug}
          onClick={() => onChoose(person.slug)}
        >
          <span className="demo-avatar">{person.initials}</span>
          <span>
            <strong>
              {person.name}
              <small>
                {active === person.slug ? 'Current demo' : 'Shared demo'}
              </small>
            </strong>
            <span>{person.title}</span>
          </span>
          <ArrowRight size={19} />
        </button>
      ))}
    </div>
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
      <Brand />
      <div className="auth-grid">
        <section className="auth-welcome">
          <span className="eyebrow">A LITTLE CARE, EVERY DAY</span>
          <h1>
            Your day.
            <br />A little clearer.
          </h1>
          <p>Meals, meaningful progress and a little help when you need it.</p>
          <div className="auth-benefits">
            <span>Log a meal, your way.</span>
            <span>Understand your everyday patterns.</span>
            <span>Keep reports and their context together.</span>
          </div>
          <img src={`${import.meta.env.BASE_URL}carefold.png`} alt="" />
        </section>
        <section className="auth-form">
          <h2>
            {step === 'signIn'
              ? 'Welcome to Tenday.'
              : 'Make a little space for you.'}
          </h2>
          <p className="muted">
            {step === 'signIn'
              ? 'Sign in to your space, or explore a demo below.'
              : 'Create an account to keep your day across devices.'}
          </p>
          <div className="auth-tabs" role="group" aria-label="Account action">
            <button
              type="button"
              aria-pressed={step === 'signIn'}
              disabled={!!busy}
              onClick={() => {
                setStep('signIn');
                setError('');
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              aria-pressed={step === 'signUp'}
              disabled={!!busy}
              onClick={() => {
                setStep('signUp');
                setError('');
              }}
            >
              Sign up
            </button>
          </div>
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
                autoComplete="name"
                value={name}
                maxLength={60}
                required
                disabled={!!busy}
                onChange={(e) => setName(e.target.value)}
              />
            )}
            <Field
              label="Email address"
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
            <div className="password-field">
              <Field
                label="Password"
                type={show ? 'text' : 'password'}
                autoComplete={
                  step === 'signIn' ? 'current-password' : 'new-password'
                }
                value={password}
                maxLength={128}
                required
                disabled={!!busy}
                hint={
                  step === 'signUp'
                    ? 'Use at least 12 characters. A long phrase works well.'
                    : undefined
                }
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={show ? 'Hide password' : 'Show password'}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
            {(error || identity.error) && (
              <Banner error>{error || identity.error}</Banner>
            )}
            <Button
              type="submit"
              icon={ArrowRight}
              busy={busy === 'account'}
              disabled={!!busy}
            >
              {step === 'signIn' ? 'Sign in' : 'Create account'}
            </Button>
          </form>
          <div className="demo-divider">
            <span>Or take a look around</span>
          </div>
          <h3>Choose a demo profile</h3>
          <p className="small muted">
            Fictional people. Real, editable app flows.
          </p>
          <DemoCards busy={!!busy} onChoose={(slug) => void submit(slug)} />
          {busy && busy !== 'account' && (
            <p className="small muted" role="status">
              Opening {DEMO_PROFILES.find((p) => p.slug === busy)?.name}’s demo…
            </p>
          )}
          <p className="demo-disclosure">
            Shared demos are public: everyone can see and change their records.
            Use sample information only.
          </p>
          <p className="auth-note">
            <ShieldCheck size={16} />
            Your personal account stays separate from the demos.
          </p>
        </section>
      </div>
    </div>
  );
}
export function AccountPage() {
  const identity = useIdentity(),
    navigate = useNavigate(),
    { pending } = useApp();
  const blocked = pending.length > 0;
  async function move(slug?: DemoSlug) {
    if (blocked) return;
    navigate('/', { replace: true });
    if (slug) await identity.switchDemo(slug);
    else await identity.leave();
  }
  return (
    <Sheet
      title="Your space"
      subtitle="A little context, and an easy way to switch."
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
        <div className="account-summary">
          <span className="demo-avatar">
            {identity.account?.name.slice(0, 1)}
          </span>
          <div>
            <h2>{identity.account?.name}</h2>
            <p className="muted">
              {identity.account?.demo
                ? 'Shared demo profile'
                : identity.account?.email}
            </p>
          </div>
        </div>
        {identity.account?.demo ? (
          <Banner>
            Everyone using this demo can see and change its meals, reports and
            conversation. Keep personal information in your own account.
          </Banner>
        ) : (
          <p className="muted">
            Sign in with this email and password on Android or web to open the
            same personal account.
          </p>
        )}
        {blocked && (
          <Banner error>
            Finish or discard your pending entries on Today before switching
            profiles. Your unsent drafts stay with this account.
          </Banner>
        )}
        <div>
          <h3>Explore a different day</h3>
          <p className="small muted">
            Switch to a shared demo with a different goal.
          </p>
        </div>
        <DemoCards
          active={identity.account?.demo}
          busy={blocked}
          onChoose={(slug) => void move(slug)}
        />
        <p className="small muted">
          Signing out keeps your saved records. In this preview, email
          verification and password recovery are not enabled.
        </p>
      </div>
    </Sheet>
  );
}
