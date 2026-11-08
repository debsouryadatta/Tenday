import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  ArrowRight,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  LogOut,
  SlidersHorizontal,
  Sparkles,
  ArrowLeft,
} from 'lucide-react-native';
import { useRouter, usePathname } from 'expo-router';
import {
  DEMO_PROFILES,
  localDay,
  accountNameSchema,
  authError,
  emailSchema,
  passwordSchema,
  type DemoSlug,
} from '@tenday/domain';
import { useIdentity } from '../lib/auth-session';
import { useApp } from '../lib/app-state';
import {
  Avatar,
  Banner,
  Brand,
  Button,
  Chip,
  Group,
  IconButton,
  Input,
  Row,
  Screen,
  Segmented,
  Text,
  s,
} from '../components/ui';
import { NAV_MODE } from '../constants';
import { c, space } from '../theme/tokens';

export const DEMO_TONES = {
  maya: 'lime',
  arjun: 'protein',
  leah: 'fat',
} as const;

export function DemoChoices({
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
          <Pressable
            key={person.slug}
            accessibilityRole="button"
            accessibilityLabel={`Open ${person.name} shared demo`}
            accessibilityState={{ disabled: busy || current, busy: opening === person.slug }}
            disabled={busy || current}
            onPress={() => onChoose(person.slug)}
            style={({ pressed }) => [
              s.row,
              {
                gap: space.md,
                padding: space.base,
                minHeight: 76,
                backgroundColor: pressed ? c.surfaceStrong : 'transparent',
                opacity: busy && opening !== person.slug ? 0.5 : 1,
              },
            ]}
          >
            <Avatar label={person.initials} size={46} tone={DEMO_TONES[person.slug]} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="strong">{person.name}</Text>
              <Text variant="small" color={c.secondary} numberOfLines={1}>
                {opening === person.slug ? 'Opening…' : person.title}
              </Text>
            </View>
            {current ? (
              <Chip label="Current" icon={Check} tone="lime" />
            ) : (
              <ChevronRight size={18} color={c.muted} />
            )}
          </Pressable>
        );
      })}
    </Group>
  );
}
export function Authentication() {
  const identity = useIdentity();
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
    <Screen>
      <View style={{ gap: space.xl, paddingTop: space.sm }}>
        <Brand />
        <View style={{ gap: space.md }}>
          <Text variant="display" accessibilityRole="header" style={{ fontSize: 38, lineHeight: 42, letterSpacing: -1.5 }}>
            {step === 'signIn' ? 'Welcome\nback.' : 'Make every\nday clearer.'}
          </Text>
          <Text color={c.secondary} style={{ maxWidth: 340 }}>
            Snap a meal, understand a lab report and get one helpful next step, every day.
          </Text>
        </View>
        <View style={{ gap: space.base }}>
          <Segmented
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
          {step === 'signUp' && (
            <Input
              label="Your name"
              placeholder="How should Tenday greet you?"
              value={name}
              maxLength={60}
              autoComplete="name"
              textContentType="name"
              editable={!busy}
              onChangeText={setName}
            />
          )}
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            maxLength={254}
            editable={!busy}
          />
          <Input
            label="Password"
            placeholder={step === 'signUp' ? 'At least 12 characters' : 'Your password'}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!show}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={step === 'signIn' ? 'current-password' : 'new-password'}
            textContentType={step === 'signIn' ? 'password' : 'newPassword'}
            maxLength={128}
            editable={!busy}
            onSubmitEditing={() => void submit()}
            hint={step === 'signUp' ? 'A long phrase is easy to remember and hard to guess.' : undefined}
            trailing={
              <IconButton
                icon={show ? EyeOff : Eye}
                label={show ? 'Hide password' : 'Show password'}
                tone="plain"
                size={40}
                onPress={() => setShow(!show)}
              />
            }
          />
          {(error || identity.error) && (
            <Banner error>{error || identity.error}</Banner>
          )}
          <Button
            title={step === 'signIn' ? 'Sign in' : 'Create account'}
            trailingIcon={ArrowRight}
            busy={busy === 'account'}
            disabled={!!busy}
            onPress={() => void submit()}
          />
        </View>
        <View style={{ gap: space.md }}>
          <View style={[s.row, { gap: space.md }]}>
            <View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
            <Text variant="eyebrow" color={c.secondary}>
              Or try a demo
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
          </View>
          <DemoChoices
            busy={!!busy}
            opening={busy && busy !== 'account' ? busy : undefined}
            onChoose={(slug) => void submit(slug)}
          />
          <Text variant="caption" color={c.secondary} style={{ textAlign: 'center', paddingHorizontal: space.base }}>
            Demos are shared and fictional. Anyone can see and change them, so please use sample information only.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

