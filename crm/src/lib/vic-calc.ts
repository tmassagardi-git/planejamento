import type { VicAxis, VicCriterion, VicEvaluation } from './types';

export type { VicAxis };

export const VIC_AXES: { key: VicAxis; nome: string; cor: string }[] = [
  { key: 'V', nome: 'Vínculo', cor: '#1F5F5B' },
  { key: 'I', nome: 'Interesse', cor: '#B07D2B' },
  { key: 'C', nome: 'Capacidade', cor: '#7A4B8F' },
];

export const VIC_TOTAL_COLOR = '#B4462F';
export const VIC_DEFAULT_PROJECT = 'Institucional';

export interface AxisResult {
  soma: number;
  peso: number;
  nota: number; // 0..5
}

export function axisWeight(criteria: VicCriterion[], eixo: VicAxis): number {
  return criteria.filter((c) => c.eixo === eixo).reduce((sum, c) => sum + (c.peso || 0), 0);
}

export function axisResult(
  criteria: VicCriterion[],
  eixo: VicAxis,
  notas: Record<string, number>,
): AxisResult {
  const axisCriteria = criteria.filter((c) => c.eixo === eixo);
  const peso = axisCriteria.reduce((sum, c) => sum + (c.peso || 0), 0);
  const soma = axisCriteria.reduce((sum, c) => sum + (c.peso || 0) * (notas[c.id] || 0), 0);
  return { soma, peso, nota: peso > 0 ? soma / peso : 0 };
}

export interface VicMetrics {
  v: number;
  i: number;
  c: number;
  total: number; // 0..15
}

export function vicMetrics(criteria: VicCriterion[], evaluation: Pick<VicEvaluation, 'notas'>): VicMetrics {
  const v = axisResult(criteria, 'V', evaluation.notas).nota;
  const i = axisResult(criteria, 'I', evaluation.notas).nota;
  const c = axisResult(criteria, 'C', evaluation.notas).nota;
  return { v, i, c, total: v + i + c };
}

export function bubbleColor(total: number): string {
  if (total >= 9) return '#1F5F5B';
  if (total >= 5) return '#B07D2B';
  return '#A9A49A';
}

export function fmtNota(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');
}

export function fmtPeso(n: number): string {
  return (Math.round(n * 100) / 100).toString().replace('.', ',');
}
