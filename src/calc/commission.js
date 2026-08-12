/**
 * Cálculo da comissão mensal de um(a) captador(a), conforme a política:
 *
 *   "A comissão será calculada com a soma da captação da empresa amiga
 *    (Acumulado), do patrocínio da corrida + Editais + projetos incentivados.
 *    [...] o valor a ser calculado das linhas de patrocínio, editais e
 *    projetos incentivados será dividido por 12 [...]. Nos meses que a
 *    empresa amiga não bater a meta segue o % conforme a tabela acima."
 *
 * Ou seja:
 *   1. O percentual de atingimento da meta é medido pelos NOVOS fechamentos
 *      de Empresa Amiga no mês (não pelo total acumulado, nem pelas parcelas
 *      de patrocínio/edital/projeto) — é essa referência que define a faixa.
 *   2. A faixa encontrada define a alíquota (0%, 3%, 4% ou 7%).
 *   3. Essa alíquota incide sobre a BASE do mês = acumulado de Empresa Amiga
 *      (soma de todos os valores recorrentes ativos) + parcela do mês de
 *      patrocínio + parcela do mês de editais + parcela do mês de projetos
 *      incentivados.
 *
 * NOTA IMPORTANTE (ver docs/comissao-empresa-amiga.md): o exemplo numérico do
 * documento original ("4% sobre R$22.500,00") não fecha exatamente com a soma
 * literal das 3 parcelas do exemplo (R$10.000 + R$5.000 + R$12.500 =
 * R$27.500). Este módulo implementa a REGRA conforme escrita no texto; a
 * conciliação do exemplo fica pendente de confirmação com a Diretoria.
 */

import { localizarFaixa, FAIXAS_PADRAO } from './tiers.js';

function arredondar(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

/**
 * @param {number} novosEmpresaAmiga - valor de novos fechamentos de Empresa Amiga no mês
 * @param {number} meta - meta mensal de captação (Empresa Amiga) do(a) captador(a)
 * @returns {number} fração (1 = 100%)
 */
export function calcularPercentualAtingimento(novosEmpresaAmiga, meta) {
  if (!(meta > 0)) return 0;
  return Math.max(0, novosEmpresaAmiga) / meta;
}

/**
 * Calcula a comissão de um(a) captador(a) em um mês específico.
 *
 * @param {object} params
 * @param {number} params.novosEmpresaAmiga - novos fechamentos de Empresa Amiga no mês (referência da meta)
 * @param {number} params.meta - meta mensal de captação
 * @param {number} params.baseEmpresaAmigaAcumulado - soma de todas as parcelas recorrentes de Empresa Amiga ativas no mês
 * @param {number} [params.baseParcelaPatrocinio] - soma das parcelas (1/12) de patrocínio caindo no mês
 * @param {number} [params.baseParcelaEdital] - soma das parcelas (1/12) de editais caindo no mês
 * @param {number} [params.baseParcelaProjetoIncentivado] - soma das parcelas (1/12) de projetos incentivados caindo no mês
 * @param {Array} [params.faixas] - tabela de faixas de incentivo (default: FAIXAS_PADRAO)
 */
export function calcularComissaoMensal({
  novosEmpresaAmiga,
  meta,
  baseEmpresaAmigaAcumulado,
  baseParcelaPatrocinio = 0,
  baseParcelaEdital = 0,
  baseParcelaProjetoIncentivado = 0,
  faixas = FAIXAS_PADRAO,
}) {
  const percentualAtingimento = calcularPercentualAtingimento(novosEmpresaAmiga, meta);
  const faixa = localizarFaixa(percentualAtingimento, faixas);
  const percentualComissao = faixa ? faixa.percentualComissao : 0;

  const baseTotal = arredondar(
    baseEmpresaAmigaAcumulado + baseParcelaPatrocinio + baseParcelaEdital + baseParcelaProjetoIncentivado
  );
  const valorComissao = arredondar(baseTotal * percentualComissao);

  return {
    percentualAtingimento,
    faixaAplicada: faixa,
    percentualComissao,
    baseTotal,
    valorComissao,
    detalhamento: {
      novosEmpresaAmiga,
      meta,
      baseEmpresaAmigaAcumulado,
      baseParcelaPatrocinio,
      baseParcelaEdital,
      baseParcelaProjetoIncentivado,
    },
  };
}