/** Top row for the main tabs: brand, demo indicator and account. */
export function AccountBar({ back = false }: { back?: boolean }) {
  const identity = useIdentity(),
    router = useRouter(),
    path = usePathname();
  const account = identity.account;
  const full = NAV_MODE === 'fullscreen';
  return (
    <View style={[s.between, { marginBottom: space.lg, minHeight: 44 }]}>
      {full && back ? (
        <IconButton icon={ArrowLeft} label="Back to Today" onPress={() => router.navigate('/')} />
      ) : (
        <Brand />
      )}
      <View style={[s.row, { gap: space.sm }]}>
        {account?.demo && (
          <Chip label="Shared demo" tone="lime" onPress={() => router.push('/account')} />
        )}
        {full && path === '/' && (
          <>
            <IconButton icon={Sparkles} label="Assistant" onPress={() => router.navigate('/assistant')} />
            <IconButton icon={FileText} label="Reports" onPress={() => router.navigate('/reports')} />
          </>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Profiles and account"
          onPress={() => router.push('/account')}
          hitSlop={4}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Avatar
            label={account?.name?.slice(0, 1).toUpperCase() ?? '·'}
            size={40}
            tone={account?.demo ? DEMO_TONES[account.demo] : 'ink'}
          />
        </Pressable>
      </View>
    </View>
  );
}

export function AccountPage() {
  const identity = useIdentity(),
    router = useRouter(),
    { pending } = useApp();
  const blocked = pending.length > 0;
  const account = identity.account;
  async function move(slug?: DemoSlug) {
    if (blocked) return;
    if (slug) await identity.switchDemo(slug);
    else await identity.leave();
  }
  return (
    <Screen
      close
      footer={
        <Button
          title="Sign out"
          icon={LogOut}
          variant="secondary"
          disabled={blocked}
          onPress={() => void move()}
        />
      }
    >
      <View style={{ alignItems: 'center', gap: space.sm, marginBottom: space.xl }}>
        <Avatar
          label={account?.name?.slice(0, 1).toUpperCase() ?? '·'}
          size={76}
          tone={account?.demo ? DEMO_TONES[account.demo] : 'ink'}
        />
        <Text variant="title" accessibilityRole="header" style={{ marginTop: space.sm }}>
          {account?.name}
        </Text>
        {account?.demo ? (
          <View>
            <Chip label="Shared demo profile" tone="lime" />
          </View>
        ) : (
          <Text color={c.secondary}>{account?.email}</Text>
        )}
      </View>
      <View style={s.stack}>
        {account?.demo ? (
          <Banner tone="lime">
            Everyone using this demo can see and change its meals, reports and conversation. Keep personal information in your own account.
          </Banner>
        ) : (
          <Banner>
            Sign in with the same email and password on Android or the web to open this account anywhere.
          </Banner>
        )}
        {blocked && (
          <Banner error title="Finish pending entries first">
            Retry or remove the entries waiting on Today before switching. Unsent drafts stay with this account.
          </Banner>
        )}
        <Group>
          <Row
            padded
            icon={SlidersHorizontal}
            title="Goal & preferences"
            accessibilityLabel="Goal and preferences"
            subtitle="Your daily reference and what Tenday remembers"
            onPress={() => router.push('/goal')}
          />
        </Group>
        <Text variant="eyebrow" color={c.secondary} style={{ marginTop: space.lg }}>
          Switch demo profile
        </Text>
        <DemoChoices
          active={account?.demo}
          busy={blocked}
          onChoose={(slug) => void move(slug)}
        />
        <Text variant="caption" color={c.secondary} style={{ marginTop: space.sm }}>
          Signing out keeps your saved records. Email verification and password recovery aren’t enabled in this preview.
        </Text>
      </View>
    </Screen>
  );
}
