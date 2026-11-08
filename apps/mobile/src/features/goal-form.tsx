import React, { useState } from 'react';
import { View } from 'react-native';
import { useMutation } from 'convex/react';
import { useRouter } from 'expo-router';
import { CircleCheck, ScanLine, Sprout, ArrowRight } from 'lucide-react-native';
import { type Goal, goalSchema } from '@tenday/domain';
import { api } from '../lib/backend';
import { useApp, message } from '../lib/app-state';
import { useDraft } from '../lib/storage';
import {
  Banner,
  Brand,
  Button,
  Choice,
  Input,
  Loading,
  Screen,
  Text,
  s,
} from '../components/ui';
import { c, space } from '../theme/tokens';

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
    icon: CircleCheck,
    target: 3,
    rationale: defaultGoal.rationale,
  },
  {
    kind: 'awareness' as const,
    title: 'Understand my eating',
    subtitle: 'Notice your energy intake without judgment.',
    icon: ScanLine,
    target: 2000,
    rationale:
      'Track against a target you choose. It is a reference for awareness, not a recommended calorie allowance.',
  },
  {
    kind: 'protein' as const,
    title: 'Keep protein in view',
    subtitle: 'See how your meals add up through the day.',
    icon: Sprout,
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
  return (
    <Screen
      title={
        step === 0
          ? 'Small steps.\nA little more you.'
          : editing
            ? 'Your goal & preferences'
            : 'Make this your own'
      }
      subtitle={
        step === 0
          ? 'A calmer way to understand your meals and care for your everyday health.'
          : 'Just enough context to make Tenday useful. You can change this anytime.'
      }
      close={editing}
      footer={
        <>
          <Button
            title={
              step === 0
                ? 'Continue'
                : editing
                  ? 'Save changes'
                  : 'Start my day'
            }
            icon={ArrowRight}
            busy={busy}
            onPress={step === 0 ? () => setStep(1) : submit}
          />
          {step === 1 && !editing && (
            <Button
              title="Back"
              variant="secondary"
              onPress={() => setStep(0)}
            />
          )}
        </>
      }
    >
      <View style={s.stack}>
        {step === 0 && (
          <>
            <View style={{ paddingVertical: space.base }}>
              <Brand large wordmark={false} />
            </View>
            <Text variant="strong">What would feel helpful?</Text>
          </>
        )}
        {(step === 0 || editing) &&
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
            <Input
              label={`Your daily reference (${goal.kind === 'consistency' ? 'meals to log' : goal.kind === 'protein' ? 'grams of protein' : 'kcal'})`}
              value={String(goal.target || '')}
              keyboardType="numeric"
              onChangeText={(text) => {
                void draft.change((old) => ({ ...old, target: Number(text) }));
              }}
              hint={
                goal.kind === 'awareness'
                  ? '2,000 is an editable example, not a personal recommendation. Use a target you already know is appropriate for you.'
                  : 'A reference, not a rule. Choose what works for you.'
              }
            />
            <Banner>{goal.rationale}</Banner>
            <Input
              label="Food preferences (optional)"
              placeholder="For example, vegetarian; quick lunches"
              multiline
              value={goal.preferences}
              maxLength={600}
              onChangeText={(preferences) => {
                void draft.change((old) => ({ ...old, preferences }));
              }}
              hint="Only what you confirm here is saved as a preference. Clear this field anytime to forget it."
            />
            <Text variant="small" color={c.secondary}>
              For adult, everyday wellbeing. Tenday explains and tracks; it does
              not diagnose or prescribe.
            </Text>
            <Text variant="small" color={c.secondary}>
              Your personal account stays separate from the shared demos. AI
              actions send the input you choose and relevant confirmed context
              to OpenRouter and its selected provider. No paid AI is used. Voice
              uses your device’s speech service.
            </Text>
            <Text variant="small" color={c.muted}>
              Sign in with the same email and password on Android or web to open
              your personal account. Shared demos stay separate.
            </Text>
          </>
        )}
        {!!error && <Banner error>{error}</Banner>}
      </View>
    </Screen>
  );
}
