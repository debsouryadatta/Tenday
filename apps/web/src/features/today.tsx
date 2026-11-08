import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAction, usePaginatedQuery, useQuery } from 'convex/react';
import {
  ArrowUpRight,
  Plus,
  Utensils,
  History as HistoryIcon,
  ChevronRight,
  CircleCheck,
} from 'lucide-react';
import { totals } from '@tenday/domain';
import { api, type Doc } from '../lib/backend';
import { useApp } from '../lib/app-state';
import { useDay } from '../lib/day';
import { Banner, Button, Empty, Loading, PageTitle } from '../components/ui';
export function MealRow({
  entry,
  showDay = false,
}: {
  entry: Doc<'meals'>;
  showDay?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <button
      className="list-row"
      onClick={() =>
        navigate(`/meal/${entry._id}`, {
          state: { returnTo: showDay ? '/history' : '/' },
        })
      }
    >
      <span className="row-icon">
        <Utensils size={20} />
      </span>
      <span className="row-text">
        <strong>{entry.meal.title}</strong>
        <small>
          {showDay && `${entry.day} · `}
          {entry.meal.time} · {entry.meal.items.length}{' '}
          {entry.meal.items.length === 1 ? 'item' : 'items'}
        </small>
      </span>
      <span className="row-value">
        {Math.round(totals(entry.meal.items).calories)} <small>kcal</small>
      </span>
      <ChevronRight size={18} />
    </button>
  );
}
export function Today() {
  const day = useDay(),
    { profile, connected } = useApp();
  const data = useQuery(api.records.today, { day });
  const guidance = useAction(api.assistant.guidance),
    requested = useRef('');
  useEffect(() => {
    if (!profile || !data || data.insight || !connected) return;
    const key = `${day}:${profile.revision}`;
    if (requested.current === key) return;
    requested.current = key;
    void guidance({ day }).catch(() => {});
  }, [profile, data, connected, day, guidance]);
  if (!data || !profile || !data.progress)
    return <Loading>Opening your day…</Loading>;
  const p = data.progress;
  return (
    <>
      <PageTitle
        title="Your day, a little clearer."
        subtitle={new Date(`${day}T12:00:00`).toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
        action={
          <Link className="button primary" to="/meal">
            <Plus size={19} />
            Log a meal
          </Link>
        }
      />
      {!connected && (
        <Banner>
          You’re offline. New confirmed entries stay on this device until you
          reconnect.
        </Banner>
      )}
      <div className="dashboard-grid">
        <div className="stack">
          <section className="insight">
            <div className="eyebrow">
              <CircleCheck size={19} />A LITTLE HELP FOR TODAY
              <Link to="/assistant" aria-label="Talk through today’s guidance">
                <ArrowUpRight size={23} />
              </Link>
            </div>
            <h2>
              {data.insight?.text ??
                (data.meals.length
                  ? 'Keep the next meal simple.'
                  : 'Start with one meal.')}
            </h2>
            <p>
              {data.insight?.basis ??
                (data.meals.length
                  ? `${data.meals.length} ${data.meals.length === 1 ? 'meal is' : 'meals are'} saved today. Your goal is a reference to help you notice patterns, not a reason to judge your day.`
                  : 'Log what you actually ate, with a photo or a few words. One record is a useful beginning.')}
            </p>
            <Link className="button secondary" to="/assistant">
              Talk it through
              <ArrowUpRight size={18} />
            </Link>
          </section>
          <section className="journal">
            <div className="section-heading">
              <h2>On your plate</h2>
              <Link className="text-link" to="/history">
                <HistoryIcon size={17} />
                History
              </Link>
            </div>
            {data.meals.length ? (
              <div className="list">
                {data.meals.map((entry) => (
                  <MealRow key={entry._id} entry={entry} />
                ))}
              </div>
            ) : (
              <Empty icon={Utensils} title="One meal is a good beginning.">
                Your confirmed meals will appear here. Estimates stay editable
                until you save.
              </Empty>
            )}
            <p className="small muted">
              Saved by you. Nutrition values are estimates.
            </p>
          </section>
        </div>
        <aside className="stack">
          <section className="progress-card">
            <div className="eyebrow">YOUR DAILY REFERENCE</div>
            <div
              className="progress-ring"
              role="img"
              aria-label={`${Math.round(p.value)} of ${p.target} ${p.unit}`}
              style={{
                background: `conic-gradient(var(--forest) ${p.fraction * 360}deg, var(--line) 0)`,
              }}
            >
              <div>
                <strong>{Math.round(p.value)}</strong>
                <small>
                  of {p.target} {p.unit}
                </small>
              </div>
            </div>
            <h2>
              {profile.goal.kind === 'consistency'
                ? 'Your meal rhythm'
                : profile.goal.kind === 'protein'
                  ? 'Protein in view'
                  : 'Energy awareness'}
            </h2>
            <p>
              A reference, not a rule.
              <br />
              One meal at a time.
            </p>
            <Link className="button quiet" to="/goal">
              Adjust goal
            </Link>
          </section>
          <section className="nutrition-card">
            <h2>A little balance</h2>
            <div className="metric-row">
              <span>Energy</span>
              <strong>
                {Math.round(p.daily.calories)} <small>kcal</small>
              </strong>
            </div>
            <div className="metric-row">
              <span>Protein</span>
              <strong>
                {Math.round(p.daily.protein)} <small>g</small>
              </strong>
            </div>
            <div className="metric-row">
              <span>Carbs</span>
              <strong>
                {Math.round(p.daily.carbs)} <small>g</small>
              </strong>
            </div>
            <div className="metric-row">
              <span>Fat</span>
              <strong>
                {Math.round(p.daily.fat)} <small>g</small>
              </strong>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
export function History() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.records.mealHistory,
    {},
    { initialNumItems: 20 },
  );
  return (
    <>
      <PageTitle
        title="Meals you’ve kept."
        subtitle="A useful record, with room to change your mind."
        action={
          <Link to="/meal" className="button primary">
            <Plus size={19} />
            Log a meal
          </Link>
        }
      />
      {status === 'LoadingFirstPage' ? (
        <Loading />
      ) : results.length ? (
        <div className="list">
          {results.map((entry) => (
            <MealRow key={entry._id} entry={entry} showDay />
          ))}
        </div>
      ) : (
        <Empty icon={Utensils} title="Your first meal starts the story.">
          Save a meal from Today to begin your history.
        </Empty>
      )}
      {status === 'CanLoadMore' && (
        <Button variant="secondary" onClick={() => loadMore(20)}>
          Earlier meals
        </Button>
      )}
    </>
  );
}
