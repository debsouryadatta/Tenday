import { useState } from 'react';
import { View } from 'react-native';
import { ChevronDown, Plus, Trash2 } from 'lucide-react-native';
import { type Reading, type ReportInput } from '@tenday/domain';
import {
  Button,
  Card,
  Input,
  NumberInput,
  Row,
  Text,
  s,
} from '../components/ui';
import { c } from '../theme/tokens';
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
    <View style={s.stack}>
      <Input
        label="Report title"
        value={report.title}
        maxLength={100}
        onChangeText={(title) => onChange({ ...report, title })}
      />
      <Input
        label="Report date (YYYY-MM-DD)"
        value={report.day}
        onChangeText={(day) => onChange({ ...report, day })}
      />
      <Text variant="small" color={c.secondary}>
        Check against your source. Keep exact units and symbols such as “&lt;5”
        or “negative”. Leave missing intervals blank.
      </Text>
      {report.readings.map((r, i) => (
        <Card key={i} tone="outline">
          <Row
            title={r.marker || `Value ${i + 1}`}
            subtitle={`${r.value || 'Not entered'} ${r.unit}`}
            trailing={<ChevronDown size={18} color={c.forest} />}
            onPress={() => setExpanded(expanded === i ? -1 : i)}
          />
          {expanded === i && (
            <>
              <Input
                label="Marker name"
                value={r.marker}
                onChangeText={(marker) => update(i, { marker })}
              />
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Exact result"
                    value={r.value}
                    onChangeText={(value) => update(i, { value })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Unit (if printed)"
                    value={r.unit}
                    onChangeText={(unit) => update(i, { unit })}
                  />
                </View>
              </View>
              <Input
                label="Lab reference interval (as printed)"
                value={r.reference}
                onChangeText={(reference) => update(i, { reference })}
              />
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <NumberInput
                    label="Lower bound (optional)"
                    nullable
                    keyboardType="numbers-and-punctuation"
                    value={r.low}
                    onChangeValue={(low) => update(i, { low })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <NumberInput
                    label="Upper bound (optional)"
                    nullable
                    keyboardType="numbers-and-punctuation"
                    value={r.high}
                    onChangeValue={(high) => update(i, { high })}
                  />
                </View>
              </View>
              <NumberInput
                label="Source page (optional, 1–3)"
                nullable
                keyboardType="number-pad"
                value={r.page}
                onChangeValue={(page) => update(i, { page })}
              />
              <Button
                title="Remove value"
                icon={Trash2}
                variant="danger"
                onPress={() =>
                  onChange({
                    ...report,
                    readings: report.readings.filter((_, index) => index !== i),
                  })
                }
              />
            </>
          )}
        </Card>
      ))}
      <Button
        title="Add a value"
        icon={Plus}
        variant="secondary"
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
        multiline
        value={report.note}
        maxLength={600}
        onChangeText={(note) => onChange({ ...report, note })}
      />
      <Text variant="small" color={c.secondary}>
        Save only after checking the values. “Confirmed” means you reviewed
        them, not that Tenday verified a medical interpretation.
      </Text>
    </View>
  );
}
