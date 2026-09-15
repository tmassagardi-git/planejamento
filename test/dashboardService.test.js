import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  monthSlices,
  chunkRangeByMaxDays,
  getOperadoras,
  getResumo,
  getSerieMensalPrevistoRealizado,
  getFichasNovasSerieMensal,
  getDoadores,
  MAX_MONTH_SLICES,
} from '../src/dashboardService.js';

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(body) };
}

const apiOptions = { baseUrl: 'https://example.com/', token: 'tok', codigoCliente: 'HCL' };

test('monthSlices divide um período de 3 meses corretamente, clipando as pontas', () => {
  const slices = monthSlices('2026-06-15', '2026-08-10');
  assert.deepEqual(slices, [
    { key: '2026-06', ini: '2026-06-15', fim: '2026-06-30' },
    { key: '2026-07', ini: '2026-07-01', fim: '2026-07-31' },
    { key: '2026-08', ini: '2026-08-01', fim: '2026-08-10' },
  ]);
});

test('monthSlices com período dentro de um único mês retorna uma fatia', () => {
  const slices = monthSlices('2026-07-05', '2026-07-20');
  assert.deepEqual(slices, [{ key: '2026-07', ini: '2026-07-05', fim: '2026-07-20' }]);
});

test('monthSlices rejeita dataIni depois de dataFim', () => {
  assert.throws(() => monthSlices('2026-08-01', '2026-07-01'), /anterior ou igual/);
});

test('chunkRangeByMaxDays não divide um período dentro do limite', () => {
  const chunks = chunkRangeByMaxDays('2026-01-01', '2026-06-30', 366);
  assert.deepEqual(chunks, [{ ini: '2026-01-01', fim: '2026-06-30' }]);
});

test('chunkRangeByMaxDays divide um período maior que o limite em fatias contíguas', () => {
  const chunks = chunkRangeByMaxDays('2026-01-01', '2026-01-10', 3);
  assert.deepEqual(chunks, [
    { ini: '2026-01-01', fim: '2026-01-04' },
    { ini: '2026-01-05', fim: '2026-01-08' },
    { ini: '2026-01-09', fim: '2026-01-10' },
  ]);
});

test('getOperadoras deduplica por código de operador e soma os totais', async () => {
  const fetchImpl = async () =>
    jsonResponse(200, {
      dados: [
        { turma: '', operador: '111', nome_operador: 'HOSPITAL COPEL', valor_recebido: '185.00', contribuintes: 3 },
        { turma: 'A', operador: '111', nome_operador: 'HOSPITAL COPEL', valor_recebido: '79643.00', contribuintes: 1870 },
        { turma: 'A', operador: '77', nome_operador: 'CARNE', valor_recebido: '375917.75', contribuintes: 12515 },
      ],
    });

  const operadoras = await getOperadoras({
    apiOptions: { ...apiOptions, fetchImpl },
    dataIni: '2026-07-01',
    dataFim: '2026-07-31',
  });

  assert.equal(operadoras.length, 2);
  const op111 = operadoras.find((o) => o.operador === '111');
  assert.equal(op111.valorRecebido, 185 + 79643);
  assert.equal(op111.contribuintes, 3 + 1870);
});

test('getResumo sem operador usa previsto/recebido/fichasNovas diretamente', async () => {
  const fetchImpl = async (url) => {
    const recurso = new URL(url).searchParams.get('recurso');
    if (recurso === 'previsto') return jsonResponse(200, { dados: [{ valor_previsto: '1000.00', contribuintes: 10 }] });
    if (recurso === 'recebido') return jsonResponse(200, { dados: [{ valor_recebido: '800.00', contribuintes: 8 }] });
    if (recurso === 'fichasNovas') return jsonResponse(200, { dados: [{ fichas_novas: 5, valor_recebido: '50.00' }] });
    throw new Error(`recurso inesperado: ${recurso}`);
  };

  const resumo = await getResumo({
    apiOptions: { ...apiOptions, fetchImpl },
    dataIni: '2026-07-01',
    dataFim: '2026-07-31',
  });

  assert.deepEqual(resumo, {
    previstoValor: 1000,
    previstoQtd: 10,
    realizadoValor: 800,
    realizadoQtd: 8,
    fichasNovasQtd: 5,
    fichasNovasValor: 50,
    fichasNovasDisponivel: true,
  });
});

test('getResumo com operador deriva previsto/realizado da consulta de doações e marca fichasNovas indisponível', async () => {
  const fetchImpl = async (url) => {
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get('operador'), '111');
    return jsonResponse(200, {
      dados: [
        { valor_previsto: '100.00', valor_pago: '100.00' },
        { valor_previsto: '50.00', valor_pago: '0.00' },
      ],
      total_paginas: 1,
    });
  };

  const resumo = await getResumo({
    apiOptions: { ...apiOptions, fetchImpl },
    dataIni: '2026-07-01',
    dataFim: '2026-07-31',
    operador: '111',
  });

  assert.equal(resumo.previstoValor, 150);
  assert.equal(resumo.previstoQtd, 2);
  assert.equal(resumo.realizadoValor, 100);
  assert.equal(resumo.realizadoQtd, 1);
  assert.equal(resumo.fichasNovasDisponivel, false);
  assert.equal(resumo.fichasNovasQtd, null);
});

