import { View } from 'react-native';
import { readingStatus, type Reading } from '@tenday/domain';
import { Chip, Text } from '../components/ui';
import { c } from '../theme/tokens';

export function statusCounts(readings: Reading[]) {
  const counts = { within: 0, outside: 0, unavailable: 0 };
  for (const r of readings) {
    const st = readingStatus(r);
    if (st === 'within') counts.within++;
    else if (st === 'unavailable') counts.unavailable++;
    else counts.outside++;
  }
  return counts;
}

export function StatusChip({ reading }: { reading: Reading }) {
  const st = readingStatus(reading);
  if (st === 'within') return <Chip label="In range" tone="success" />;
  if (st === 'above') return <Chip label="Above range" tone="warning" />;
  if (st === 'below') return <Chip label="Below range" tone="warning" />;
  return <Chip label="No comparison" tone="outline" />;
}

/** Positions the value against the lab's own interval. Hidden when not numeric. */
export function RangeBar({ reading }: { reading: Reading }) {
  const { low, high } = reading;
  if (!/^-?\d+(\.\d+)?$/.test(reading.value.trim())) return null;
  if (low === null && high === null) return null;
  const value = Number(reading.value);
  let min: number, max: number, bandFrom: number, bandTo: number;
  if (low !== null && high !== null) {
    const span = Math.max(high - low, Math.abs(high) * 0.1, 1e-6);
    min = low - span * 0.5;
    max = high + span * 0.5;
    bandFrom = low;
    bandTo = high;
  } else if (high !== null) {
    min = Math.min(0, value);
    max = Math.max(high * 1.5, value * 1.1, high + 1e-6);
    bandFrom = min;
    bandTo = high;
  } else {
    const l = low as number;
    min = Math.min(l * 0.5, value * 0.9);
    max = Math.max(l * 1.5, value * 1.1, l + 1e-6);
    bandFrom = l;
    bandTo = max;
  }
  const pos = (v: number) =>
    Math.max(0, Math.min(1, (v - min) / (max - min || 1))) * 100;
  const inside = readingStatus(reading) === 'within';
  const dot = Math.max(3, Math.min(97, pos(value)));
  return (
    <View
      accessible
      accessibilityLabel={`Value ${reading.value} against interval ${reading.reference || `${low ?? ''}–${high ?? ''}`}`}
      style={{ gap: 6, marginTop: 4 }}
    >
      <View style={{ height: 14, justifyContent: 'center' }}>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: c.surfaceStrong }} />
        <View
          style={{
            position: 'absolute',
            left: `${pos(bandFrom)}%`,
            width: `${pos(bandTo) - pos(bandFrom)}%`,
            height: 6,
            borderRadius: 3,
            backgroundColor: '#BFE3A8',
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: `${dot}%`,
            marginLeft: -7,
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: inside ? c.ink : c.carbs,
            borderWidth: 2.5,
            borderColor: c.screen,
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="caption" color={c.secondary}>
          {low !== null ? `Low ${low}` : ''}
        </Text>
        <Text variant="caption" color={c.secondary}>
          {high !== null ? `High ${high}` : ''}
        </Text>
      </View>
    </View>
  );
}
