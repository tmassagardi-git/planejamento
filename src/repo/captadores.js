// Acesso a dados: captadores (membros da equipe de captação, cada um com sua própria meta e comissão).

export function listarCaptadores(db, { somenteAtivos = false } = {}) {
  const sql = somenteAtivos
    ? 'SELECT * FROM captadores WHERE ativo = 1 ORDER BY nome'
    : 'SELECT * FROM captadores ORDER BY nome';
  return db.prepare(sql).all();
}

export function obterCaptador(db, id) {
  return db.prepare('SELECT * FROM captadores WHERE id = ?').get(id) ?? null;
}

export function criarCaptador(db, { nome, dataAdmissao = null }) {
  if (!nome?.trim()) throw new Error('nome é obrigatório');
  const info = db
    .prepare('INSERT INTO captadores (nome, data_admissao) VALUES (?, ?)')
    .run(nome.trim(), dataAdmissao);
  return obterCaptador(db, Number(info.lastInsertRowid));
}

export function atualizarCaptador(db, id, { nome, ativo, dataAdmissao } = {}) {
  const atual = obterCaptador(db, id);
  if (!atual) throw new Error(`Captador ${id} não encontrado`);
  db.prepare('UPDATE captadores SET nome = ?, ativo = ?, data_admissao = ? WHERE id = ?').run(
    nome?.trim() ?? atual.nome,
    ativo === undefined ? atual.ativo : ativo ? 1 : 0,
    dataAdmissao === undefined ? atual.data_admissao : dataAdmissao,
    id
  );
  return obterCaptador(db, id);
}
