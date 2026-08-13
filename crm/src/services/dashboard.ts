import type { Donation, Installment, Opportunity, Stage } from '../lib/types';

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export interface MonthlyPoint {
  month: string;
  previsto: number;
  realizado: number;
}

/** Para cada mês do ano: "previsto" = soma das parcelas com vencimento no mês;
 * "realizado" = soma das parcelas efetivamente pagas (baixadas) no mês. */
export function getMonthlyPrevistoRealizado(installments: Installment[], year: number): MonthlyPoint[] {
  const points: MonthlyPoint[] = MONTH_LABELS.map((month) => ({ month, previsto: 0, realizado: 0 }));
  for (const inst of installments) {
    const dueYear = Number(inst.dueDate.slice(0, 4));
    const dueMonth = Number(inst.dueDate.slice(5, 7)) - 1;
    if (dueYear === year) {
      points[dueMonth].previsto += inst.value;
    }
    if (inst.status === 'pago' && inst.paymentDate) {
      const payYear = Number(inst.paymentDate.slice(0, 4));
      const payMonth = Number(inst.paymentDate.slice(5, 7)) - 1;
      if (payYear === year) {
        points[payMonth].realizado += inst.value;
      }
    }
  }
  return points;
}

export interface NewDonorsPoint {
  month: string;
  count: number;
}

export function getNewDonorsByMonth(donations: Donation[], year: number): NewDonorsPoint[] {
  const points: NewDonorsPoint[] = MONTH_LABELS.map((month) => ({ month, count: 0 }));
  for (const donation of donations) {
    const y = Number(donation.startDate.slice(0, 4));
    const m = Number(donation.startDate.slice(5, 7)) - 1;
    if (y === year) points[m].count += 1;
  }
  return points;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
}

export function getCategoryBreakdown(donations: Donation[]): CategoryBreakdown[] {
  const map = new Map<string, number>();
  for (const donation of donations) {
    const key = donation.category?.trim() || 'Sem categoria';
    map.set(key, (map.get(key) ?? 0) + donation.totalValue);
  }
  return Array.from(map.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export interface StageFunnelCount {
  stageId: string;
  stageName: string;
  count: number;
  value: number;
}

export function getFunnelCounts(opportunities: Opportunity[], stages: Stage[]): StageFunnelCount[] {
  return stages
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((stage) => {
      const inStage = opportunities.filter((o) => o.stageId === stage.id && o.status === 'aberta');
      return {
        stageId: stage.id,
        stageName: stage.name,
        count: inStage.length,
        value: inStage.reduce((sum, o) => sum + (o.value ?? 0), 0),
      };
    });
}

export interface Summary {
  totalArrecadadoAno: number;
  totalPrevistoAno: number;
  doadoresAtivos: number;
  oportunidadesAbertas: number;
  taxaConversao: number; // ganhas / (ganhas + perdidas)
}

export function getSummary(
  donations: Donation[],
  installments: Installment[],
  opportunities: Opportunity[],
  year: number,
): Summary {
  let totalArrecadadoAno = 0;
  let totalPrevistoAno = 0;
  for (const inst of installments) {
    if (Number(inst.dueDate.slice(0, 4)) === year) totalPrevistoAno += inst.value;
    if (inst.status === 'pago' && inst.paymentDate && Number(inst.paymentDate.slice(0, 4)) === year) {
      totalArrecadadoAno += inst.value;
    }
  }
  const doadoresAtivos = new Set(donations.filter((d) => d.status === 'ativa').map((d) => d.companyId)).size;
  const oportunidadesAbertas = opportunities.filter((o) => o.status === 'aberta').length;
  const ganhas = opportunities.filter((o) => o.status === 'ganha').length;
  const perdidas = opportunities.filter((o) => o.status === 'perdida').length;
  const taxaConversao = ganhas + perdidas > 0 ? ganhas / (ganhas + perdidas) : 0;
  return { totalArrecadadoAno, totalPrevistoAno, doadoresAtivos, oportunidadesAbertas, taxaConversao };
}
