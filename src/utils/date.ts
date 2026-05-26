export function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatLong(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShort(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatWeekLabel(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toDateStr(d);
}
