import { useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAction, usePaginatedQuery, useQuery } from 'convex/react';
import {
  ArrowLeft,
  Beef,
  Camera,
  Flame,
  Utensils,
  type LucideIcon,
} from 'lucide-react';
import { AssistantMark } from '../components/assistant-mark';
import { localDay, totals } from '@tenday/domain';
import { api } from '../lib/backend';
import { useApp } from '../lib/app-state';
import { useDay } from '../lib/day';
import { useIdentity } from '../../../mobile/src/lib/auth-session';
import {
  Banner,
  Button,
  Empty,
  IconButton,
  LinkButton,
  Loading,
  MacroTile,
  PageTitle,
  ProgressRing,
  Section,
} from '../components/ui';
import { AccountBar } from '../components/shell';
import { MealRow } from './meal-row';
import { formatDay, greeting, groupByDay, weekEnding } from '../lib/format';

export { MealRow } from './meal-row';

const GOAL_META: Record<
  'consistency' | 'protein' | 'awareness',
  { label: string; icon: LucideIcon; unit: string }
> = {
  consistency: { label: 'Meals logged', icon: Utensils, unit: 'meals' },
  protein: { label: 'Protein today', icon: Beef, unit: 'g' },
  awareness: { label: 'Energy today', icon: Flame, unit: 'kcal' },
};

export function ConnectionBanner() {
  const { connected } = useApp();
  return connected ? null : (
    <Banner tone="warning" title="You’re offline">
      Saved records may be cached. New entries stay on this device until you
      reconnect.
    </Banner>
  );
}

