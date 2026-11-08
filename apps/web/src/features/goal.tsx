import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { ArrowRight, CircleCheck, ScanLine, Sprout } from 'lucide-react';
import { goalSchema, type Goal } from '@tenday/domain';
import { api } from '../lib/backend';
import { useApp, errorMessage } from '../lib/app-state';
import { useDraft } from '../lib/storage';
import {
  Banner,
  Brand,
  Button,
  Loading,
  NumberField,
  Sheet,
  TextArea,
} from '../components/ui';
const options = [
  {
    kind: 'consistency' as const,
    title: 'Find my meal rhythm',
    subtitle: 'Build a gentle, consistent logging habit.',
    target: 3,
    icon: CircleCheck,
    rationale:
      'A simple record helps you notice your meal rhythm. Missing a day is okay.',
  },
  {
    kind: 'awareness' as const,
    title: 'Understand my eating',
    subtitle: 'Notice your energy intake without judgment.',
    target: 2000,
    icon: ScanLine,
    rationale:
      'Track against a target you choose. It is a reference for awareness, not a recommended calorie allowance.',
  },
  {
    kind: 'protein' as const,
    title: 'Keep protein in view',
    subtitle: 'See how your meals add up through the day.',
    target: 80,
    icon: Sprout,
    rationale:
      'Use your own protein target to understand your meals. Tenday does not calculate medical nutrition needs.',
  },
];
export function GoalPage({ editing = false }: { editing?: boolean }) {
  const { profile, sessionId, connected } = useApp(),
    navigate = useNavigate();
  const draft = useDraft<Goal>(
    `tenday:web:goal:${sessionId}:${editing ? 'edit' : 'setup'}`,
    editing && profile
      ? profile.goal
      : {
          kind: 'consistency',
          target: 3,
          preferences: '',
          rationale: options[0].rationale,
        },
  );
  const [step, setStep] = useState(editing ? 1 : 0),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const save = useMutation(api.records.setGoal);
  if (!draft.ready) return <Loading />;
  const goal = draft.value;
  async function submit() {
    if (busy) return;
    if (!connected) {
      setError('Reconnect to save your goal. Your choices are kept here.');
      return;
    }
    const parsed = goalSchema.safeParse(goal);
    if (!parsed.success) {
      setError('Check your daily reference and preferences.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await save({
        goal: parsed.data,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      draft.clear();
      navigate('/', { replace: true });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  const title =
    step === 0
      ? 'Small steps. A little more you.'
      : editing
        ? 'Your goal & preferences'
        : 'Make this your own';
  const footer = (
    <>
      <Button
        icon={ArrowRight}
        busy={busy}
        onClick={step === 0 ? () => setStep(1) : submit}
      >
        {step === 0 ? 'Continue' : editing ? 'Save changes' : 'Start my day'}
      </Button>
      {step === 1 && !editing && (
        <Button variant="secondary" onClick={() => setStep(0)}>
          Back
        </Button>
      )}
    </>
  );
  const content = (
    <div className="stack">
      {(step === 0 || editing) && (
        <div className="choices">
          {options.map((o) => (
            <button
              key={o.kind}
              className={`choice ${goal.kind === o.kind ? 'selected' : ''}`}
              role="radio"
              aria-checked={goal.kind === o.kind}
              onClick={() =>
                draft.change({
                  ...goal,
                  kind: o.kind,
                  target: o.target,
                  rationale: o.rationale,
                })
              }
            >
              <o.icon size={24} />
              <span>
                <strong>{o.title}</strong>
                <small>{o.subtitle}</small>
              </span>
              <span className="choice-dot" />
            </button>
          ))}
        </div>
      )}
      {step === 1 && (
        <>
          <NumberField
            label={`Your daily reference (${goal.kind === 'consistency' ? 'meals to log' : goal.kind === 'protein' ? 'grams of protein' : 'kcal'})`}
            value={goal.target}
            min={1}
            max={
              goal.kind === 'consistency'
                ? 10
                : goal.kind === 'protein'
                  ? 300
                  : 10000
            }
            onValue={(target) => draft.change({ ...goal, target: target ?? 0 })}
          />
          <p className="muted small">
            {goal.kind === 'awareness'
              ? '2,000 is an editable example, not a personal recommendation. Use a target you already know is appropriate for you.'
              : 'A reference, not a rule. Choose what works for you.'}
          </p>
          <Banner>{goal.rationale}</Banner>
          <TextArea
            label="Food preferences (optional)"
            placeholder="For example, vegetarian; quick lunches"
            value={goal.preferences}
            maxLength={600}
            onChange={(e) =>
              draft.change({ ...goal, preferences: e.target.value })
            }
            hint="Only what you confirm here is remembered. Clear this field anytime to forget it."
          />
          <p className="muted small">
            For adult, everyday wellbeing. Tenday tracks and explains; it does
            not diagnose or prescribe. AI actions send the input you choose and
            relevant confirmed context to OpenRouter and its selected provider.
            Voice uses your browser’s speech service.
          </p>
          <p className="muted small">
            No account to create. Keep this browser’s storage to keep access.
            Android and each browser origin have separate private spaces.
          </p>
        </>
      )}
      {error && <Banner error>{error}</Banner>}
    </div>
  );
  if (editing)
    return (
      <Sheet
        title={title}
        subtitle="Just enough context to make Tenday useful. You can change this anytime."
        footer={footer}
      >
        {content}
      </Sheet>
    );
  return (
    <div className="onboarding">
      <Brand />
      <div className="onboarding-grid">
        <section className="welcome">
          <div className="eyebrow">A LITTLE CARE, EVERY DAY</div>
          <h1>{title}</h1>
          <p>
            A calmer way to understand your meals and care for your everyday
            health.
          </p>
          <img
            src={`${import.meta.env.BASE_URL}carefold.png`}
            alt="Carefold emblem"
          />
        </section>
        <section className="onboarding-form">
          <span className="step-label">{step + 1} / 2</span>
          <h2>
            {step === 0
              ? 'What would feel helpful?'
              : 'A useful starting point.'}
          </h2>
          {content}
          <footer className="form-actions">{footer}</footer>
        </section>
      </div>
    </div>
  );
}
