import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  ArrowRight,
  Eye,
  EyeOff,
  LogOut,
  CircleUserRound,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
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
  Banner,
  Brand,
  Button,
  Card,
  IconButton,
  Input,
  Screen,
  Text,
  s,
} from '../components/ui';
import { c, radius, space } from '../theme/tokens';

export function DemoChoices({
  onChoose,
  busy,
  active,
}: {
  onChoose(slug: DemoSlug): void;
  busy?: boolean;
  active?: DemoSlug | null;
}) {
  return (
    <View style={{ gap: space.md }}>
      {DEMO_PROFILES.map((person) => (
        <Pressable
          key={person.slug}
          accessibilityRole="button"
          accessibilityLabel={`Open ${person.name} shared demo`}
          accessibilityState={{ disabled: busy || active === person.slug }}
          disabled={busy || active === person.slug}
          onPress={() => onChoose(person.slug)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            gap: space.md,
            alignItems: 'center',
            borderColor: c.line,
            borderWidth: 1,
            borderRadius: radius.md,
            padding: space.base,
            opacity: busy ? 0.6 : pressed ? 0.7 : 1,
            backgroundColor: active === person.slug ? c.sage : c.screen,
          })}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: c.sage,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text variant="heading" color={c.forest}>
              {person.initials}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text variant="strong">{person.name}</Text>
            <Text variant="small" color={c.secondary}>
              {active === person.slug ? 'Current demo' : person.title}
            </Text>
          </View>
          <ArrowRight size={19} color={c.forest} />
        </Pressable>
      ))}
    </View>
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
      <View style={{ gap: space.xl, paddingBottom: space.lg }}>
        <Brand />
        <View style={{ gap: space.sm }}>
          <Text variant="title" accessibilityRole="header">
            Your day.{`\n`}A little clearer.
          </Text>
          <Text color={c.secondary}>
            Sign in to your space, or explore a demo below.
          </Text>
        </View>
        <View style={{ gap: space.lg }}>
          <View
            accessibilityRole="tablist"
            style={{
              flexDirection: 'row',
              gap: space.sm,
              padding: space.xs,
              borderRadius: radius.pill,
              backgroundColor: c.surface,
            }}
          >
            {(['signIn', 'signUp'] as const).map((mode) => (
              <Pressable
                key={mode}
                accessibilityRole="tab"
                accessibilityState={{
                  selected: step === mode,
                  disabled: !!busy,
                }}
                disabled={!!busy}
                onPress={() => {
                  setStep(mode);
                  setError('');
                }}
                style={{
                  flex: 1,
                  minHeight: 44,
                  borderRadius: radius.pill,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: step === mode ? c.screen : c.surface,
                }}
              >
                <Text
                  variant="strong"
                  color={step === mode ? c.forest : c.secondary}
                >
                  {mode === 'signIn' ? 'Sign in' : 'Sign up'}
                </Text>
              </Pressable>
            ))}
          </View>
          {step === 'signUp' && (
            <Input
              label="Your name"
              value={name}
              maxLength={60}
              autoComplete="name"
              textContentType="name"
              editable={!busy}
              onChangeText={setName}
            />
          )}
          <Input
            label="Email address"
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
          <View
            style={{
              flexDirection: 'row',
              gap: space.sm,
              alignItems: 'flex-end',
            }}
          >
            <View style={{ flex: 1 }}>
              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!show}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete={
                  step === 'signIn' ? 'current-password' : 'new-password'
                }
                textContentType={step === 'signIn' ? 'password' : 'newPassword'}
                maxLength={128}
                editable={!busy}
                onSubmitEditing={() => void submit()}
              />
            </View>
            <IconButton
              icon={show ? EyeOff : Eye}
              label={show ? 'Hide password' : 'Show password'}
              onPress={() => setShow(!show)}
            />
          </View>
          {step === 'signUp' && (
            <Text variant="small" color={c.secondary}>
              Use at least 12 characters. A long phrase works well.
            </Text>
          )}
          {(error || identity.error) && (
            <Banner error>{error || identity.error}</Banner>
          )}
          <Button
            title={step === 'signIn' ? 'Sign in' : 'Create account'}
            icon={ArrowRight}
            busy={busy === 'account'}
            disabled={!!busy}
            onPress={() => void submit()}
          />
        </View>
        <View
          style={{
            gap: space.base,
            borderTopWidth: 1,
            borderColor: c.line,
            paddingTop: space.xl,
          }}
        >
          <View style={{ gap: space.sm }}>
            <Text variant="heading">Choose a demo profile</Text>
            <Text variant="small" color={c.secondary}>
              Fictional people. Real, editable app flows.
            </Text>
          </View>
          <DemoChoices busy={!!busy} onChoose={(slug) => void submit(slug)} />
          {busy && busy !== 'account' && (
            <Text variant="small" color={c.secondary}>
              Opening {DEMO_PROFILES.find((p) => p.slug === busy)?.name}’s demo…
            </Text>
          )}
          <Text variant="small" color={c.secondary}>
            Shared demos are public: everyone can see and change their records.
            Use sample information only.
          </Text>
        </View>
      </View>
    </Screen>
  );
}
export function AccountBar() {
  const identity = useIdentity(),
    router = useRouter();
  return (
    <View style={{ gap: space.base, marginBottom: space.lg }}>
      <View style={s.between}>
        <Brand />
        <IconButton
          icon={CircleUserRound}
          label="Profiles and account"
          onPress={() => router.push('/account')}
        />
      </View>
      {identity.account?.demo && (
        <Card tone="sage">
          <View style={s.between}>
            <Text variant="strong">Shared demo · {identity.account.name}</Text>
            <Button
              title="Switch"
              compact
              variant="secondary"
              onPress={() => router.push('/account')}
            />
          </View>
          <Text variant="small" color={c.secondary}>
            Fictional data. Changes are visible to everyone.
          </Text>
        </Card>
      )}
    </View>
  );
}
export function AccountPage() {
  const identity = useIdentity(),
    router = useRouter(),
    { pending } = useApp();
  const blocked = pending.length > 0;
  async function move(slug?: DemoSlug) {
    if (blocked) return;
    if (slug) await identity.switchDemo(slug);
    else await identity.leave();
  }
  return (
    <Screen
      close
      title="Your space"
      subtitle="A little context, and an easy way to switch."
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
      <View style={s.stack}>
        <Card tone="sage">
          <Text variant="section">{identity.account?.name}</Text>
          <Text color={c.secondary}>
            {identity.account?.demo
              ? 'Shared demo profile'
              : identity.account?.email}
          </Text>
        </Card>
        {identity.account?.demo ? (
          <Banner>
            Everyone using this demo can see and change its meals, reports and
            conversation. Keep personal information in your own account.
          </Banner>
        ) : (
          <Text color={c.secondary}>
            Sign in with this email and password on Android or web to open the
            same personal account.
          </Text>
        )}
        {blocked && (
          <Banner error>
            Finish or discard your pending entries on Today before switching
            profiles. Unsent drafts stay with this account.
          </Banner>
        )}
        <Text variant="heading">Explore a different day</Text>
        <DemoChoices
          active={identity.account?.demo}
          busy={blocked}
          onChoose={(slug) => void move(slug)}
        />
        <Button
          title="Your goal & preferences"
          variant="quiet"
          onPress={() => router.push('/goal')}
        />
        <Text variant="small" color={c.secondary}>
          Signing out keeps saved records. In this preview, email verification
          and password recovery are not enabled.
        </Text>
      </View>
    </Screen>
  );
}
