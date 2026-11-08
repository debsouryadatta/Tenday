import { useEffect, useMemo, useRef } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAction, usePaginatedQuery, useQuery } from 'convex/react';
import {
  Camera,
  Flame,
  Utensils,
  Beef,
  type LucideIcon,
} from 'lucide-react-native';
import { api } from '../../lib/backend';
import { useApp, ConnectionBanner } from '../../lib/app-state';
import { useDay } from '../../lib/day';
import { useIdentity } from '../../lib/auth-session';
import {
  Banner,
  Button,
  Card,
  LinkButton,
  Loading,
  MacroTile,
  ProgressRing,
  Screen,
  Section,
  Text,
  s,
} from '../../components/ui';
import { FloatingLog } from '../../components/tab-bar';
import { AssistantMark } from '../../components/assistant-mark';
import { AccountBar } from '../../features/auth';
import { MealRow } from '../../features/meal-row';
import { formatDay, greeting, weekEnding } from '../../lib/format';
import { NAV_MODE } from '../../constants';
import { c, radius, space } from '../../theme/tokens';

const GOAL_META: Record<
  'consistency' | 'protein' | 'awareness',
  { label: string; icon: LucideIcon; unit: string }
> = {
  consistency: { label: 'Meals logged', icon: Utensils, unit: 'meals' },
  protein: { label: 'Protein today', icon: Beef, unit: 'g' },
  awareness: { label: 'Energy today', icon: Flame, unit: 'kcal' },
};