export function Today() {
  const day = useDay(),
    { profile, connected } = useApp(),
    { account } = useIdentity();
  const data = useQuery(api.records.today, { day });
  const recent = usePaginatedQuery(
    api.records.mealHistory,
    {},
    { initialNumItems: 60 },
  );
  const guidance = useAction(api.assistant.guidance),
    requested = useRef('');
  useEffect(() => {
    if (!profile || !data || data.insight || !connected) return;
    const key = `${day}:${profile.revision}`;
    if (requested.current === key) return;
    requested.current = key;
    void guidance({ day }).catch(() => {});
  }, [profile, data, connected, day, guidance]);
  const week = useMemo(() => {
    const logged = new Set(recent.results.map((m) => m.day));
    return weekEnding(day).map((d) => ({ ...d, logged: logged.has(d.key) }));
  }, [recent.results, day]);
  if (!data || !profile || !data.progress) return <Loading />;
  const progress = data.progress;
  const kind = profile.goal.kind;
  const meta = GOAL_META[kind];
  const daily = progress.daily;
  const macroKcal = daily.protein * 4 + daily.carbs * 4 + daily.fat * 9 || 1;
  const firstName = account?.name?.split(' ')[0];
  const reached = progress.fraction >= 1;
  const remaining = Math.max(progress.target - progress.value, 0);
  const next =
    data.meals.length === 0
      ? 'Start with the meal you’re having.'
      : reached
        ? 'Take a moment to notice what worked.'
        : 'Keep the next meal simple.';
  const basis =
    data.meals.length === 0
      ? 'A photo, a few words or your voice is enough. You’ll review it before anything is saved.'
      : `${data.meals.length} ${data.meals.length === 1 ? 'meal is' : 'meals are'} saved today. Your goal is a reference to help you notice patterns, not a reason to judge your day.`;
  let streak = 0;
  for (let i = week.length - 1; i >= 0; i--) {
    if (week[i].logged) streak++;
    else if (i === week.length - 1) continue;
    else break;
  }
  const loggedDays = week.filter((d) => d.logged).length;
  return (
    <div className="page today">
      <AccountBar />
      <PageTitle
        eyebrow={formatDay(day, 'weekday')}
        title={`${greeting()}${firstName ? `, ${firstName}` : ''}`}
      />
      <div className="today-grid">
        <div className="today-main stack">
          <Link
            to="/history"
            className="week-strip"
            aria-label={`This week: meals logged on ${loggedDays} of 7 days. Open history`}
          >
            {week.map((d) => (
              <span
                key={d.key}
                className={`week-day ${d.key === day ? 'today' : ''} ${d.logged ? 'logged' : ''}`}
              >
                <small>{d.letter}</small>
                <strong>{d.date}</strong>
                <i />
              </span>
            ))}
          </Link>
          <ConnectionBanner />
          <section className="goal-hero" aria-label="Today’s goal">
            <div className="goal-hero-top">
              <div className="goal-hero-text">
                <span className="goal-label">{meta.label}</span>
                <strong className="metric">
                  {Math.round(progress.value).toLocaleString()}
                </strong>
                <span className="goal-sub">
                  of {progress.target.toLocaleString()} {meta.unit}
                  {!reached && remaining > 0
                    ? ` · ${Math.round(remaining).toLocaleString()} to go`
                    : ''}
                </span>
              </div>
              <ProgressRing
                fraction={progress.fraction}
                size={108}
                stroke={11}
                color={reached ? 'var(--lime)' : 'var(--ink)'}
                label={`${Math.round(progress.fraction * 100)}% of today’s reference`}
              >
                <span className={`ring-icon ${reached ? 'reached' : ''}`}>
                  <meta.icon size={22} strokeWidth={2.2} />
                </span>
              </ProgressRing>
            </div>
            <div className="goal-hero-foot">
              <span>
                {reached
                  ? 'Reference reached. Every day can look different.'
                  : kind === 'awareness'
                    ? `${data.meals.length} ${data.meals.length === 1 ? 'meal' : 'meals'} today`
                    : `${Math.round(daily.calories).toLocaleString()} kcal today`}
                {streak > 1 ? ` · ${streak}-day rhythm` : ''}
              </span>
              <LinkButton to="/goal">Adjust goal</LinkButton>
            </div>
          </section>
          <div className="macro-row">
            <MacroTile
              label="Protein"
              value={daily.protein}
              color="var(--protein)"
              fraction={(daily.protein * 4) / macroKcal}
            />
            <MacroTile
              label="Carbs"
              value={daily.carbs}
              color="var(--carbs)"
              fraction={(daily.carbs * 4) / macroKcal}
            />
            <MacroTile
              label="Fat"
              value={daily.fat}
              color="var(--fat)"
              fraction={(daily.fat * 9) / macroKcal}
            />
          </div>
          <Link
            to="/assistant"
            className="guidance-card"
            aria-label="Talk today’s guidance through with the assistant"
          >
            <span className="eyebrow lime-ink">
              <AssistantMark size={22} halo="var(--limeSoft)" />
              For today
            </span>
            <h2>{data.insight?.text ?? next}</h2>
            <p>{data.insight?.basis ?? basis}</p>
            <span className="pill-ink">Talk it through</span>
          </Link>
        </div>
        <div className="today-side">
          <Section
            title="Today’s meals"
            action={<LinkButton to="/history">History</LinkButton>}
          />
          {data.meals.length ? (
            <div className="meal-list">
              {data.meals.map((entry) => (
                <MealRow key={entry._id} entry={entry} />
              ))}
            </div>
          ) : (
            <Link className="first-meal" to="/meal" aria-label="Log your first meal">
              <span className="first-meal-icon">
                <Camera size={22} strokeWidth={2.2} />
              </span>
              <strong>Log your first meal</strong>
              <span>No perfect tracking needed. Snap it, say it or type it.</span>
            </Link>
          )}
          {data.meals.length > 0 && (
            <p className="footnote">Saved by you · Nutrition values are estimates</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function History() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.records.mealHistory,
    {},
    { initialNumItems: 20 },
  );
  const today = localDay();
  return (
    <div className="page narrow">
      <div className="page-top">
        <LinkButtonBack />
      </div>
      <PageTitle
        eyebrow="Meal history"
        title="Your rhythm"
        subtitle="Every confirmed meal, one day at a time."
      />
      {status === 'LoadingFirstPage' ? (
        <Loading>Opening history…</Loading>
      ) : results.length ? (
        <div className="history">
          {groupByDay(results).map((group) => {
            const kcal = group.items.reduce(
              (sum, m) => sum + totals(m.meal.items).calories,
              0,
            );
            return (
              <section key={group.day} className="history-day">
                <header>
                  <h2>{group.day === today ? 'Today' : formatDay(group.day, 'weekday')}</h2>
                  <span>
                    {group.items.length} {group.items.length === 1 ? 'meal' : 'meals'} ·{' '}
                    {Math.round(kcal).toLocaleString()} kcal
                  </span>
                </header>
                <div className="meal-list">
                  {group.items.map((entry) => (
                    <MealRow key={entry._id} entry={entry} showDay={false} returnTo="/history" />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <Empty icon={Utensils} title="A fresh page">
          Your confirmed meals will appear here, grouped by day.
        </Empty>
      )}
      {status === 'CanLoadMore' && (
        <Button variant="secondary" size="medium" onClick={() => loadMore(20)}>
          Show earlier meals
        </Button>
      )}
    </div>
  );
}
function LinkButtonBack() {
  const navigate = useNavigate();
  return (
    <IconButton
      icon={ArrowLeft}
      label="Go back"
      onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
    />
  );
}
