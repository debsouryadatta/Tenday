/** Shared, locale-aware date helpers used by both clients. */
export function dayDate(day: string) {
  return new Date(day + 'T12:00:00');
}
export function formatDay(
  day: string,
  style: 'long' | 'short' | 'weekday' = 'long',
) {
  const d = dayDate(day);
  if (style === 'weekday')
    return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  if (style === 'short')
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}
export function greeting(date = new Date()) {
  const h = date.getHours();
  return h < 5 ? 'Hello' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}
/** The seven days ending on `day`, oldest first. */
export function weekEnding(day: string) {
  const end = dayDate(day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(end);
    d.setDate(end.getDate() - (6 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return {
      key,
      letter: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
      date: d.getDate(),
    };
  });
}
export function groupByDay<T extends { day: string }>(items: T[]) {
  const groups: { day: string; items: T[] }[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last?.day === item.day) last.items.push(item);
    else groups.push({ day: item.day, items: [item] });
  }
  return groups;
}
