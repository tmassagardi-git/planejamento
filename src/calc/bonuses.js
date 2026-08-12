/**
 * Incentivos pela Qualidade das Parcerias (fora da meta mensal de captação).
 *
 *   - Bônus de Adimplência: R$30,00 quando o parceiro completa 12 pagamentos
 *     realizados. É um bônus único por doador/parceiro (não se repete).
 *   - Bônus de Renovação: pago a cada renovação anual de parceria, com valor
 *     conforme a cota do parceiro. Não conta para a meta mensal.
 */

export const VALOR_BONUS_ADIMPLENCIA_PADRAO = 30;

export const COTAS_RENOVACAO = Object.freeze(['bronze', 'prata', 'ouro', 'premium']);

export const TABELA_BONUS_RENOVACAO_PADRAO = Object.freeze({
  bronze: 30,
  prata: 30,
  ouro: 60,
  premium: 100,
});

export const QTD_PAGAMENTOS_PARA_ADIMPLENCIA = 12;

/**
 * Avalia se um doador que acabou de confirmar mais um pagamento passa a fazer
 * jus ao bônus de adimplência. Só concede uma vez por doador (`jaPago`).
 *
 * @param {object} params
 * @param {number} params.pagamentosConfirmados - total de pagamentos confirmados após esta confirmação
 * @param {boolean} params.jaPago - se o bônus de adimplência já foi concedido antes para este doador
 * @param {number} [params.valorBonus]
 */
export function avaliarBonusAdimplencia({ pagamentosConfirmados, jaPago, valorBonus = VALOR_BONUS_ADIMPLENCIA_PADRAO }) {
  const concedido = !jaPago && pagamentosConfirmados >= QTD_PAGAMENTOS_PARA_ADIMPLENCIA;
  return { concedido, valor: concedido ? valorBonus : 0 };
}

/**
 * Retorna o valor do bônus de renovação para uma cota. Lança erro em cota
 * desconhecida em vez de silenciosamente pagar 0.
 */
export function calcularBonusRenovacao(cota, tabela = TABELA_BONUS_RENOVACAO_PADRAO) {
  const chave = typeof cota === 'string' ? cota.toLowerCase() : cota;
  const valor = tabela[chave];
  if (valor === undefined) {
    throw new Error(`Cota de renovação desconhecida: "${cota}" (esperado um de: ${COTAS_RENOVACAO.join(', ')})`);
  }
  return valor;
}
