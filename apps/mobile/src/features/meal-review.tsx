import { useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  Trash2,
} from 'lucide-react-native';
import {
  blankItem,
  totals,
  type MealInput,
  type MealItem,
} from '@tenday/domain';
import {
  Button,
  IconButton,
  Input,
  NumberInput,
  Text,
  s,
} from '../components/ui';
import { formatDay } from '../lib/format';
import { c, radius, space } from '../theme/tokens';

/** Cal AI-style meal total: one big number with the three macros beneath. */
export function MealTotal({ meal }: { meal: MealInput }) {
  const total = totals(meal.items);
  return (
    <View
      accessible
      accessibilityLabel={`Meal total ${Math.round(total.calories)} kilocalories, ${Math.round(total.protein)} grams protein, ${Math.round(total.carbs)} grams carbs, ${Math.round(total.fat)} grams fat`}
      style={{
        backgroundColor: c.ink,
        borderRadius: radius.xl,
        padding: space.lg,
        gap: space.lg,
      }}
    >
      <View style={{ gap: 2 }}>
        <Text variant="smallStrong" color={c.onInkMuted}>
          Meal total · estimate
        </Text>
        <View style={[s.row, { alignItems: 'baseline', gap: 6 }]}>
          <Text variant="metric" color={c.onInk} tabular>
            {Math.round(total.calories).toLocaleString()}
          </Text>
          <Text variant="heading" color={c.lime}>
            kcal
          </Text>
        </View>
      </View>
      <View style={[s.row, { gap: space.sm }]}>
        {(
          [
            ['Protein', total.protein, c.protein],
            ['Carbs', total.carbs, c.carbs],
            ['Fat', total.fat, c.fat],
          ] as const
        ).map(([label, value, color]) => (
          <View
            key={label}
            style={{
              flex: 1,
              backgroundColor: c.inkSoft,
              borderRadius: radius.md,
              padding: space.md,
              gap: 4,
            }}
          >
            <View style={[s.row, { gap: 6 }]}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
              <Text variant="caption" color={c.onInkMuted}>
                {label}
              </Text>
            </View>
            <Text variant="metricSm" color={c.onInk} tabular>
              {Math.round(value)}
              <Text variant="small" color={c.onInkMuted}>
                {' '}g
              </Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function MealReview({
  meal,
  onChange,
}: {
  meal: MealInput;
  onChange: (meal: MealInput) => void;
}) {
  const [expanded, setExpanded] = useState(-1);
  const [editDate, setEditDate] = useState(false);
  function change(index: number, update: Partial<MealItem>) {
    onChange({
      ...meal,
      items: meal.items.map((item, i) =>
        i === index ? { ...item, ...update } : item,
      ),
    });
  }
  const validDay = /^\d{4}-\d{2}-\d{2}$/.test(meal.day);
  return (
    <View style={{ gap: space.base }}>
      <Input
        label="Meal name"
        placeholder="e.g. Paneer wrap and salad"
        value={meal.title}
        maxLength={100}
        onChangeText={(title) => onChange({ ...meal, title })}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Date and time ${meal.day} ${meal.time}. ${editDate ? 'Hide' : 'Edit'}`}
        onPress={() => setEditDate(!editDate)}
        style={({ pressed }) => [
          s.row,
          {
            alignSelf: 'flex-start',
            gap: 8,
            paddingHorizontal: 14,
            minHeight: 40,
            borderRadius: radius.pill,
            backgroundColor: pressed ? c.surfaceStrong : c.surface,
          },
        ]}
      >
        <CalendarClock size={16} color={c.ink} strokeWidth={2.2} />
        <Text variant="smallStrong">
          {validDay ? formatDay(meal.day, 'short') : meal.day} · {meal.time}
        </Text>
        {editDate ? (
          <ChevronUp size={16} color={c.secondary} />
        ) : (
          <ChevronDown size={16} color={c.secondary} />
        )}
      </Pressable>
      {editDate && (
        <View style={[s.row, { alignItems: 'flex-start' }]}>
          <View style={{ flex: 1 }}>
            <Input
              label="Date"
              hint="YYYY-MM-DD"
              value={meal.day}
              onChangeText={(day) => onChange({ ...meal, day })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label="Time"
              hint="24-hour, HH:MM"
              value={meal.time}
              onChangeText={(time) => onChange({ ...meal, time })}
            />
          </View>
        </View>
      )}

      <MealTotal meal={meal} />

      <View style={[s.between, { marginTop: space.sm }]}>
        <Text variant="section">Items</Text>
        <Text variant="small" color={c.secondary}>
          Tap an item to edit
        </Text>
      </View>
      {meal.items.map((item, index) => {
        const open = expanded === index || !item.name;
        return (
          <View
            key={index}
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
              accessibilityLabel={`${item.name || `Food ${index + 1}`}, ${Math.round(item.calories * item.quantity)} kilocalories. ${open ? 'Collapse' : 'Edit details'}`}
              onPress={() => setExpanded(expanded === index ? -1 : index)}
              style={[s.between, { alignItems: 'flex-start' }]}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="strong" numberOfLines={2}>
                  {item.name || `Add food ${index + 1}`}
                </Text>
                <Text variant="small" color={c.secondary}>
                  {item.portion}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text variant="strong" tabular>
                  {Math.round(item.calories * item.quantity)}
                </Text>
                <Text variant="caption" color={c.secondary}>
                  kcal
                </Text>
              </View>
            </Pressable>
            <View style={s.between}>
              <Text variant="caption" color={c.secondary} tabular>
                P {Math.round(item.protein * item.quantity)}g · C{' '}
                {Math.round(item.carbs * item.quantity)}g · F{' '}
                {Math.round(item.fat * item.quantity)}g
              </Text>
              <View
                style={[
                  s.row,
                  {
                    gap: 4,
                    backgroundColor: c.screen,
                    borderRadius: radius.pill,
                    padding: 3,
                  },
                ]}
              >
                <IconButton
                  label={`Less ${item.name || 'food'}`}
                  icon={Minus}
                  size={34}
                  tone="surface"
                  onPress={() =>
                    change(index, {
                      quantity: Math.max(
                        0.25,
                        Math.round((item.quantity - 0.25) * 100) / 100,
                      ),
                    })
                  }
                />
                <Text
                  variant="smallStrong"
                  tabular
                  style={{ minWidth: 40, textAlign: 'center' }}
                  accessibilityLabel={`Quantity ${item.quantity}`}
                >
                  ×{item.quantity}
                </Text>
                <IconButton
                  label={`More ${item.name || 'food'}`}
                  icon={Plus}
                  size={34}
                  tone="ink"
                  onPress={() =>
                    change(index, {
                      quantity: Math.min(
                        100,
                        Math.round((item.quantity + 0.25) * 100) / 100,
                      ),
                    })
                  }
                />
              </View>
            </View>
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
                  label="Food"
                  value={item.name}
                  placeholder="What is it?"
                  onChangeText={(name) => change(index, { name })}
                />
                <View style={[s.row, { alignItems: 'flex-start' }]}>
                  <View style={{ flex: 2 }}>
                    <Input
                      label="One portion"
                      value={item.portion}
                      onChangeText={(portion) => change(index, { portion })}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <NumberInput
                      label="Quantity"
                      value={item.quantity}
                      onChangeValue={(quantity) =>
                        change(index, { quantity: quantity ?? 0 })
                      }
                    />
                  </View>
                </View>
                <Text variant="caption" color={c.secondary}>
                  Nutrition for one portion
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    gap: space.sm,
                    flexWrap: 'wrap',
                  }}
                >
                  {(['calories', 'protein', 'carbs', 'fat'] as const).map(
                    (key) => (
                      <View key={key} style={{ flexGrow: 1, flexBasis: '40%' }}>
                        <NumberInput
                          label={
                            key === 'calories'
                              ? 'Energy (kcal)'
                              : `${key[0].toUpperCase()}${key.slice(1)} (g)`
                          }
                          value={item[key]}
                          onChangeValue={(value) =>
                            change(index, { [key]: value ?? 0 })
                          }
                        />
                      </View>
                    ),
                  )}
                </View>
                <Button
                  title="Remove item"
                  icon={Trash2}
                  variant="danger"
                  size="medium"
                  onPress={() =>
                    onChange({
                      ...meal,
                      items: meal.items.filter((_, i) => i !== index),
                    })
                  }
                />
              </View>
            )}
          </View>
        );
      })}
      <Button
        title="Add an item"
        icon={Plus}
        variant="outline"
        size="medium"
        onPress={() => {
          onChange({ ...meal, items: [...meal.items, blankItem()] });
          setExpanded(meal.items.length);
        }}
        disabled={meal.items.length >= 30}
      />
      <Input
        label="Notes & assumptions"
        placeholder="Anything worth remembering about this meal"
        multiline
        value={meal.note}
        maxLength={600}
        onChangeText={(note) => onChange({ ...meal, note })}
      />
      <Text variant="caption" color={c.secondary}>
        Values are estimates, including ones you correct. Saving confirms this
        entry; it doesn’t verify nutrition accuracy.
      </Text>
    </View>
  );
}
