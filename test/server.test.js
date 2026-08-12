import { test } from 'node:test';
import assert from 'node:assert/strict';

import { abrirDb } from '../src/db.js';
import { criarServidor } from '../src/server.js';

async function comServidor(fn) {
  const db = abrirDb(':memory:');
  const servidor = criarServidor(db);
  await new Promise((resolve) => servidor.listen(0, resolve));
  const { port } = servidor.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await fn(baseUrl);
  } finally {
    await new Promise((resolve) => servidor.close(resolve));
    db.close();
  }
}

async function requisitar(baseUrl, metodo, caminho, corpo) {
  const resposta = await fetch(`${baseUrl}${caminho}`, {
    method: metodo,
    headers: corpo ? { 'Content-Type': 'application/json' } : undefined,
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const json = await resposta.json();
  return { status: resposta.status, json };
}

test('API: fluxo completo — captador, meta, lançamentos e comissão do mês', async () => {
  await comServidor(async (baseUrl) => {
    const { json: ana } = await requisitar(baseUrl, 'POST', '/api/captadores', { nome: 'Ana' });
    assert.equal(ana.nome, 'Ana');

    await requisitar(baseUrl, 'POST', '/api/metas', { captadorId: ana.id, mesReferencia: '2026-08', valorMeta: 3000 });

    await requisitar(baseUrl, 'POST', '/api/lancamentos', {
      captadorId: ana.id,
      tipo: 'empresa_amiga',
      valorTotal: 2400,
      mesReferencia: '2026-08',
    });
    const { status: statusPatrocinio, json: patrocinio } = await requisitar(baseUrl, 'POST', '/api/lancamentos', {
      captadorId: ana.id,
      tipo: 'patrocinio',
      valorTotal: 60000,
      mesReferencia: '2026-08',
      descricao: 'Corrida beneficente',
    });
    assert.equal(statusPatrocinio, 200);
    assert.equal(patrocinio.provisoes.length, 12);

    const { json: comissao } = await requisitar(baseUrl, 'GET', `/api/comissoes/${ana.id}?mes=2026-08`);
    assert.equal(comissao.percentualAtingimento, 0.8);
    assert.equal(comissao.percentualComissao, 0.04);
    assert.equal(comissao.baseTotal, 2400 + 5000);
    assert.equal(comissao.valorComissao, (2400 + 5000) * 0.04);

    const { json: todos } = await requisitar(baseUrl, 'GET', '/api/comissoes?mes=2026-08');
    assert.equal(todos.length, 1);
  });
});

test('API: doador — confirmar pagamentos concede bônus de adimplência no 12º', async () => {
  await comServidor(async (baseUrl) => {
    const { json: ana } = await requisitar(baseUrl, 'POST', '/api/captadores', { nome: 'Ana' });
    const { json: doador } = await requisitar(baseUrl, 'POST', '/api/doadores', { captadorId: ana.id, nome: 'Empresa X' });

    let ultimo;
    for (let i = 0; i < 12; i += 1) {
      ({ json: ultimo } = await requisitar(baseUrl, 'POST', `/api/doadores/${doador.id}/pagamentos`));
    }
    assert.ok(ultimo.bonusConcedido);
    assert.equal(ultimo.bonusConcedido.valor, 30);
  });
});

test('API: renovação aplica bônus por cota', async () => {
  await comServidor(async (baseUrl) => {
    const { json: ana } = await requisitar(baseUrl, 'POST', '/api/captadores', { nome: 'Ana' });
    const { json: doador } = await requisitar(baseUrl, 'POST', '/api/doadores', {
      captadorId: ana.id,
      nome: 'Empresa Y',
      cota: 'bronze',
    });
    const { json: renovacao } = await requisitar(baseUrl, 'POST', `/api/doadores/${doador.id}/renovacoes`, {
      data: '2026-05-01',
      cota: 'ouro',
    });
    assert.equal(renovacao.valor_bonus, 60);
  });
});

test('API: rota inexistente responde 404 com JSON', async () => {
  await comServidor(async (baseUrl) => {
    const { status, json } = await requisitar(baseUrl, 'GET', '/api/nao-existe');
    assert.equal(status, 404);
    assert.match(json.erro, /Rota não encontrada/);
  });
});

test('API: erro de validação responde 400 com mensagem', async () => {
  await comServidor(async (baseUrl) => {
    const { status, json } = await requisitar(baseUrl, 'POST', '/api/lancamentos', {
      captadorId: 1,
      tipo: 'tipo_invalido',
      valorTotal: 100,
      mesReferencia: '2026-01',
    });
    assert.equal(status, 400);
    assert.match(json.erro, /tipo inválido/);
  });
});

test('API: config de bônus de adimplência tem valor padrão e pode ser atualizado', async () => {
  await comServidor(async (baseUrl) => {
    const { json: padrao } = await requisitar(baseUrl, 'GET', '/api/config/bonus-adimplencia-valor');
    assert.equal(padrao.valor, 30);
    const { json: atualizado } = await requisitar(baseUrl, 'PUT', '/api/config/bonus-adimplencia-valor', { valor: 50 });
    assert.equal(atualizado.valor, 50);
    const { json: relido } = await requisitar(baseUrl, 'GET', '/api/config/bonus-adimplencia-valor');
    assert.equal(relido.valor, 50);
  });
});

test('arquivos estáticos: GET / serve public/index.html', async () => {
  await comServidor(async (baseUrl) => {
    const resposta = await fetch(`${baseUrl}/`);
    assert.equal(resposta.status, 200);
    const texto = await resposta.text();
    assert.match(texto, /<html/i);
  });
});

test('arquivos estáticos: path traversal é bloqueado', async () => {
  await comServidor(async (baseUrl) => {
    const resposta = await fetch(`${baseUrl}/../../../../etc/passwd`, { redirect: 'manual' });
    assert.notEqual(resposta.status, 200);
  });
});