test('getResumo e getSerieMensalPrevistoRealizado com operador e mesmo período de 1 mês reaproveitam a mesma busca (cache curto)', async () => {
  let chamadasDoacoes = 0;
  const fetchImpl = async (url) => {
    const parsed = new URL(url);
    if (!parsed.searchParams.has('recurso')) {
      chamadasDoacoes += 1;
      return jsonResponse(200, {
        dados: [{ valor_previsto: '100.00', valor_pago: '100.00' }],
        total_paginas: 1,
      });
    }
    throw new Error('não deveria chamar recurso de dashboard quando operador está definido');
  };

  const [resumo, serie] = await Promise.all([
    getResumo({
      apiOptions: { ...apiOptions, fetchImpl },
      dataIni: '2026-07-01',
      dataFim: '2026-07-31',
      operador: '77',
    }),
    getSerieMensalPrevistoRealizado({
      apiOptions: { ...apiOptions, fetchImpl },
      dataIni: '2026-07-01',
      dataFim: '2026-07-31',
      operador: '77',
    }),
  ]);

  assert.equal(chamadasDoacoes, 1, 'a busca paginada deveria ser reaproveitada entre resumo e série mensal');
  assert.equal(resumo.previstoValor, 100);
  assert.equal(serie[0].previstoValor, 100);
});

test('getSerieMensalPrevistoRealizado sem operador combina previsto por mês com dia agrupado por mês', async () => {
  const fetchImpl = async (url) => {
    const parsed = new URL(url);
    const recurso = parsed.searchParams.get('recurso');
    if (recurso === 'previsto') {
      const ini = parsed.searchParams.get('data_ini');
      const valor = ini.startsWith('2026-06') ? '600.00' : '900.00';
      return jsonResponse(200, { dados: [{ valor_previsto: valor, contribuintes: 1 }] });
    }
    if (recurso === 'dia') {
      return jsonResponse(200, {
        dados: [
          { data: '2026-06-15', valor_recebido: '300.00', quantidade_paga: '3' },
          { data: '2026-07-01', valor_recebido: '500.00', quantidade_paga: '5' },
        ],
      });
    }
    throw new Error(`recurso inesperado: ${recurso}`);
  };

  const serie = await getSerieMensalPrevistoRealizado({
    apiOptions: { ...apiOptions, fetchImpl },
    dataIni: '2026-06-15',
    dataFim: '2026-07-10',
  });

  assert.deepEqual(serie, [
    { mes: '2026-06', previstoValor: 600, previstoQtd: 1, realizadoValor: 300, realizadoQtd: 3 },
    { mes: '2026-07', previstoValor: 900, previstoQtd: 1, realizadoValor: 500, realizadoQtd: 5 },
  ]);
});

test('getSerieMensalPrevistoRealizado rejeita períodos maiores que MAX_MONTH_SLICES meses', async () => {
  await assert.rejects(
    () =>
      getSerieMensalPrevistoRealizado({
        apiOptions: { ...apiOptions, fetchImpl: async () => jsonResponse(200, { dados: [] }) },
        dataIni: '2020-01-01',
        dataFim: '2026-12-31',
      }),
    new RegExp(`máximo ${MAX_MONTH_SLICES} meses`)
  );
});

test('getFichasNovasSerieMensal busca um mês por chamada', async () => {
  const chamadas = [];
  const fetchImpl = async (url) => {
    chamadas.push(new URL(url).searchParams.get('data_ini'));
    return jsonResponse(200, { dados: [{ fichas_novas: 10, valor_recebido: '100.00' }] });
  };

  const serie = await getFichasNovasSerieMensal({
    apiOptions: { ...apiOptions, fetchImpl },
    dataIni: '2026-06-01',
    dataFim: '2026-07-31',
  });

  assert.equal(chamadas.length, 2);
  assert.deepEqual(
    serie.map((s) => s.mes),
    ['2026-06', '2026-07']
  );
});

test('getDoadores repassa período/operador/página, pagina e projeta só os campos não sensíveis', async () => {
  const fetchImpl = async (url) => {
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get('vencimento_ini'), '2026-07-01');
    assert.equal(parsed.searchParams.get('pagina'), '2');
    assert.equal(parsed.searchParams.get('limite'), '1000');
    return jsonResponse(200, {
      dados: [{ nome: 'FULANO', contribuinte: 42, doc: '11122233344', telefone: '999999999', valor_previsto: '10.00' }],
      total_paginas: 5,
      total_registros: 4500,
      pagina: 2,
    });
  };

  const resultado = await getDoadores({
    apiOptions: { ...apiOptions, fetchImpl },
    dataIni: '2026-07-01',
    dataFim: '2026-07-31',
    pagina: 2,
  });

  assert.equal(resultado.pagina, 2);
  assert.equal(resultado.totalPaginas, 5);
  assert.equal(resultado.totalRegistros, 4500);
  assert.equal(resultado.registros.length, 1);
  assert.equal(resultado.registros[0].nome, 'FULANO');
  assert.equal(resultado.registros[0].contribuinte, 42);
  assert.equal(resultado.registros[0].valor_previsto, '10.00');
  assert.ok(!('doc' in resultado.registros[0]), 'CPF (doc) não deve aparecer na resposta do painel');
  assert.ok(!('telefone' in resultado.registros[0]), 'telefone não deve aparecer na resposta do painel');
});
