import { test } from 'node:test';
import assert from 'node:assert/strict';

import { addMonths, compareMeses, validarMesReferencia } from '../src/calc/mesUtil.js';
import { gerarProvisoes, distribuirEmParcelas } from '../src/calc/provisions.js';
import { localizarFaixa, FAIXAS_PADRAO } from '../src/calc/tiers.js';
import { calcularComissaoMensal, calcularPercentualAtingimento } from '../src/calc/commission.js';
import { avaliarBonusAdimplencia, calcularBonusRenovacao, TABELA_BONUS_RENOVACAO_PADRAO } from '../src/calc/bonuses.js';
import { calcularValorTotalPremiacao, sugerirRateioPorEquipe } from '../src/calc/annualAward.js';

// --- mesUtil ---------------------------------------------------------------

test('addMonths soma meses simples dentro do mesmo ano', () => {
  assert.equal(addMonths('2026-01', 1), '2026-02');
  assert.equal(addMonths('2026-01', 11), '2026-12');
});

test('addMonths vira o ano corretamente', () => {
  assert.equal(addMonths('2026-08', 12), '2027-08');
  assert.equal(addMonths('2026-12', 1), '2027-01');
  assert.equal(addMonths('2026-01', -1), '2025-12');
});

test('validarMesReferencia rejeita formatos inválidos', () => {
  assert.throws(() => validarMesReferencia('2026-13'));
  assert.throws(() => validarMesReferencia('26-01'));
  assert.throws(() => validarMesReferencia('2026/01'));
});

test('compareMeses ordena cronologicamente', () => {
  const meses = ['2026-03', '2025-12', '2026-01'];
  assert.deepEqual([...meses].sort(compareMeses), ['2025-12', '2026-01', '2026-03']);
});

// --- provisions --------------------------------------------------------------

test('distribuirEmParcelas divide sem perda de centavos (caso exato)', () => {
  const parcelas = distribuirEmParcelas(60000);
  assert.equal(parcelas.length, 12);
  assert.ok(parcelas.every((v) => v === 5000));
  assert.equal(parcelas.reduce((a, b) => a + b, 0), 60000);
});

test('distribuirEmParcelas divide sem perda de centavos (caso com resto)', () => {
  const parcelas = distribuirEmParcelas(100);
  const somaCentavos = Math.round(parcelas.reduce((a, b) => a + b, 0) * 100);
  assert.equal(somaCentavos, 10000);
  // 100 / 12 = 8.333...; algumas parcelas devem ter 1 centavo a mais que outras
  const distintos = new Set(parcelas.map((v) => Math.round(v * 100)));
  assert.equal(distintos.size, 2);
});

test('gerarProvisoes para projeto incentivado: divide por 12, mês atual + 11 seguintes', () => {
  const provisoes = gerarProvisoes({ tipo: 'projeto_incentivado', valorTotal: 150000, mesReferencia: '2026-08' });
  assert.equal(provisoes.length, 12);
  assert.equal(provisoes[0].mesReferencia, '2026-08');
  assert.equal(provisoes[11].mesReferencia, '2027-07');
  assert.ok(provisoes.every((p) => p.valor === 12500));
});

test('gerarProvisoes para patrocínio: exemplo da política (R$60.000 -> R$5.000/mês)', () => {
  const provisoes = gerarProvisoes({ tipo: 'patrocinio', valorTotal: 60000, mesReferencia: '2026-01' });
  assert.ok(provisoes.every((p) => p.valor === 5000));
});

test('gerarProvisoes para empresa amiga: valor mensal se repete por 12 meses (não divide)', () => {
  const provisoes = gerarProvisoes({ tipo: 'empresa_amiga', valorTotal: 50, mesReferencia: '2026-08' });
  assert.equal(provisoes.length, 12);
  assert.ok(provisoes.every((p) => p.valor === 50));
  assert.equal(provisoes[0].mesReferencia, '2026-08');
  assert.equal(provisoes[10].mesReferencia, '2027-06');
  assert.equal(provisoes[11].mesReferencia, '2027-07');
});

test('gerarProvisoes rejeita tipo desconhecido e valor não positivo', () => {
  assert.throws(() => gerarProvisoes({ tipo: 'doacao_avulsa', valorTotal: 10, mesReferencia: '2026-01' }));
  assert.throws(() => gerarProvisoes({ tipo: 'edital', valorTotal: 0, mesReferencia: '2026-01' }));
  assert.throws(() => gerarProvisoes({ tipo: 'edital', valorTotal: -10, mesReferencia: '2026-01' }));
});

// --- tiers ---------------------------------------------------------------

test('localizarFaixa cobre as 4 faixas da tabela da política', () => {
  assert.equal(localizarFaixa(0).percentualComissao, 0);
  assert.equal(localizarFaixa(0.49).percentualComissao, 0);
  assert.equal(localizarFaixa(0.5).percentualComissao, 0.03);
  assert.equal(localizarFaixa(0.79).percentualComissao, 0.03);
  assert.equal(localizarFaixa(0.8).percentualComissao, 0.04);
  assert.equal(localizarFaixa(0.99).percentualComissao, 0.04);
  assert.equal(localizarFaixa(1).percentualComissao, 0.07);
  assert.equal(localizarFaixa(3).percentualComissao, 0.07); // sem limite superior
});

