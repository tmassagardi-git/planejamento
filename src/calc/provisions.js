/**
 * Provisionamento de 12 meses da Política de Comissão — Projeto Empresa Amiga.
 *
 * Duas regras diferentes, conforme o tipo de captação (ver docs/comissao-empresa-amiga.md):
 *
 *  - "empresa_amiga": doação mensal recorrente. Ao lançar UM novo doador/valor,
 *    o mesmo valor mensal se repete pelos próximos 12 meses (mês atual = 1ª
 *    parcela + 11 meses seguintes), pois o ciclo de doação é mensal.
 *
 *  - "patrocinio" | "edital" | "projeto_incentivado": captação pontual (valor
 *    total fechado de uma vez). Esse valor total é DIVIDIDO por 12 e entra
 *    como crédito futuro ao longo dos 12 meses seguintes (mês atual +
 *    próximos 11), 1/12 avos por mês.
 */

import { addMonths, validarMesReferencia } from './mesUtil.js';

export const TIPO_RECORRENTE = 'empresa_amiga';
export const TIPOS_DIVIDIDOS_POR_12 = Object.freeze(['patrocinio', 'edital', 'projeto_incentivado']);
export const TIPOS_VALIDOS = Object.freeze([TIPO_RECORRENTE, ...TIPOS_DIVIDIDOS_POR_12]);

export const QTD_PARCELAS = 12;

/**
 * Divide `valorTotal` em 12 parcelas mensais sem perda de centavos: a soma das
 * parcelas geradas é sempre exatamente igual a `valorTotal` (o resto da divisão
 * é distribuído nas primeiras parcelas, 1 centavo a mais em cada).
 */
export function distribuirEmParcelas(valorTotal, quantidade = QTD_PARCELAS) {
  const totalCentavos = Math.round(valorTotal * 100);
  const baseCentavos = Math.floor(totalCentavos / quantidade);
  const resto = totalCentavos - baseCentavos * quantidade;
  return Array.from({ length: quantidade }, (_, idx) => {
    const centavos = baseCentavos + (idx < resto ? 1 : 0);
    return centavos / 100;
  });
}

/**
 * Gera as 12 provisões mensais de um lançamento (empresa amiga, patrocínio,
 * edital ou projeto incentivado).
 *
 * @param {object} params
 * @param {string} params.tipo - um de TIPOS_VALIDOS
 * @param {number} params.valorTotal - valor total captado (deve ser > 0)
 * @param {string} params.mesReferencia - mês da 1ª parcela, 'YYYY-MM'
 * @returns {{numeroParcela: number, mesReferencia: string, valor: number}[]}
 */
export function gerarProvisoes({ tipo, valorTotal, mesReferencia }) {
  if (!TIPOS_VALIDOS.includes(tipo)) {
    throw new Error(`Tipo de lançamento desconhecido: "${tipo}" (esperado um de: ${TIPOS_VALIDOS.join(', ')})`);
  }
  if (!(valorTotal > 0)) {
    throw new Error(`valorTotal deve ser um número positivo (recebido: ${valorTotal})`);
  }
  validarMesReferencia(mesReferencia);

  const valoresParcelas =
    tipo === TIPO_RECORRENTE
      ? Array.from({ length: QTD_PARCELAS }, () => valorTotal)
      : distribuirEmParcelas(valorTotal, QTD_PARCELAS);

  return valoresParcelas.map((valor, idx) => ({
    numeroParcela: idx + 1,
    mesReferencia: addMonths(mesReferencia, idx),
    valor,
  }));
}
