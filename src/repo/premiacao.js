// Acesso a dados: Premiação Anual por Crescimento Institucional.
//
// A apuração exige valores efetivamente recebidos no ano (não provisões) e
// aprovação da Diretoria — por isso a receita anual e a lista de
// participantes são informadas manualmente pelo(a) administrador(a) do
// painel, e o resultado fica marcado como rascunho (`aprovado = 0`) até ser
// aprovado.
import { calcularValorTotalPremiacao, sugerirRateioPorEquipe, PERCENTUAL_PREMIACAO_PADRAO } from '../calc/annualAward.js';

export function calcularESalvarPremiacao(db, { ano, receitaAnualRecebida, percentual = PERCENTUAL_PREMIACAO_PADRAO, participantes }) {
  const valorTotal = calcularValorTotalPremiacao(receitaAnualRecebida, percentual);
  const rateio = sugerirRateioPorEquipe({ valorTotal, participantes });

  db.prepare(
    `INSERT INTO premiacoes_anuais (ano, receita_anual_recebida, percentual, valor_total, rateio_json)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(ano) DO UPDATE SET
       receita_anual_recebida = excluded.receita_anual_recebida,
       percentual = excluded.percentual,
       valor_total = excluded.valor_total,
       rateio_json = excluded.rateio_json,
       aprovado = 0`
  ).run(ano, receitaAnualRecebida, percentual, valorTotal, JSON.stringify(rateio));

  return obterPremiacao(db, ano);
}

export function obterPremiacao(db, ano) {
  const row = db.prepare('SELECT * FROM premiacoes_anuais WHERE ano = ?').get(ano);
  if (!row) return null;
  return { ...row, rateio: JSON.parse(row.rateio_json) };
}

export function listarPremiacoes(db) {
  return db
    .prepare('SELECT * FROM premiacoes_anuais ORDER BY ano DESC')
    .all()
    .map((row) => ({ ...row, rateio: JSON.parse(row.rateio_json) }));
}

export function aprovarPremiacao(db, ano) {
  const info = db.prepare('UPDATE premiacoes_anuais SET aprovado = 1 WHERE ano = ?').run(ano);
  if (info.changes === 0) throw new Error(`Premiação de ${ano} não encontrada`);
  return obterPremiacao(db, ano);
}