test('localizarFaixa lança erro com percentual inválido', () => {
  assert.throws(() => localizarFaixa(-1, FAIXAS_PADRAO));
  assert.throws(() => localizarFaixa(NaN, FAIXAS_PADRAO));
});

// --- commission --------------------------------------------------------------

test('calcularPercentualAtingimento: meta zero/ausente não quebra (retorna 0)', () => {
  assert.equal(calcularPercentualAtingimento(1000, 0), 0);
  assert.equal(calcularPercentualAtingimento(1000, null), 0);
});

test('calcularComissaoMensal reproduz o cenário do exemplo da política (com a base somada literalmente)', () => {
  // Exemplo do documento: meta 3.000; fechou 2.400 em novos doadores (80% -> faixa 4%);
  // corrida 60.000/12=5.000; projeto incentivado 150.000/12=12.500; acumulado empresa amiga 10.000.
  const resultado = calcularComissaoMensal({
    novosEmpresaAmiga: 2400,
    meta: 3000,
    baseEmpresaAmigaAcumulado: 10000,
    baseParcelaPatrocinio: 5000,
    baseParcelaProjetoIncentivado: 12500,
  });

  assert.equal(resultado.percentualAtingimento, 0.8);
  assert.equal(resultado.percentualComissao, 0.04);
  // Soma literal das 3 estratégias = 27.500 (o documento original cita 22.500 no
  // exemplo — ver docs/comissao-empresa-amiga.md para a divergência sinalizada).
  assert.equal(resultado.baseTotal, 27500);
  assert.equal(resultado.valorComissao, 1100);
});

test('calcularComissaoMensal: abaixo de 49% não paga incentivo mesmo com base grande', () => {
  const resultado = calcularComissaoMensal({
    novosEmpresaAmiga: 1000,
    meta: 3000,
    baseEmpresaAmigaAcumulado: 50000,
  });
  assert.equal(resultado.percentualComissao, 0);
  assert.equal(resultado.valorComissao, 0);
});

// --- bonuses ---------------------------------------------------------------

test('avaliarBonusAdimplencia concede bônus só ao completar 12 pagamentos e só uma vez', () => {
  assert.equal(avaliarBonusAdimplencia({ pagamentosConfirmados: 11, jaPago: false }).concedido, false);
  const primeiraVez = avaliarBonusAdimplencia({ pagamentosConfirmados: 12, jaPago: false });
  assert.equal(primeiraVez.concedido, true);
  assert.equal(primeiraVez.valor, 30);
  assert.equal(avaliarBonusAdimplencia({ pagamentosConfirmados: 13, jaPago: true }).concedido, false);
});

test('calcularBonusRenovacao segue a tabela por cota da política', () => {
  assert.equal(calcularBonusRenovacao('bronze'), 30);
  assert.equal(calcularBonusRenovacao('Prata'), 30);
  assert.equal(calcularBonusRenovacao('ouro'), 60);
  assert.equal(calcularBonusRenovacao('PREMIUM'), 100);
  assert.throws(() => calcularBonusRenovacao('diamante'));
});

test('TABELA_BONUS_RENOVACAO_PADRAO bate com a política', () => {
  assert.deepEqual(TABELA_BONUS_RENOVACAO_PADRAO, { bronze: 30, prata: 30, ouro: 60, premium: 100 });
});

// --- annualAward -------------------------------------------------------------

test('calcularValorTotalPremiacao aplica o percentual (1% por padrão)', () => {
  assert.equal(calcularValorTotalPremiacao(100000), 1000);
  assert.equal(calcularValorTotalPremiacao(216000), 2160);
  assert.equal(calcularValorTotalPremiacao(432000), 4320);
});

test('sugerirRateioPorEquipe distribui proporcionalmente à contribuição e ao período trabalhado', () => {
  const rateio = sugerirRateioPorEquipe({
    valorTotal: 1000,
    participantes: [
      { captadorId: 'a', receitaRecebida: 80000, mesesTrabalhados: 12 },
      { captadorId: 'b', receitaRecebida: 40000, mesesTrabalhados: 6 }, // metade do ano
    ],
  });
  // pesos brutos: a=80000*1=80000; b=40000*0.5=20000 -> total 100000 -> a=80%, b=20%
  assert.equal(rateio.find((r) => r.captadorId === 'a').valor, 800);
  assert.equal(rateio.find((r) => r.captadorId === 'b').valor, 200);
});

test('sugerirRateioPorEquipe não quebra com equipe sem contribuição', () => {
  const rateio = sugerirRateioPorEquipe({
    valorTotal: 1000,
    participantes: [{ captadorId: 'a', receitaRecebida: 0, mesesTrabalhados: 12 }],
  });
  assert.equal(rateio[0].valor, 0);
});
