import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildQueryUrl, parseApiResponse, fetchPage, fetchAllRecords, ApiStiError } from '../src/apiClient.js';

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  };
}

test('buildQueryUrl monta a URL com todos os parâmetros documentados', () => {
  const url = buildQueryUrl('https://tele.ongrentavel.com.br/scriptcase/app/ApiSTI/blank/', {
    codigo_cliente: 'HCL',
    token: 'abc123',
    vencimento_ini: '2026-07-01',
    vencimento_fim: '2026-07-31',
    pagina: 1,
    limite: 1000,
  });

  const parsed = new URL(url);
  assert.equal(parsed.searchParams.get('codigo_cliente'), 'HCL');
  assert.equal(parsed.searchParams.get('token'), 'abc123');
  assert.equal(parsed.searchParams.get('vencimento_ini'), '2026-07-01');
  assert.equal(parsed.searchParams.get('vencimento_fim'), '2026-07-31');
  assert.equal(parsed.searchParams.get('pagina'), '1');
  assert.equal(parsed.searchParams.get('limite'), '1000');
});

test('buildQueryUrl omite parâmetros vazios/undefined', () => {
  const url = buildQueryUrl('https://example.com/', { a: 1, b: undefined, c: null, d: '' });
  const parsed = new URL(url);
  assert.deepEqual([...parsed.searchParams.keys()], ['a']);
});

test('parseApiResponse reconhece variações comuns de nome de campo', () => {
  const variants = [
    { dados: [{ id: 1 }], total_paginas: 3 },
    { data: [{ id: 1 }], totalPages: 3 },
    { registros: [{ id: 1 }], qtd_paginas: '3' },
  ];

  for (const variant of variants) {
    const parsed = parseApiResponse(variant);
    assert.equal(parsed.schemaKnown, true, JSON.stringify(variant));
    assert.equal(parsed.records.length, 1);
    assert.equal(parsed.totalPages, 3);
  }
});

test('parseApiResponse sinaliza schema desconhecido em vez de mascarar com vazio', () => {
  const parsed = parseApiResponse({ algum_campo_nunca_visto: 42 });
  assert.equal(parsed.schemaKnown, false);
  assert.deepEqual(parsed.records, []);
});

test('fetchPage lança ApiStiError em HTTP não-OK', async () => {
  const fetchImpl = async () => jsonResponse(401, { erro: 'token inválido' });
  await assert.rejects(
    () => fetchPage({ baseUrl: 'https://example.com/', codigoCliente: 'HCL', pagina: 1, fetchImpl }),
    (err) => {
      assert.ok(err instanceof ApiStiError);
      assert.equal(err.status, 401);
      return true;
    }
  );
});

test('fetchPage lança ApiStiError em corpo que não é JSON', async () => {
  const fetchImpl = async () => ({ ok: true, status: 200, text: async () => '<html>erro</html>' });
  await assert.rejects(() => fetchPage({ baseUrl: 'https://example.com/', codigoCliente: 'HCL', pagina: 1, fetchImpl }));
});

test('fetchAllRecords pagina até o total informado e agrega os registros', async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    const pagina = Number(new URL(url).searchParams.get('pagina'));
    calls.push(pagina);
    const totalPaginas = 3;
    const registrosPorPagina = pagina <= totalPaginas ? [{ id: pagina * 10 + 1 }, { id: pagina * 10 + 2 }] : [];
    return jsonResponse(200, { dados: registrosPorPagina, total_paginas: totalPaginas, pagina });
  };

  const result = await fetchAllRecords({
    baseUrl: 'https://example.com/',
    token: 'tok',
    codigoCliente: 'HCL',
    vencimentoIni: '2026-07-01',
    vencimentoFim: '2026-07-31',
    delayMs: 0,
    fetchImpl,
  });

  assert.deepEqual(calls, [1, 2, 3]);
  assert.equal(result.records.length, 6);
  assert.equal(result.totalPages, 3);
  assert.equal(result.pagesFetched, 3);
});

test('fetchAllRecords respeita maxPages como trava de segurança', async () => {
  const fetchImpl = async () => jsonResponse(200, { dados: [{ id: 1 }], total_paginas: 999 });

  const result = await fetchAllRecords({
    baseUrl: 'https://example.com/',
    token: 'tok',
    codigoCliente: 'HCL',
    vencimentoIni: '2026-07-01',
    vencimentoFim: '2026-07-31',
    delayMs: 0,
    maxPages: 5,
    fetchImpl,
  });

  assert.equal(result.pagesFetched, 5);
  assert.equal(result.records.length, 5);
});

test('fetchAllRecords lança erro claro quando o schema da resposta não é reconhecido', async () => {
  const fetchImpl = async () => jsonResponse(200, { mensagem: 'algo bem diferente do esperado' });

  await assert.rejects(
    () =>
      fetchAllRecords({
        baseUrl: 'https://example.com/',
        token: 'tok',
        codigoCliente: 'HCL',
        vencimentoIni: '2026-07-01',
        vencimentoFim: '2026-07-31',
        delayMs: 0,
        fetchImpl,
      }),
    ApiStiError
  );
});

test('fetchAllRecords tenta novamente em erro 5xx transitório e depois segue', async () => {
  let attempts = 0;
  const fetchImpl = async (url) => {
    const pagina = Number(new URL(url).searchParams.get('pagina'));
    if (pagina === 1) {
      attempts += 1;
      if (attempts < 2) return jsonResponse(503, { erro: 'temporario' });
      return jsonResponse(200, { dados: [{ id: 1 }], total_paginas: 1 });
    }
    return jsonResponse(200, { dados: [], total_paginas: 1 });
  };

  const result = await fetchAllRecords({
    baseUrl: 'https://example.com/',
    token: 'tok',
    codigoCliente: 'HCL',
    vencimentoIni: '2026-07-01',
    vencimentoFim: '2026-07-31',
    delayMs: 0,
    fetchImpl,
  });

  assert.equal(attempts, 2);
  assert.equal(result.records.length, 1);
});
