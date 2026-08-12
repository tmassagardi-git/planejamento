// Acesso a dados: configurações simples chave/valor (meta padrão, valor do
// bônus de adimplência, percentual da premiação anual, etc.)
export function obterConfig(db, chave, valorPadrao) {
  const row = db.prepare('SELECT valor FROM config WHERE chave = ?').get(chave);
  return row ? row.valor : valorPadrao;
}

export function obterConfigNumero(db, chave, valorPadrao) {
  const valor = obterConfig(db, chave, undefined);
  return valor === undefined ? valorPadrao : Number(valor);
}

export function definirConfig(db, chave, valor) {
  db.prepare(
    'INSERT INTO config (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor'
  ).run(chave, String(valor));
  return obterConfig(db, chave);
}
