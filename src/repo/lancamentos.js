// Acesso a dados: lançamentos de captação (empresa amiga, patrocínio, edital,
// projeto incentivado) e suas provisões mensais (o "crédito futuro" de 12 meses).
import { withTransaction } from '../db.js';
import { gerarProvisoes, TIPOS_VALIDOS } from '../calc/provisions.js';

/**
 * Lança uma captação e já gera as 12 provisões mensais correspondentes
 * (mês atual = 1ª parcela + 11 meses seguintes):
 *
 *   - "empresa_amiga": o valor mensal informado se repete nas 12 parcelas
 *     (doação recorrente mensal).
 *   - demais tipos: o valor total informado é dividido em 12 parcelas iguais
 *     (a menos de centavos de arredondamento).
 */
export function criarLancamento(db, { captadorId, tipo, valorTotal, mesReferencia, doadorId = null, descricao = null }) {
  if (!TIPOS_VALIDOS.includes(tipo)) {
    throw new Error(`tipo inválido: "${tipo}" (esperado um de: ${TIPOS_VALIDOS.join(', ')})`);
  }
  const provisoes = gerarProvisoes({ tipo, valorTotal, mesReferencia }); // valida valorTotal/mesReferencia

  return withTransaction(db, () => {
    const info = db
      .prepare(
        'INSERT INTO lancamentos (captador_id, tipo, doador_id, descricao, valor_total, mes_referencia) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(captadorId, tipo, doadorId, descricao, valorTotal, mesReferencia);
    const lancamentoId = Number(info.lastInsertRowid);

    const inserirProvisao = db.prepare(
      'INSERT INTO provisoes (lancamento_id, numero_parcela, mes_referencia, valor) VALUES (?, ?, ?, ?)'
    );
    for (const p of provisoes) {
      inserirProvisao.run(lancamentoId, p.numeroParcela, p.mesReferencia, p.valor);
    }

    return obterLancamentoComProvisoes(db, lancamentoId);
  });
}

export function obterLancamentoComProvisoes(db, id) {
  const lancamento = db.prepare('SELECT * FROM lancamentos WHERE id = ?').get(id);
  if (!lancamento) return null;
  const provisoes = db
    .prepare('SELECT * FROM provisoes WHERE lancamento_id = ? ORDER BY numero_parcela')
    .all(id);
  return { ...lancamento, provisoes };
}

export function listarLancamentos(db, { captadorId, tipo, mesReferencia } = {}) {
  const condicoes = [];
  const params = [];
  if (captadorId) {
    condicoes.push('captador_id = ?');
    params.push(captadorId);
  }
  if (tipo) {
    condicoes.push('tipo = ?');
    params.push(tipo);
  }
  if (mesReferencia) {
    condicoes.push('mes_referencia = ?');
    params.push(mesReferencia);
  }
  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
  return db.prepare(`SELECT * FROM lancamentos ${where} ORDER BY mes_referencia DESC, criado_em DESC`).all(...params);
}

/**
 * Interrompe o crédito futuro de um lançamento a partir de um mês (ex.:
 * doador cancelou, patrocínio não vai se repetir) — cancela as provisões
 * "previsto" com mes_referencia >= mesReferencia, preservando o histórico
 * das parcelas já passadas.
 */
export function cancelarProvisoesFuturas(db, lancamentoId, apartirDoMes) {
  const info = db
    .prepare(
      "UPDATE provisoes SET status = 'cancelado' WHERE lancamento_id = ? AND mes_referencia >= ? AND status = 'previsto'"
    )
    .run(lancamentoId, apartirDoMes);
  return { canceladas: info.changes };
}

/**
 * Soma das provisões (status = 'previsto') de um(a) captador(a) num mês,
 * agrupadas por tipo — é a base de cálculo da comissão mensal.
 */
export function obterBaseMensalPorTipo(db, captadorId, mesReferencia) {
  const linhas = db
    .prepare(
      `SELECT l.tipo AS tipo, COALESCE(SUM(p.valor), 0) AS total
       FROM provisoes p
       JOIN lancamentos l ON l.id = p.lancamento_id
       WHERE l.captador_id = ? AND p.mes_referencia = ? AND p.status = 'previsto'
       GROUP BY l.tipo`
    )
    .all(captadorId, mesReferencia);

  const base = { empresa_amiga: 0, patrocinio: 0, edital: 0, projeto_incentivado: 0 };
  for (const linha of linhas) base[linha.tipo] = linha.total;
  return base;
}

/**
 * Valor de novos fechamentos de Empresa Amiga no mês (1ª parcela dos
 * lançamentos do tipo "empresa_amiga" com mes_referencia = mesReferencia) —
 * é essa a referência usada para medir o atingimento da meta, não o
 * acumulado recorrente.
 */
export function obterNovosEmpresaAmiga(db, captadorId, mesReferencia) {
  const row = db
    .prepare(
      "SELECT COALESCE(SUM(valor_total), 0) AS total FROM lancamentos WHERE captador_id = ? AND tipo = 'empresa_amiga' AND mes_referencia = ?"
    )
    .get(captadorId, mesReferencia);
  return row.total;
}
