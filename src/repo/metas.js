// Acesso a dados: metas mensais de captação por captador(a).
//
// A meta é a referência de pagamento da comissão como um todo (política:
// "a meta do programa empresa Amiga [...] será a referência para pagamento
// da comissão como um todo"). Cada captador(a) tem sua própria meta mensal,
// que pode ser revista mês a mês pela Diretoria.

function obterConfig(db, chave) {
  const row = db.prepare('SELECT valor FROM config WHERE chave = ?').get(chave);
  return row?.valor;
}

export function obterMetaPadrao(db) {
  return Number(obterConfig(db, 'meta_padrao') ?? 3000);
}

export function definirMetaPadrao(db, valor) {
  if (!(valor > 0)) throw new Error('valor da meta padrão deve ser positivo');
  db.prepare('INSERT INTO config (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor').run(
    'meta_padrao',
    String(valor)
  );
}

/**
 * Meta de um(a) captador(a) em um mês: usa o valor definido especificamente
 * para aquele mês; se não houver, cai para a meta específica mais recente
 * anterior a esse mês; se ainda assim não houver nenhuma, usa a meta padrão
 * global (evita ter que recadastrar a mesma meta mês a mês quando ela não muda).
 */
export function obterMeta(db, captadorId, mesReferencia) {
  const exata = db
    .prepare('SELECT valor_meta FROM metas WHERE captador_id = ? AND mes_referencia = ?')
    .get(captadorId, mesReferencia);
  if (exata) return exata.valor_meta;

  const anterior = db
    .prepare(
      'SELECT valor_meta FROM metas WHERE captador_id = ? AND mes_referencia < ? ORDER BY mes_referencia DESC LIMIT 1'
    )
    .get(captadorId, mesReferencia);
  if (anterior) return anterior.valor_meta;

  return obterMetaPadrao(db);
}

export function definirMeta(db, { captadorId, mesReferencia, valorMeta }) {
  if (!(valorMeta > 0)) throw new Error('valorMeta deve ser positivo');
  db.prepare(
    `INSERT INTO metas (captador_id, mes_referencia, valor_meta) VALUES (?, ?, ?)
     ON CONFLICT(captador_id, mes_referencia) DO UPDATE SET valor_meta = excluded.valor_meta`
  ).run(captadorId, mesReferencia, valorMeta);
  return db.prepare('SELECT * FROM metas WHERE captador_id = ? AND mes_referencia = ?').get(captadorId, mesReferencia);
}

export function listarMetas(db, { captadorId } = {}) {
  const sql = captadorId
    ? 'SELECT * FROM metas WHERE captador_id = ? ORDER BY mes_referencia DESC'
    : 'SELECT * FROM metas ORDER BY mes_referencia DESC';
  return captadorId ? db.prepare(sql).all(captadorId) : db.prepare(sql).all();
}
