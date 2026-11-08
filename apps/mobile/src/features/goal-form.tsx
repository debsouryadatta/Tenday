import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useMutation } from 'convex/react';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Beef,
  CalendarCheck,
  Flame,
  Minus,
  Plus,
  ShieldCheck,
} from 'lucide-react-native';
import { type Goal, goalSchema } from '@tenday/domain';
import { api } from '../lib/backend';
import { useApp, message } from '../lib/app-state';
import { useDraft } from '../lib/storage';
import {
  Banner,
  Brand,
  Button,
  Choice,
  IconButton,
  Input,
  Loading,
  Screen,
  Text,
  s,
} from '../components/ui';
import { c, radius, space, type } from '../theme/tokens';

const UNIT = { consistency: 'meals a day', protein: 'g protein a day', awareness: 'kcal a day' } as const;
const STEP = { consistency: 1, protein: 5, awareness: 50 } as const;

export const defaultGoal: Goal = {
  kind: 'consistency',
  target: 3,
  preferences: '',
  rationale:
    'A simple record helps you notice your meal rhythm. Missing a day is okay.',
};
const options = [
  {
    kind: 'consistency' as const,
    title: 'Find my meal rhythm',
    subtitle: 'Build a gentle, consistent logging habit.',
    icon: CalendarCheck,
    target: 3,
    rationale: defaultGoal.rationale,
  },
  {
    kind: 'awareness' as const,
    title: 'Understand my eating',
    subtitle: 'Notice your energy intake without judgment.',
    icon: Flame,
    target: 2000,
    rationale:
      'Track against a target you choose. It is a reference for awareness, not a recommended calorie allowance.',
  },
  {
    kind: 'protein' as const,
    title: 'Keep protein in view',
    subtitle: 'See how your meals add up through the day.',
    icon: Beef,
    target: 80,
    rationale:
      'Use your own protein target to understand your meals. Tenday does not calculate medical nutrition needs.',
  },
];
export function GoalForm({ editing = false }: { editing?: boolean }) {
  const router = useRouter();
  const { sessionId, profile, connected } = useApp();
  const draft = useDraft<Goal>(
    `tenday:goal:${sessionId}:${editing ? 'edit' : 'setup'}`,
    editing && profile ? profile.goal : defaultGoal,
  );
  const [step, setStep] = useState(editing ? 1 : 0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const save = useMutation(api.records.setGoal);
  if (!draft.ready || sessionId === 'loading') return <Loading />;
  const goal = draft.value;
  async function submit() {
    if (!connected) {
      setError(
        'Reconnect to save your goal. Your choices are kept on this device.',
      );
      return;
    }
    const parsed = goalSchema.safeParse(goal);
    if (!parsed.success) {
      setError('Check the target and preferences, then try again.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await save({
        goal: parsed.data,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      await draft.clear();
      if (editing) router.back();
      else router.replace('/');
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  const step0 = step === 0;
  const bump = (dir: 1 | -1) =>
    void draft.change((old) => ({
      ...old,
      target: Math.min(
        10000,
        Math.max(1, Math.round((old.target || 0) + dir * STEP[old.kind])),
      ),
    }));
  return (
    <Screen
      eyebrow={editing ? 'Your goal' : `Step ${step + 1} of 2`}
      title={
        step0
          ? 'What would feel helpful?'
          : editing
            ? 'Goal & preferences'
            : 'Make it yours'
      }
      subtitle={
        step0
          ? 'Pick one focus. Tenday shapes your Today screen and guidance around it.'
          : 'Just enough context to make Tenday useful. Change it anytime.'
      }
      close={editing}
      footer={
        <>
          <Button
            title={
              step0 ? 'Continue' : editing ? 'Save changes' : 'Start my day'
            }
            trailingIcon={ArrowRight}
            busy={busy}
            onPress={step0 ? () => setStep(1) : submit}
          />
          {step === 1 && !editing && (
            <Button
              title="Back"
              variant="ghost"
              size="medium"
              onPress={() => setStep(0)}
            />
          )}
        </>
      }
    >
      <View style={{ gap: space.md }}>
        {!editing && (
          <View style={[s.between, { marginBottom: space.sm }]}>
            <Brand large wordmark={false} />
            <View style={[s.row, { gap: 6 }]}>
              {[0, 1].map((i) => (
                <View
                  key={i}
                  style={{
                    width: i === step ? 22 : 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: i === step ? c.ink : c.surfaceStrong,
                  }}
                />
              ))}
            </View>
          </View>
        )}
        {(step0 || editing) &&
          options.map((option) => (
            <Choice
              key={option.kind}
              title={option.title}
              subtitle={option.subtitle}
              icon={option.icon}
              selected={goal.kind === option.kind}
              onPress={() => {
                void draft.change((old) => ({
                  ...old,
                  kind: option.kind,
                  target: option.target,
                  rationale: option.rationale,
                }));
              }}
            />
          ))}
        {step === 1 && (
          <>
            <View
              style={{
                backgroundColor: c.surface,
                borderRadius: radius.xl,
                padding: space.lg,
                gap: space.md,
                marginTop: editing ? space.md : 0,
              }}
            >
              <Text variant="smallStrong" color={c.secondary} style={{ textAlign: 'center' }}>
                Your daily reference
              </Text>
              <View style={[s.between, { gap: space.sm }]}>
                <IconButton icon={Minus} label="Decrease target" size={48} tone="outline" onPress={() => bump(-1)} />
                <TextInput
                  accessibilityLabel={`Daily reference in ${UNIT[goal.kind]}`}
                  value={String(goal.target || '')}
                  keyboardType="numeric"
                  selectionColor={c.ink}
                  maxLength={5}
                  onChangeText={(text) => {
                    void draft.change((old) => ({ ...old, target: Number(text.replace(/[^0-9]/g, '')) }));
                  }}
                  style={{
                    ...type.metric,
                    fontSize: 54,
                    lineHeight: 62,
                    flex: 1,
                    textAlign: 'center',
                    color: c.ink,
                    fontVariant: ['tabular-nums'],
                    padding: 0,
                  }}
                />
                <IconButton icon={Plus} label="Increase target" size={48} tone="ink" onPress={() => bump(1)} />
              </View>
              <Text variant="small" color={c.secondary} style={{ textAlign: 'center' }}>
                {UNIT[goal.kind]}
              </Text>
            </View>
            <Text variant="caption" color={c.secondary} style={{ paddingHorizontal: space.xs }}>
              {goal.kind === 'awareness'
                ? '2,000 is an editable example, not a personal recommendation. Use a target you already know suits you.'
                : 'A reference, not a rule. Choose what works for you.'}
            </Text>
            <Banner tone="lime">{goal.rationale}</Banner>
            <Input
              label="Food preferences (optional)"
              placeholder="e.g. vegetarian, quick lunches"
              multiline
              value={goal.preferences}
              maxLength={600}
              onChangeText={(preferences) => {
                void draft.change((old) => ({ ...old, preferences }));
              }}
              hint="Only what you confirm here is remembered. Clear it anytime to forget."
            />
            <View style={[s.row, { gap: 8, alignItems: 'flex-start', marginTop: space.sm }]}>
              <ShieldCheck size={16} color={c.secondary} strokeWidth={2.2} style={{ marginTop: 1 }} />
              <Text variant="caption" color={c.secondary} style={{ flex: 1 }}>
                For adult, everyday wellbeing. Tenday explains and tracks; it
                doesn’t diagnose or prescribe. AI actions send the input you
                choose and relevant confirmed context to OpenRouter and its
                selected provider; no paid AI is used. Voice uses your device’s
                speech service. Personal accounts stay separate from shared demos.
              </Text>
            </View>
          </>
        )}
        {!!error && <Banner error>{error}</Banner>}
      </View>
    </Screen>
  );
}
