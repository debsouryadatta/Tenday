import {
  DEMO_PROFILES,
  type DemoSlug,
  type MealInput,
  type MealItem,
  type ReportInput,
} from '../../../domain/src/index';

const food = (
  name: string,
  portion: string,
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
): MealItem => ({ name, portion, quantity: 1, calories, protein, carbs, fat });
const foods = {
  oats: food('Overnight oats with yogurt', '1 bowl', 340, 17, 49, 9),
  banana: food('Banana', '1 medium', 105, 1.3, 27, 0.4),
  poha: food('Pea and peanut poha', '1 bowl', 330, 10, 48, 11),
  eggs: food('Scrambled eggs', '2 eggs', 180, 13, 2, 13),
  toast: food('Wholegrain toast', '2 slices', 170, 8, 30, 3),
  dal: food('Moong dal', '1 cup', 210, 14, 30, 4),
  rice: food('Cooked brown rice', '1 cup', 215, 5, 45, 2),
  vegetables: food('Mixed cooked vegetables', '1 cup', 110, 4, 15, 5),
  roti: food('Whole-wheat roti', '2 medium', 220, 7, 43, 3),
  paneer: food('Paneer and pepper stir-fry', '1 serving', 310, 21, 12, 20),
  chickpeas: food('Chickpea cucumber salad', '1 bowl', 350, 16, 46, 12),
  yogurt: food('Plain Greek yogurt', '170 g', 120, 17, 7, 2),
  fish: food('Baked fish with lemon', '150 g', 240, 32, 1, 12),
  chicken: food('Roast chicken breast', '150 g', 250, 46, 0, 7),
  lentil: food('Lentil vegetable soup', '1 large bowl', 290, 17, 42, 7),
  hummus: food('Hummus vegetable wrap', '1 wrap', 420, 15, 54, 17),
  pasta: food('Tomato and white bean pasta', '1 bowl', 490, 23, 77, 12),
  nuts: food('Mixed nuts', '25 g', 150, 5, 5, 13),
  fruit: food('Seasonal fruit', '1 cup', 85, 1, 21, 0.3),
};
const menus = {
  maya: [
    ['oats', 'fruit'],
    ['dal', 'rice', 'vegetables'],
    ['paneer', 'roti'],
    ['poha', 'yogurt'],
    ['chickpeas', 'roti'],
    ['lentil', 'toast'],
    ['oats', 'banana'],
    ['hummus', 'yogurt'],
    ['dal', 'roti', 'vegetables'],
  ],
  arjun: [
    ['eggs', 'toast', 'fruit'],
    ['chicken', 'rice', 'vegetables'],
    ['dal', 'roti', 'yogurt'],
    ['oats', 'yogurt'],
    ['fish', 'rice', 'vegetables'],
    ['paneer', 'roti'],
    ['eggs', 'toast'],
    ['chickpeas', 'yogurt'],
    ['lentil', 'chicken'],
  ],
  leah: [
    ['oats', 'banana'],
    ['hummus', 'fruit'],
    ['fish', 'rice', 'vegetables'],
    ['eggs', 'toast'],
    ['chickpeas', 'yogurt'],
    ['pasta', 'vegetables'],
    ['yogurt', 'nuts', 'fruit'],
    ['lentil', 'toast'],
    ['chicken', 'rice', 'vegetables'],
  ],
} satisfies Record<DemoSlug, (keyof typeof foods)[][]>;
const menuNames: Record<DemoSlug, string[]> = {
  maya: [
    'Overnight oats & seasonal fruit',
    'Moong dal lunch bowl',
    'Paneer & pepper with roti',
    'Pea poha & Greek yogurt',
    'Chickpea cucumber salad & roti',
    'Lentil soup & wholegrain toast',
    'Banana overnight oats',
    'Hummus wrap & yogurt',
    'Dal, roti & mixed vegetables',
  ],
  arjun: [
    'Eggs, toast & seasonal fruit',
    'Chicken & brown rice bowl',
    'Dal, roti & Greek yogurt',
    'Overnight oats & yogurt',
    'Lemon fish & brown rice',
    'Paneer & pepper with roti',
    'Simple eggs on toast',
    'Chickpeas & Greek yogurt',
    'Lentil soup with roast chicken',
  ],
  leah: [
    'Banana overnight oats',
    'Hummus wrap & seasonal fruit',
    'Lemon fish & brown rice',
    'Eggs on wholegrain toast',
    'Chickpea salad & yogurt',
    'Tomato & white bean pasta',
    'Yogurt, nuts & seasonal fruit',
    'Lentil soup & wholegrain toast',
    'Roast chicken & brown rice',
  ],
};
export function demoDay(now = Date.now()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}
export function dayBefore(day: string, offset: number) {
  return new Date(Date.parse(`${day}T12:00:00Z`) - offset * 86400000)
    .toISOString()
    .slice(0, 10);
}
export function demoMeals(
  slug: DemoSlug,
  day: string,
  offset: number,
): MealInput[] {
  const count = offset === 0 ? 2 : 3;
  return Array.from({ length: count }, (_, i) => ({
    title: menuNames[slug][(offset * 3 + i) % menus[slug].length],
    day,
    time: ['08:15', '13:10', '19:30'][i],
    items: menus[slug][(offset * 3 + i) % menus[slug].length].map((key) => ({
      ...foods[key],
    })),
    source: 'manual',
    note: 'Fictional demo meal. Portions and nutrition are illustrative estimates; this is not a personal diet recommendation.',
  }));
}
export function demoReports(slug: DemoSlug, day: string): ReportInput[] {
  const persona = DEMO_PROFILES.find((p) => p.slug === slug)!;
  return [84, 42, 3].map((offset, i) => ({
    title: `${['Earlier', 'Follow-up', 'Recent'][i]} demo lab report`,
    day: dayBefore(day, offset),
    note: `FICTIONAL DEMO ONLY. Invented results and reference intervals for ${persona.name}. Not a clinical document or medical reference.`,
    readings: [
      {
        marker: 'Glucose',
        value: String([94, 91, 92][i] + (slug === 'arjun' ? 2 : 0)),
        unit: 'mg/dL',
        reference: '70 - 100',
        low: 70,
        high: 100,
        page: 1,
      },
      {
        marker: 'Hemoglobin',
        value: [13.2, 13.5, 13.7]
          .map((v) => v + (slug === 'arjun' ? 1 : 0))
          [i].toFixed(1),
        unit: 'g/dL',
        reference: '12.0 - 16.0',
        low: 12,
        high: 16,
        page: 1,
      },
      {
        marker: 'HbA1c',
        value: ['5.4', '5.3', '5.3'][i],
        unit: '%',
        reference: '4.0 - 5.6',
        low: 4,
        high: 5.6,
        page: 1,
      },
      {
        marker: 'LDL cholesterol',
        value: String([118, 110, 106][i]),
        unit: 'mg/dL',
        reference: '0 - 100',
        low: 0,
        high: 100,
        page: 1,
      },
      {
        marker: 'HDL cholesterol',
        value: String([49, 51, 52][i]),
        unit: 'mg/dL',
        reference: '40 - 90',
        low: 40,
        high: 90,
        page: 1,
      },
      {
        marker: 'Triglycerides',
        value: String([135, 128, 122][i]),
        unit: 'mg/dL',
        reference: '0 - 150',
        low: 0,
        high: 150,
        page: 1,
      },
      {
        marker: 'C-reactive protein',
        value: '<5',
        unit: 'mg/L',
        reference: '',
        low: null,
        high: null,
        page: 1,
      },
      {
        marker: 'Urine protein',
        value: 'Negative',
        unit: '',
        reference: 'Negative',
        low: null,
        high: null,
        page: 1,
      },
    ],
  }));
}