export default function Today() {
  const router = useRouter();
  const { profile, pending, connected, retry, discard } = useApp();
  const { account } = useIdentity();
  const day = useDay();
  const data = useQuery(api.records.today, { day });
  const recent = usePaginatedQuery(
    api.records.mealHistory,
    {},
    { initialNumItems: 60 },
  );
  const guidance = useAction(api.assistant.guidance);
  const requested = useRef('');
  useEffect(() => {
    if (!profile || !data || data.insight || !connected) return;
    const key = `${day}:${profile.revision}`;
    if (requested.current === key) return;
    const timer = setTimeout(() => {
      requested.current = key;
      void guidance({ day }).catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, [profile, data, day, connected, guidance]);
  const week = useMemo(() => {
    const logged = new Set(recent.results.map((m) => m.day));
    return weekEnding(day).map((d) => ({ ...d, logged: logged.has(d.key) }));
  }, [recent.results, day]);
  if (!data?.progress || !profile) return <Loading />;
  const progress = data.progress;
  const kind = profile.goal.kind;
  const meta = GOAL_META[kind];
  const daily = progress.daily;
  const macroKcal = daily.protein * 4 + daily.carbs * 4 + daily.fat * 9 || 1;
  const firstName = account?.name?.split(' ')[0];
  const reached = progress.fraction >= 1;
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
  const streak = (() => {
    let n = 0;
    for (let i = week.length - 1; i >= 0; i--) {
      if (week[i].logged) n++;
      else if (i === week.length - 1) continue;
      else break;
    }
    return n;
  })();
  const remaining = Math.max(progress.target - progress.value, 0);
  return (
    <Screen
      bottomInset={NAV_MODE === 'fullscreen' ? 88 : 0}
      floating={NAV_MODE === 'fullscreen' ? <FloatingLog /> : undefined}
    >
      <AccountBar />
      <View style={{ gap: 6, marginBottom: space.lg }}>
        <Text variant="eyebrow" color={c.secondary}>
          {formatDay(day, 'weekday')}
        </Text>
        <Text variant="display" accessibilityRole="header">
          {greeting()}
          {firstName ? `, ${firstName}` : ''}
        </Text>
      </View>

      {/* Week strip */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`This week: meals logged on ${week.filter((d) => d.logged).length} of 7 days. Open history`}
        onPress={() => router.push('/history')}
        style={({ pressed }) => [
          s.row,
          { gap: 6, marginBottom: space.base, opacity: pressed ? 0.75 : 1 },
        ]}
      >
        {week.map((d) => {
          const today = d.key === day;
          return (
            <View
              key={d.key}
              style={{
                flex: 1,
                alignItems: 'center',
                gap: 6,
                paddingVertical: 10,
                borderRadius: radius.md,
                backgroundColor: today ? c.ink : 'transparent',
              }}
            >
              <Text variant="label" color={today ? c.onInkMuted : c.secondary}>
                {d.letter}
              </Text>
              <Text variant="smallStrong" color={today ? c.onInk : c.ink} tabular>
                {d.date}
              </Text>
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: d.logged
                    ? today
                      ? c.lime
                      : c.ink
                    : today
                      ? c.inkSoft
                      : c.surfaceStrong,
                }}
              />
            </View>
          );
        })}
      </Pressable>

      <View style={s.stack}>
        <ConnectionBanner />
        {pending.map((item) => (
          <Banner
            key={item.operationId}
            tone={item.status === 'failed' ? 'error' : 'info'}
            title={
              item.status === 'failed'
                ? 'This entry needs attention'
                : 'Waiting to save'
            }
            action={
              item.status === 'failed' ? (
                <View style={[s.row, { marginTop: space.sm, flexWrap: 'wrap' }]}>
                  <Button
                    title="Retry"
                    size="small"
                    compact
                    onPress={() => retry(item.operationId)}
                  />
                  <Button
                    title="Remove"
                    size="small"
                    compact
                    variant="outline"
                    onPress={() => discard(item.operationId)}
                  />
                </View>
              ) : undefined
            }
          >
            {item.error ?? 'Kept on this device. It saves when you’re connected.'}
          </Banner>
        ))}

        {/* Goal hero */}
        <Card
          tone="surface"
          style={{ padding: space.lg, borderRadius: radius.xl, gap: space.lg }}
        >
          <View style={[s.between, { alignItems: 'center' }]}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text variant="smallStrong" color={c.secondary}>
                {meta.label}
              </Text>
              <Text variant="metric" tabular adjustsFontSizeToFit numberOfLines={1}>
                {Math.round(progress.value).toLocaleString()}
              </Text>
              <Text variant="small" color={c.secondary} tabular>
                of {progress.target.toLocaleString()} {meta.unit}
                {!reached && remaining > 0
                  ? ` · ${Math.round(remaining).toLocaleString()} to go`
                  : ''}
              </Text>
            </View>
            <ProgressRing
              fraction={progress.fraction}
              size={108}
              stroke={11}
              color={reached ? c.lime : c.ink}
              track={c.surfaceStrong}
            >
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: reached ? c.ink : c.screen,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <meta.icon
                  size={22}
                  color={reached ? c.lime : c.ink}
                  strokeWidth={2.2}
                />
              </View>
            </ProgressRing>
          </View>
          <View
            style={[
              s.between,
              {
                borderTopWidth: 1,
                borderColor: c.line,
                paddingTop: space.md,
              },
            ]}
          >
            <Text variant="small" color={c.secondary} style={{ flex: 1 }}>
              {reached
                ? 'Reference reached. Every day can look different.'
                : kind === 'awareness'
                  ? `${data.meals.length} ${data.meals.length === 1 ? 'meal' : 'meals'} today`
                  : `${Math.round(daily.calories).toLocaleString()} kcal today`}
              {streak > 1 ? ` · ${streak}-day rhythm` : ''}
            </Text>
            <LinkButton title="Adjust goal" onPress={() => router.push('/goal')} />
          </View>
        </Card>

        {/* Macros */}
        <View style={[s.row, { gap: 10, alignItems: 'stretch' }]}>
          <MacroTile
            label="Protein"
            value={daily.protein}
            color={c.protein}
            fraction={(daily.protein * 4) / macroKcal}
          />
          <MacroTile
            label="Carbs"
            value={daily.carbs}
            color={c.carbs}
            fraction={(daily.carbs * 4) / macroKcal}
          />
          <MacroTile
            label="Fat"
            value={daily.fat}
            color={c.fat}
            fraction={(daily.fat * 9) / macroKcal}
          />
        </View>

        {/* Guidance */}
        <Card
          tone="lime"
          onPress={() => router.navigate('/assistant')}
          accessibilityLabel="Talk today’s guidance through with the assistant"
          style={{ borderRadius: radius.xl, gap: space.sm }}
        >
          <View style={[s.row, { gap: 8 }]}>
            <AssistantMark size={24} halo={c.limeSoft} />
            <Text variant="eyebrow" color={c.limeInk}>
              For today
            </Text>
          </View>
          <Text variant="section" style={{ fontSize: 19, lineHeight: 25 }}>
            {data.insight?.text ?? next}
          </Text>
          <Text variant="small" color={c.inkSoft}>
            {data.insight?.basis ?? basis}
          </Text>
          <View style={[s.row, { marginTop: space.xs }]}>
            <View
              style={[
                s.row,
                {
                  gap: 6,
                  backgroundColor: c.ink,
                  borderRadius: radius.pill,
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                },
              ]}
            >
              <Text variant="smallStrong" color={c.onInk}>
                Talk it through
              </Text>
            </View>
          </View>
        </Card>
      </View>

      <Section
        title="Today’s meals"
        action="History"
        onPress={() => router.push('/history')}
      />
      {data.meals.length ? (
        <View style={{ gap: 10 }}>
          {data.meals.map((entry) => (
            <MealRow key={entry._id} entry={entry} />
          ))}
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log your first meal"
          onPress={() => router.push('/meal')}
          style={({ pressed }) => ({
            borderWidth: 1.5,
            borderStyle: 'dashed',
            borderColor: c.lineStrong,
            borderRadius: radius.xl,
            padding: space.lg,
            alignItems: 'center',
            gap: space.sm,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: c.ink,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: space.xs,
            }}
          >
            <Camera size={22} color={c.lime} strokeWidth={2.2} />
          </View>
          <Text variant="heading">Log your first meal</Text>
          <Text variant="small" color={c.secondary} style={{ textAlign: 'center', maxWidth: 280 }}>
            No perfect tracking needed. Snap it, say it or type it.
          </Text>
        </Pressable>
      )}
      {data.meals.length > 0 && (
        <Text
          variant="caption"
          color={c.secondary}
          style={{ marginTop: space.base, textAlign: 'center' }}
        >
          Saved by you · Nutrition values are estimates
        </Text>
      )}
    </Screen>
  );
}
