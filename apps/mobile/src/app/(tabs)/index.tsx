import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useAction, useQuery } from 'convex/react';
import {
  ArrowUpRight,
  Check,
  CircleUserRound,
  Plus,
  Sparkles,
  Utensils,
} from 'lucide-react-native';
import { api } from '../../lib/backend';
import { useApp, ConnectionBanner } from '../../lib/app-state';
import { useDay } from '../../lib/day';
import {
  Brand,
  Button,
  Card,
  IconButton,
  Loading,
  ProgressRing,
  Screen,
  Section,
  Text,
  s,
} from '../../components/ui';
import { MealRow } from '../../features/meal-row';
import { c, space } from '../../theme/tokens';

export default function Today() {
  const { profile, pending, connected, retry, discard } = useApp();
  const day = useDay();
  const data = useQuery(api.records.today, { day });
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
  if (!data?.progress || !profile) return <Loading />;
  const progress = data.progress;
  const goalName =
    profile.goal.kind === 'consistency'
      ? 'Your meal rhythm'
      : profile.goal.kind === 'protein'
        ? 'Protein in view'
        : 'Your daily awareness';
  const next =
    data.meals.length === 0
      ? 'Start with the meal you’re having.'
      : progress.fraction >= 1
        ? 'Take a moment to notice what worked.'
        : 'Keep the next meal simple.';
  const basis =
    data.meals.length === 0
      ? 'A photo, a few words, or your voice is enough. You’ll review it before anything is saved.'
      : `${data.meals.length} ${data.meals.length === 1 ? 'meal is' : 'meals are'} saved today. Your goal is a reference to help you notice patterns, not a reason to judge your day.`;
  return (
    <Screen
      footer={
        <Button
          title="Log a meal"
          icon={Plus}
          onPress={() => router.push('/meal')}
        />
      }
    >
      <View style={[s.between, { marginBottom: space.xl }]}>
        <Brand />
        <IconButton
          icon={CircleUserRound}
          label="Your goal and preferences"
          onPress={() => router.push('/goal')}
        />
      </View>
      <View style={{ gap: space.sm, marginBottom: space.lg }}>
        <Text variant="title" accessibilityRole="header">
          Your day, a little clearer.
        </Text>
        <Text color={c.secondary}>
          {new Date(day + 'T12:00:00').toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>
      <View style={s.stack}>
        <ConnectionBanner />
        {pending.map((item) => (
          <Card key={item.operationId} tone="outline">
            <Text variant="strong">
              {item.status === 'failed'
                ? 'This entry needs attention'
                : 'An entry is waiting to save'}
            </Text>
            <Text variant="small" color={c.secondary}>
              {item.error ??
                'It’s kept on this device and will save when connected.'}
            </Text>
            {item.status === 'failed' && (
              <View style={s.row}>
                <Button
                  title="Retry"
                  compact
                  variant="quiet"
                  onPress={() => retry(item.operationId)}
                />
                <Button
                  title="Remove pending entry"
                  compact
                  variant="secondary"
                  onPress={() => discard(item.operationId)}
                />
              </View>
            )}
          </Card>
        ))}
        <Card tone="sage">
          <View style={s.between}>
            <View style={s.row}>
              <Sparkles size={18} color={c.forest} />
              <Text variant="label" color={c.forest}>
                A LITTLE HELP FOR TODAY
              </Text>
            </View>
            <ArrowUpRight size={19} color={c.forest} />
          </View>
          <Text variant="section">{data.insight?.text ?? next}</Text>
          <Text variant="small" color={c.secondary}>
            {data.insight?.basis ?? basis}
          </Text>
          <Button
            title="Talk it through"
            compact
            variant="secondary"
            onPress={() => router.push('/assistant')}
          />
        </Card>
        <Card tone="outline">
          <View style={[s.between, { flexWrap: 'wrap' }]}>
            <View style={{ gap: space.sm, flex: 1, minWidth: 130 }}>
              <Text variant="strong">{goalName}</Text>
              <Text variant="small" color={c.secondary}>
                {progress.fraction >= 1
                  ? 'Your reference is reached. Every day can look different.'
                  : 'One meal at a time.'}
              </Text>
              <Button
                title="Adjust goal"
                compact
                variant="quiet"
                onPress={() => router.push('/goal')}
              />
            </View>
            <ProgressRing fraction={progress.fraction}>
              <Text variant="section">{Math.round(progress.value)}</Text>
              <Text variant="label" color={c.secondary}>
                of {progress.target} {progress.unit}
              </Text>
            </ProgressRing>
          </View>
        </Card>
        {data.meals.length > 0 && (
          <View style={[s.between, { paddingHorizontal: space.sm }]}>
            {[
              ['Energy', `${Math.round(progress.daily.calories)} kcal`],
              ['Protein', `${Math.round(progress.daily.protein)} g`],
              ['Carbs', `${Math.round(progress.daily.carbs)} g`],
            ].map(([label, value]) => (
              <View key={label} style={{ gap: space.xs }}>
                <Text variant="small" color={c.secondary}>
                  {label}
                </Text>
                <Text variant="strong">{value}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <Section
        title="On your plate"
        action="History"
        onPress={() => router.push('/history')}
      />
      {data.meals.length ? (
        data.meals.map((entry) => <MealRow key={entry._id} entry={entry} />)
      ) : (
        <Card>
          <View style={s.row}>
            <Utensils size={22} color={c.forest} />
            <Text variant="strong">Your first meal goes here</Text>
          </View>
          <Text variant="small" color={c.secondary}>
            No perfect tracking needed. Start with what’s in front of you.
          </Text>
        </Card>
      )}
      {data.meals.length > 0 && (
        <View style={[s.row, { marginTop: space.lg }]}>
          <Check size={16} color={c.forest} />
          <Text variant="small" color={c.secondary}>
            Saved by you. Nutrition values are estimates.
          </Text>
        </View>
      )}
    </Screen>
  );
}
