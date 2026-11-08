import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react-native';
import { type Reading, type ReportInput } from '@tenday/domain';
import { Button, Input, NumberInput, Text, s } from '../components/ui';
import { StatusChip } from './reading';
import { c, radius, space } from '../theme/tokens';
export const blankReading = (): Reading => ({
  marker: '',
  value: '',
  unit: '',
  reference: '',
  low: null,
  high: null,
  page: null,
});
export function ReportReview({
  report,
  onChange,
}: {
  report: ReportInput;
  onChange: (report: ReportInput) => void;
}) {
  const [expanded, setExpanded] = useState(-1);
  function update(index: number, patch: Partial<Reading>) {
    onChange({
      ...report,
      readings: report.readings.map((r, i) =>
        i === index ? { ...r, ...patch } : r,
      ),
    });
  }
  return (
    <View style={{ gap: space.base }}>
      <Input
        label="Report title"
        placeholder="e.g. Annual blood panel"
        value={report.title}
        maxLength={100}
        onChangeText={(title) => onChange({ ...report, title })}
      />
      <Input
        label="Report date"
        hint="YYYY-MM-DD, as printed on the report"
        value={report.day}
        onChangeText={(day) => onChange({ ...report, day })}
      />
      <View style={[s.between, { marginTop: space.sm }]}>
        <Text variant="section">
          Values{' '}
          <Text variant="section" color={c.muted}>
            {report.readings.length}
          </Text>
        </Text>
        <Text variant="small" color={c.secondary}>
          Tap to check
        </Text>
      </View>
      <Text variant="caption" color={c.secondary}>
        Keep symbols such as “&lt;5” or “negative”. Leave missing intervals blank.
      </Text>
      {report.readings.map((r, i) => {
        const open = expanded === i || !r.marker;
        return (
          <View
            key={i}
            style={{
              backgroundColor: c.surface,
              borderRadius: radius.lg,
              padding: space.base,
              gap: space.md,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
              accessibilityLabel={`${r.marker || `Value ${i + 1}`}: ${r.value || 'not entered'} ${r.unit}. ${open ? 'Collapse' : 'Edit'}`}
              onPress={() => setExpanded(expanded === i ? -1 : i)}
              style={[s.between, { alignItems: 'flex-start' }]}
            >
              <View style={{ flex: 1, gap: 6 }}>
                <Text variant="strong">{r.marker || `Value ${i + 1}`}</Text>
                {r.reference ? (
                  <Text variant="caption" color={c.secondary}>
                    Interval {r.reference}
                  </Text>
                ) : null}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text variant="strong" tabular>
                  {r.value || '—'}{' '}
                  <Text variant="caption" color={c.secondary}>
                    {r.unit}
                  </Text>
                </Text>
                {open ? (
                  <ChevronUp size={18} color={c.secondary} />
                ) : (
                  <ChevronDown size={18} color={c.secondary} />
                )}
              </View>
            </Pressable>
            {!open && r.value ? <StatusChip reading={r} /> : null}
            {open && (
              <View
                style={{
                  gap: space.md,
                  borderTopWidth: 1,
                  borderColor: c.line,
                  paddingTop: space.md,
                }}
              >
                <Input
                  label="Marker name"
                  value={r.marker}
                  onChangeText={(marker) => update(i, { marker })}
                />
                <View style={[s.row, { alignItems: 'flex-start' }]}>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Exact result"
                      value={r.value}
                      onChangeText={(value) => update(i, { value })}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Unit"
                      hint="If printed"
                      value={r.unit}
                      onChangeText={(unit) => update(i, { unit })}
                    />
                  </View>
                </View>
                <Input
                  label="Lab reference interval"
                  hint="As printed on the report"
                  value={r.reference}
                  onChangeText={(reference) => update(i, { reference })}
                />
                <View style={[s.row, { alignItems: 'flex-start' }]}>
                  <View style={{ flex: 1 }}>
                    <NumberInput
                      label="Lower bound"
                      hint="Optional"
                      nullable
                      keyboardType="numbers-and-punctuation"
                      value={r.low}
                      onChangeValue={(low) => update(i, { low })}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <NumberInput
                      label="Upper bound"
                      hint="Optional"
                      nullable
                      keyboardType="numbers-and-punctuation"
                      value={r.high}
                      onChangeValue={(high) => update(i, { high })}
                    />
                  </View>
                </View>
                <NumberInput
                  label="Source page"
                  hint="Optional, 1–3"
                  nullable
                  keyboardType="number-pad"
                  value={r.page}
                  onChangeValue={(page) => update(i, { page })}
                />
                <Button
                  title="Remove value"
                  icon={Trash2}
                  variant="danger"
                  size="medium"
                  onPress={() =>
                    onChange({
                      ...report,
                      readings: report.readings.filter((_, index) => index !== i),
                    })
                  }
                />
              </View>
            )}
          </View>
        );
      })}
      <Button
        title="Add a value"
        icon={Plus}
        variant="outline"
        size="medium"
        disabled={report.readings.length >= 60}
        onPress={() => {
          onChange({
            ...report,
            readings: [...report.readings, blankReading()],
          });
          setExpanded(report.readings.length);
        }}
      />
      <Input
        label="Source notes & uncertainties"
        placeholder="Anything unclear on the original"
        multiline
        value={report.note}
        maxLength={600}
        onChangeText={(note) => onChange({ ...report, note })}
      />
      <Text variant="caption" color={c.secondary}>
        “Confirmed” means you reviewed these values, not that Tenday verified a
        medical interpretation.
      </Text>
    </View>
  );
}
