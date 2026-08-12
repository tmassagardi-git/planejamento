/**
 * Premiação Anual por Crescimento Institucional.
 *
 *   "A instituição poderá conceder premiação anual correspondente a 1% da
 *    receita anual captada pela equipe responsável [...] Para fins de
 *    apuração da premiação, serão considerados exclusivamente os valores
 *    efetivamente recebidos [...] A distribuição observará a composição da
 *    equipe, o período efetivamente trabalhado por cada colaborador durante
 *    o exercício e sua participação nas atividades de captação."
 *
 * A apuração usa valores efetivamente RECEBIDOS no ano (não provisões/
 * créditos futuros), informados manualmente após o fechamento financeiro —
 * este módulo não tenta inferir isso das provisões futuras.
 *
 * A distribuição por pessoa é uma SUGESTÃO calculada proporcionalmente à
 * contribuição de captação de cada um, ponderada pelo período trabalhado no
 * ano. A política exige aprovação da Diretoria antes do pagamento — o painel
 * deve tratar o resultado deste cálculo como rascunho editável, não como
 * valor final.
 */

export const PERCENTUAL_PREMIACAO_PADRAO = 0.01; // 1%

function arredondar(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

/**
 * @param {number} receitaAnualRecebida - total efetivamente recebido pela organização no ano (equipe toda)
 * @param {number} [percentual] - fração (0.01 = 1%)
 */
export function calcularValorTotalPremiacao(receitaAnualRecebida, percentual = PERCENTUAL_PREMIACAO_PADRAO) {
  if (!(receitaAnualRecebida >= 0)) {
    throw new Error(`receitaAnualRecebida inválida: ${receitaAnualRecebida}`);
  }
  return arredondar(receitaAnualRecebida * percentual);
}

/**
 * Sugestão de rateio do valor total da premiação entre os membros da equipe,
 * ponderando a contribuição de captação de cada um pela fração do ano
 * efetivamente trabalhada.
 *
 * @param {object} params
 * @param {number} params.valorTotal - valor total da premiação (ver calcularValorTotalPremiacao)
 * @param {Array<{captadorId: number|string, receitaRecebida: number, mesesTrabalhados: number}>} params.participantes
 * @returns {Array<{captadorId: number|string, peso: number, valor: number}>}
 */
export function sugerirRateioPorEquipe({ valorTotal, participantes }) {
  if (!(valorTotal >= 0)) throw new Error(`valorTotal inválido: ${valorTotal}`);
  if (!participantes?.length) return [];

  const pesos = participantes.map((p) => {
    const mesesValidos = Math.min(12, Math.max(0, p.mesesTrabalhados ?? 12));
    return Math.max(0, p.receitaRecebida ?? 0) * (mesesValidos / 12);
  });
  const somaPesos = pesos.reduce((acc, p) => acc + p, 0);

  return participantes.map((p, idx) => {
    const peso = somaPesos > 0 ? pesos[idx] / somaPesos : 0;
    return { captadorId: p.captadorId, peso, valor: arredondar(valorTotal * peso) };
  });
}
