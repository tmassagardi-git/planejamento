/**
 * Faixas de incentivo por percentual de atingimento da meta (tabela da política):
 *
 *   Até 49%          -> não há pagamento de incentivo
 *   50% a 79%        -> 3% sobre o valor
 *   80% a 99%        -> 4% sobre o valor
 *   100% ou superior -> 7% sobre o valor
 *
 * Representadas como frações (0.5 = 50%), não porcentagens inteiras.
 */
export const FAIXAS_PADRAO = Object.freeze([
  { id: 'ate_49', percentualMin: 0, percentualMax: 0.499999, percentualComissao: 0 },
  { id: '50_a_79', percentualMin: 0.5, percentualMax: 0.799999, percentualComissao: 0.03 },
  { id: '80_a_99', percentualMin: 0.8, percentualMax: 0.999999, percentualComissao: 0.04 },
  { id: '100_ou_mais', percentualMin: 1.0, percentualMax: null, percentualComissao: 0.07 },
]);

/**
 * Encontra a faixa aplicável a um percentual de atingimento. `percentualMax:
 * null` significa "sem limite superior". Lança erro se nenhuma faixa cobrir o
 * valor (ex.: faixas mal configuradas com buracos) em vez de silenciosamente
 * cobrar 0%.
 */
export function localizarFaixa(percentualAtingimento, faixas = FAIXAS_PADRAO) {
  if (!Number.isFinite(percentualAtingimento) || percentualAtingimento < 0) {
    throw new Error(`percentualAtingimento inválido: ${percentualAtingimento}`);
  }
  const ordenadas = [...faixas].sort((a, b) => a.percentualMin - b.percentualMin);
  for (const faixa of ordenadas) {
    const acimaDoMinimo = percentualAtingimento >= faixa.percentualMin;
    const dentroDoMaximo = faixa.percentualMax === null || faixa.percentualMax === undefined || percentualAtingimento <= faixa.percentualMax;
    if (acimaDoMinimo && dentroDoMaximo) return faixa;
  }
  return null;
}
