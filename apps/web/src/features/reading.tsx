import { readingStatus, type Reading } from '@tenday/domain';
import { Chip } from '../components/ui';

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
  return <Chip label="No comparison" />;
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
    <div
      className="range"
      role="img"
      aria-label={`Value ${reading.value} against interval ${reading.reference || `${low ?? ''}–${high ?? ''}`}`}
    >
      <div className="range-track">
        <span
          className="range-band"
          style={{ left: `${pos(bandFrom)}%`, width: `${pos(bandTo) - pos(bandFrom)}%` }}
        />
        <span className={`range-dot ${inside ? '' : 'outside'}`} style={{ left: `${dot}%` }} />
      </div>
      <div className="range-labels">
        <span>{low !== null ? `Low ${low}` : ''}</span>
        <span>{high !== null ? `High ${high}` : ''}</span>
      </div>
    </div>
  );
}
