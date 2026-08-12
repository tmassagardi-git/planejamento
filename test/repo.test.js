import { test } from 'node:test';
import assert from 'node:assert/strict';

import { abrirDb } from '../src/db.js';
import { criarCaptador, listarCaptadores } from '../src/repo/captadores.js';
import { definirMeta, obterMeta, obterMetaPadrao } from '../src/repo/metas.js';
import { criarLancamento, listarLancamentos, obterBaseMensalPorTipo, cancelarProvisoesFuturas } from '../src/repo/lancamentos.js';
import { calcularComissaoCaptadorMes, calcularComissaoTodosCaptadoresMes } from '../src/repo/comissao.js';
import { criarDoador, confirmarPagamento, registrarRenovacao } from '../src/repo/doadores.js';
import { calcularESalvarPremiacao, aprovarPremiacao } from '../src/repo/premiacao.js';
import { listarFaixas, substituirFaixas } from '../src/repo/faixas.js';

function dbDeTeste() {
  return abrirDb(':memory:');
}

test('criarCaptador / listarCaptadores', () => {
  const db = dbDeTeste();
  criarCaptador(db, { nome: 'Ana' });
  criarCaptador(db, { nome: 'Bruno' });
  const captadores = listarCaptadores(db);
  assert.equal(captadores.length, 2);
  assert.deepEqual(captadores.map((c) => c.nome), ['Ana', 'Bruno']);
});

test('obterMeta cai para meta padrão quando não há meta específica', () => {
  const db = dbDeTeste();
  const ana = criarCaptador(db, { nome: 'Ana' });
  assert.equal(obterMeta(db, ana.id, '2026-08'), obterMetaPadrao(db));
});

test('definirMeta / obterMeta: meta específica do mês tem prioridade, senão usa a última anterior', () => {
  const db = dbDeTeste();
  const ana = criarCaptador(db, { nome: 'Ana' });
  definirMeta(db, { captadorId: ana.id, mesReferencia: '2026-01', valorMeta: 2500 });
  assert.equal(obterMeta(db, ana.id, '2026-01'), 2500);
  // meta de março ainda não definida -> usa a de janeiro (mais recente anterior)
  assert.equal(obterMeta(db, ana.id, '2026-03'), 2500);
  definirMeta(db, { captadorId: ana.id, mesReferencia: '2026-03', valorMeta: 4000 });
  assert.equal(obterMeta(db, ana.id, '2026-03'), 4000);
  // fevereiro continua na meta de janeiro
  assert.equal(obterMeta(db, ana.id, '2026-02'), 2500);
});

test('criarLancamento de patrocínio gera 12 provisões e alimenta a base do mês', () => {
  const db = dbDeTeste();
  const ana = criarCaptador(db, { nome: 'Ana' });
  const lancamento = criarLancamento(db, {
    captadorId: ana.id,
    tipo: 'patrocinio',
    valorTotal: 60000,
    mesReferencia: '2026-01',
    descricao: 'Patrocínio corrida',
  });
  assert.equal(lancamento.provisoes.length, 12);
  assert.equal(lancamento.provisoes[0].mes_referencia, '2026-01');
  assert.equal(lancamento.provisoes[11].mes_referencia, '2026-12');

  const baseJan = obterBaseMensalPorTipo(db, ana.id, '2026-01');
  assert.equal(baseJan.patrocinio, 5000);
  const baseDez = obterBaseMensalPorTipo(db, ana.id, '2026-12');
  assert.equal(baseDez.patrocinio, 5000);
  const baseJan2027 = obterBaseMensalPorTipo(db, ana.id, '2027-01');
  assert.equal(baseJan2027.patrocinio, 0); // já passou dos 12 meses
});

test('criarLancamento de empresa amiga: valor mensal se repete (não divide) nas 12 parcelas', () => {
  const db = dbDeTeste();
  const ana = criarCaptador(db, { nome: 'Ana' });
  criarLancamento(db, { captadorId: ana.id, tipo: 'empresa_amiga', valorTotal: 50, mesReferencia: '2026-01' });
  criarLancamento(db, { captadorId: ana.id, tipo: 'empresa_amiga', valorTotal: 80, mesReferencia: '2026-02' });

  // Em fevereiro: os 50 do doador de janeiro (2ª parcela) + os 80 do novo doador (1ª parcela) = 130
  const baseFev = obterBaseMensalPorTipo(db, ana.id, '2026-02');
  assert.equal(baseFev.empresa_amiga, 130);
});

test('cenário completo reproduz o exemplo numérico da política (base somada literalmente)', () => {
  const db = dbDeTeste();
  const ana = criarCaptador(db, { nome: 'Ana' });
  definirMeta(db, { captadorId: ana.id, mesReferencia: '2026-08', valorMeta: 3000 });

  // "acumulado" de empresa amiga de 10.000 simulado com um único lançamento anterior
  // que já está gerando 10.000/mês de base (não é uma nova captação em agosto).
  criarLancamento(db, { captadorId: ana.id, tipo: 'empresa_amiga', valorTotal: 7600, mesReferencia: '2026-01' });
  // novos fechamentos de agosto = 2.400 (referência da meta)
  criarLancamento(db, { captadorId: ana.id, tipo: 'empresa_amiga', valorTotal: 2400, mesReferencia: '2026-08' });
  criarLancamento(db, { captadorId: ana.id, tipo: 'patrocinio', valorTotal: 60000, mesReferencia: '2026-08' });
  criarLancamento(db, { captadorId: ana.id, tipo: 'projeto_incentivado', valorTotal: 150000, mesReferencia: '2026-08' });

  const resultado = calcularComissaoCaptadorMes(db, ana.id, '2026-08');
  assert.equal(resultado.percentualAtingimento, 0.8); // 2400/3000
  assert.equal(resultado.percentualComissao, 0.04);
  assert.equal(resultado.detalhamento.baseEmpresaAmigaAcumulado, 10000); // 7600 + 2400
  assert.equal(resultado.baseTotal, 27500); // 10000 + 5000 + 12500 (ver nota da divergência do exemplo)
  assert.equal(resultado.valorComissao, 1100);
});

