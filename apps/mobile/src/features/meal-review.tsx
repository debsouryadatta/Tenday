import { useState } from 'react';
import { View } from 'react-native';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import {
  blankItem,
  totals,
  type MealInput,
  type MealItem,
} from '@tenday/domain';
import {
  Button,
  Card,
  IconButton,
  Input,
  NumberInput,
  Row,
  Text,
  s,
} from '../components/ui';
import { c, space } from '../theme/tokens';
export function MealReview({
  meal,
  onChange,
}: {
  meal: MealInput;
  onChange: (meal: MealInput) => void;
}) {
  const total = totals(meal.items);
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
  return (
    <View style={s.stack}>
      <Input
        label="Meal name"
        value={meal.title}
        maxLength={100}
        onChangeText={(title) => onChange({ ...meal, title })}
      />
      <Button
        title={`${meal.day} · ${meal.time} · Edit time`}
        compact
        variant="quiet"
        onPress={() => setEditDate(!editDate)}
      />
      {editDate && (
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Input
              label="Date (YYYY-MM-DD)"
              value={meal.day}
              onChangeText={(day) => onChange({ ...meal, day })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label="Time (HH:MM)"
              value={meal.time}
              onChangeText={(time) => onChange({ ...meal, time })}
            />
          </View>
        </View>
      )}
      <Text variant="small" color={c.secondary}>
        Check the food and portions. Tap an item to edit its details or
        nutrition estimate.
      </Text>
      {meal.items.map((item, index) => (
        <Card key={index} tone="outline">
          <Row
            title={item.name || `Add food ${index + 1}`}
            subtitle={`${item.quantity} × ${item.portion}`}
            trailing={
              <Text variant="small">
                {Math.round(item.calories * item.quantity)} kcal
              </Text>
            }
            onPress={() => setExpanded(expanded === index ? -1 : index)}
          />
          <View style={s.between}>
            <Text variant="small" color={c.secondary}>
              Adjust quantity
            </Text>
            <View style={s.row}>
              <IconButton
                label={`Less ${item.name || 'food'}`}
                icon={Minus}
                onPress={() =>
                  change(index, {
                    quantity: Math.max(
                      0.25,
                      Math.round((item.quantity - 0.25) * 100) / 100,
                    ),
                  })
                }
              />
              <Text variant="strong">{item.quantity}</Text>
              <IconButton
                label={`More ${item.name || 'food'}`}
                icon={Plus}
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
          {(expanded === index || !item.name) && (
            <>
              <Input
                label={`Food ${index + 1}`}
                value={item.name}
                onChangeText={(name) => change(index, { name })}
              />
              <View style={s.row}>
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
              <Text variant="small" color={c.secondary}>
                Nutrition per one stated portion
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
                onPress={() =>
                  onChange({
                    ...meal,
                    items: meal.items.filter((_, i) => i !== index),
                  })
                }
              />
            </>
          )}
        </Card>
      ))}
      <Button
        title="Add an item"
        icon={Plus}
        variant="secondary"
        onPress={() => {
          onChange({ ...meal, items: [...meal.items, blankItem()] });
          setExpanded(meal.items.length);
        }}
        disabled={meal.items.length >= 30}
      />
      <Card tone="sage">
        <Text variant="strong">
          Meal total · {Math.round(total.calories)} kcal
        </Text>
        <Text variant="small">
          {Math.round(total.protein)} g protein · {Math.round(total.carbs)} g
          carbs · {Math.round(total.fat)} g fat
        </Text>
      </Card>
      <Input
        label="Notes & assumptions"
        multiline
        value={meal.note}
        maxLength={600}
        onChangeText={(note) => onChange({ ...meal, note })}
      />
      <Text variant="small" color={c.secondary}>
        Food values are estimates, including values you correct. Saving confirms
        this entry; it does not verify nutrition accuracy.
      </Text>
    </View>
  );
}
