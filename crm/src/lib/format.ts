export function formatCurrency(value: number | undefined | null): string {
  return (value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

export function formatMonthKey(monthKey: string | undefined | null): string {
  if (!monthKey) return '—';
  const [y, m] = monthKey.split('-');
  const labels = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  return `${labels[Number(m) - 1]}/${y}`;
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}
