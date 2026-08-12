// Acesso a dados: faixas de incentivo (percentual de atingimento -> alíquota de comissão).
import { withTransaction } from '../db.js';

export function listarFaixas(db) {
  return db.prepare('SELECT * FROM faixas_incentivo ORDER BY ordem').all();
}

export function faixasParaCalculo(db) {
  return listarFaixas(db).map((f) => ({
    id: f.nome,
    percentualMin: f.percentual_min,
    percentualMax: f.percentual_max,
    percentualComissao: f.percentual_comissao,
  }));
}

/**
 * Substitui a tabela de faixas inteira (edição via painel de metas). Espera
 * uma lista já validada/ordenada: [{ nome, percentualMin, percentualMax, percentualComissao }].
 */
export function substituirFaixas(db, faixas) {
  if (!faixas?.length) throw new Error('é preciso informar ao menos uma faixa');
  const apagar = db.prepare('DELETE FROM faixas_incentivo');
  const inserir = db.prepare(
    'INSERT INTO faixas_incentivo (nome, percentual_min, percentual_max, percentual_comissao, ordem) VALUES (?, ?, ?, ?, ?)'
  );
  withTransaction(db, () => {
    apagar.run();
    faixas.forEach((f, idx) => {
      inserir.run(f.nome, f.percentualMin, f.percentualMax ?? null, f.percentualComissao, idx);
    });
  });
  return listarFaixas(db);
}
