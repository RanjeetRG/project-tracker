export const TODAY = new Date().toISOString().split('T')[0];

function daysDiff(dateStr: string): number {
  const a = new Date(dateStr + 'T00:00:00');
  const b = new Date(TODAY  + 'T00:00:00');
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

export function formatDueLabel(dueDate: string) {
  const diff = daysDiff(dueDate);

  if (diff === 0)  return { label: 'Due Today',                     overdue: false, warn: true };
  if (diff < -7)   return { label: `${Math.abs(diff)}d overdue`,    overdue: true,  warn: false };
  if (diff < 0)    return { label: shortDate(dueDate),              overdue: true,  warn: false };
  return           { label: shortDate(dueDate),                     overdue: false, warn: false };
}

function shortDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short',
  });
}