test('calcularComissaoTodosCaptadoresMes retorna um resultado por captador ativo', () => {
  const db = dbDeTeste();
  const ana = criarCaptador(db, { nome: 'Ana' });
  const bruno = criarCaptador(db, { nome: 'Bruno' });
  const resultados = calcularComissaoTodosCaptadoresMes(db, '2026-08');
  assert.equal(resultados.length, 2);
  assert.ok(resultados.every((r) => r.captador.id === ana.id || r.captador.id === bruno.id));
});

test('cancelarProvisoesFuturas interrompe o crédito a partir de um mês, preservando o histórico', () => {
  const db = dbDeTeste();
  const ana = criarCaptador(db, { nome: 'Ana' });
  const lancamento = criarLancamento(db, { captadorId: ana.id, tipo: 'empresa_amiga', valorTotal: 100, mesReferencia: '2026-01' });

  const { canceladas } = cancelarProvisoesFuturas(db, lancamento.id, '2026-04');
  assert.equal(canceladas, 9); // abr..dez

  assert.equal(obterBaseMensalPorTipo(db, ana.id, '2026-03').empresa_amiga, 100);
  assert.equal(obterBaseMensalPorTipo(db, ana.id, '2026-04').empresa_amiga, 0);
});

test('listarLancamentos filtra por captador/tipo/mês', () => {
  const db = dbDeTeste();
  const ana = criarCaptador(db, { nome: 'Ana' });
  criarLancamento(db, { captadorId: ana.id, tipo: 'edital', valorTotal: 1200, mesReferencia: '2026-01' });
  criarLancamento(db, { captadorId: ana.id, tipo: 'empresa_amiga', valorTotal: 50, mesReferencia: '2026-01' });
  assert.equal(listarLancamentos(db, { captadorId: ana.id }).length, 2);
  assert.equal(listarLancamentos(db, { captadorId: ana.id, tipo: 'edital' }).length, 1);
});

test('confirmarPagamento concede bônus de adimplência ao completar 12 pagamentos', () => {
  const db = dbDeTeste();
  const ana = criarCaptador(db, { nome: 'Ana' });
  const doador = criarDoador(db, { captadorId: ana.id, nome: 'Empresa X' });

  let ultimoResultado;
  for (let i = 0; i < 12; i += 1) {
    ultimoResultado = confirmarPagamento(db, doador.id);
  }
  assert.ok(ultimoResultado.bonusConcedido);
  assert.equal(ultimoResultado.bonusConcedido.valor, 30);
  assert.equal(ultimoResultado.doador.bonus_adimplencia_pago, 1);

  // um 13º pagamento não gera um segundo bônus
  const resultado13 = confirmarPagamento(db, doador.id);
  assert.equal(resultado13.bonusConcedido, null);
});

test('registrarRenovacao aplica o valor da cota e não conta para a meta mensal', () => {
  const db = dbDeTeste();
  const ana = criarCaptador(db, { nome: 'Ana' });
  const doador = criarDoador(db, { captadorId: ana.id, nome: 'Empresa Y', cota: 'bronze' });

  const renovacaoOuro = registrarRenovacao(db, { doadorId: doador.id, data: '2026-05-01', cota: 'ouro' });
  assert.equal(renovacaoOuro.valor_bonus, 60);

  // não deve ter criado nenhum lançamento/provisão (renovação é só bônus, fora da meta)
  assert.equal(listarLancamentos(db, { captadorId: ana.id }).length, 0);
});

test('faixas: substituirFaixas troca a tabela e o cálculo passa a usá-la', () => {
  const db = dbDeTeste();
  const ana = criarCaptador(db, { nome: 'Ana' });
  definirMeta(db, { captadorId: ana.id, mesReferencia: '2026-08', valorMeta: 1000 });
  criarLancamento(db, { captadorId: ana.id, tipo: 'empresa_amiga', valorTotal: 1000, mesReferencia: '2026-08' });

  substituirFaixas(db, [{ nome: 'unica', percentualMin: 0, percentualMax: null, percentualComissao: 0.5 }]);
  assert.equal(listarFaixas(db).length, 1);

  const resultado = calcularComissaoCaptadorMes(db, ana.id, '2026-08');
  assert.equal(resultado.percentualComissao, 0.5);
  assert.equal(resultado.valorComissao, 500);
});

test('premiação anual: calcula, salva e permite aprovar', () => {
  const db = dbDeTeste();
  const ana = criarCaptador(db, { nome: 'Ana' });
  const bruno = criarCaptador(db, { nome: 'Bruno' });

  const premiacao = calcularESalvarPremiacao(db, {
    ano: 2026,
    receitaAnualRecebida: 216000,
    participantes: [
      { captadorId: ana.id, receitaRecebida: 150000, mesesTrabalhados: 12 },
      { captadorId: bruno.id, receitaRecebida: 66000, mesesTrabalhados: 12 },
    ],
  });

  assert.equal(premiacao.valor_total, 2160);
  assert.equal(premiacao.aprovado, 0);
  assert.equal(premiacao.rateio.length, 2);

  const aprovada = aprovarPremiacao(db, 2026);
  assert.equal(aprovada.aprovado, 1);
});
