import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'convex/react';
import {
  ArrowRight,
  Beef,
  CalendarCheck,
  Flame,
  Minus,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { goalSchema, type Goal } from '@tenday/domain';
import { api } from '../lib/backend';
import { useApp, errorMessage } from '../lib/app-state';
import { useDraft } from '../lib/storage';
import {
  Banner,
  BrandTile,
  Button,
  Choice,
  IconButton,
  Loading,
  Sheet,
  TextArea,
} from '../components/ui';
const UNIT = {
  consistency: 'meals a day',
  protein: 'g protein a day',
  awareness: 'kcal a day',
} as const;
const STEP = { consistency: 1, protein: 5, awareness: 50 } as const;
const options = [
  {
    kind: 'consistency' as const,
    title: 'Find my meal rhythm',
    subtitle: 'Build a gentle, consistent logging habit.',
    target: 3,
    icon: CalendarCheck,
    rationale:
      'A simple record helps you notice your meal rhythm. Missing a day is okay.',
  },
  {
    kind: 'awareness' as const,
    title: 'Understand my eating',
    subtitle: 'Notice your energy intake without judgment.',
    target: 2000,
    icon: Flame,
    rationale:
      'Track against a target you choose. It is a reference for awareness, not a recommended calorie allowance.',
  },
  {
    kind: 'protein' as const,
    title: 'Keep protein in view',
    subtitle: 'See how your meals add up through the day.',
    target: 80,
    icon: Beef,
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
  const step0 = step === 0;
  const max =
    goal.kind === 'consistency' ? 10 : goal.kind === 'protein' ? 300 : 10000;
  const bump = (dir: 1 | -1) =>
    draft.change({
      ...goal,
      target: Math.min(
        max,
        Math.max(1, Math.round((goal.target || 0) + dir * STEP[goal.kind])),
      ),
    });
  const title = step0
    ? 'What would feel helpful?'
    : editing
      ? 'Goal & preferences'
      : 'Make it yours';
  const subtitle = step0
    ? 'Pick one focus. Tenday shapes your Today screen and guidance around it.'
    : 'Just enough context to make Tenday useful. Change it anytime.';
  const eyebrow = editing ? 'Your goal' : `Step ${step + 1} of 2`;
  const footer = (
    <>
      <Button
        trailingIcon={ArrowRight}
        busy={busy}
        onClick={step0 ? () => setStep(1) : submit}
      >
        {step0 ? 'Continue' : editing ? 'Save changes' : 'Start my day'}
      </Button>
      {step === 1 && !editing && (
        <Button variant="ghost" size="medium" onClick={() => setStep(0)}>
          Back
        </Button>
      )}
    </>
  );
  const content = (
    <div className="stack">
      {(step0 || editing) && (
        <div className="choices" role="radiogroup" aria-label="Goal">
          {options.map((o) => (
            <Choice
              key={o.kind}
              title={o.title}
              subtitle={o.subtitle}
              icon={o.icon}
              selected={goal.kind === o.kind}
              onClick={() =>
                draft.change({
                  ...goal,
                  kind: o.kind,
                  target: o.target,
                  rationale: o.rationale,
                })
              }
            />
          ))}
        </div>
      )}
      {step === 1 && (
        <>
          <div className="target-card">
            <label htmlFor="goal-target">Your daily reference</label>
            <div className="target-row">
              <IconButton
                icon={Minus}
                label="Decrease target"
                size={48}
                tone="outline"
                onClick={() => bump(-1)}
              />
              <input
                id="goal-target"
                inputMode="numeric"
                aria-label={`Daily reference in ${UNIT[goal.kind]}`}
                value={String(goal.target || '')}
                maxLength={5}
                onChange={(e) =>
                  draft.change({
                    ...goal,
                    target: Number(e.target.value.replace(/[^0-9]/g, '')),
                  })
                }
              />
              <IconButton
                icon={Plus}
                label="Increase target"
                size={48}
                tone="ink"
                onClick={() => bump(1)}
              />
            </div>
            <span>{UNIT[goal.kind]}</span>
          </div>
          <p className="caption">
            {goal.kind === 'awareness'
              ? '2,000 is an editable example, not a personal recommendation. Use a target you already know suits you.'
              : 'A reference, not a rule. Choose what works for you.'}
          </p>
          <Banner tone="lime">{goal.rationale}</Banner>
          <TextArea
            label="Food preferences (optional)"
            placeholder="e.g. vegetarian, quick lunches"
            value={goal.preferences}
            maxLength={600}
            onChange={(e) =>
              draft.change({ ...goal, preferences: e.target.value })
            }
            hint="Only what you confirm here is remembered. Clear it anytime to forget."
          />
          <p className="note-row">
            <ShieldCheck size={16} strokeWidth={2.2} />
            <span>
              For adult, everyday wellbeing. Tenday explains and tracks; it
              doesn’t diagnose or prescribe. AI actions send the input you
              choose and relevant confirmed context to OpenRouter and its
              selected provider; no paid AI is used. Voice uses your browser’s
              speech service. Personal accounts stay separate from shared demos.
            </span>
          </p>
        </>
      )}
      {error && <Banner error>{error}</Banner>}
    </div>
  );
  if (editing)
    return (
      <Sheet eyebrow={eyebrow} title={title} subtitle={subtitle} footer={footer}>
        {content}
      </Sheet>
    );
  return (
    <div className="onboarding">
      <div className="onboarding-card">
        <div className="onboarding-top">
          <BrandTile size={64} />
          <div className="step-dots" aria-hidden>
            {[0, 1].map((i) => (
              <i key={i} className={i === step ? 'on' : ''} />
            ))}
          </div>
        </div>
        <header className="page-title">
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </header>
        {content}
        <footer className="onboarding-footer">{footer}</footer>
      </div>
    </div>
  );
}
