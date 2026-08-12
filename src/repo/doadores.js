// Acesso a dados: doadores/parceiros do programa Empresa Amiga — usados para
// rastrear adimplência (12 pagamentos -> bônus) e renovação de cota (bônus anual).
import { avaliarBonusAdimplencia, calcularBonusRenovacao, VALOR_BONUS_ADIMPLENCIA_PADRAO } from '../calc/bonuses.js';
import { obterConfigNumero } from './config.js';

export function listarDoadores(db, { captadorId } = {}) {
  const sql = captadorId
    ? 'SELECT * FROM doadores WHERE captador_id = ? ORDER BY nome'
    : 'SELECT * FROM doadores ORDER BY nome';
  return captadorId ? db.prepare(sql).all(captadorId) : db.prepare(sql).all();
}

export function obterDoador(db, id) {
  return db.prepare('SELECT * FROM doadores WHERE id = ?').get(id) ?? null;
}

export function criarDoador(db, { captadorId, nome, cota = null }) {
  if (!nome?.trim()) throw new Error('nome é obrigatório');
  const info = db
    .prepare('INSERT INTO doadores (captador_id, nome, cota) VALUES (?, ?, ?)')
    .run(captadorId, nome.trim(), cota);
  return obterDoador(db, Number(info.lastInsertRowid));
}

/**
 * Registra mais um pagamento confirmado do doador. Ao completar 12
 * pagamentos, concede automaticamente o Bônus de Adimplência (uma única vez).
 */
export function confirmarPagamento(db, doadorId) {
  const doador = obterDoador(db, doadorId);
  if (!doador) throw new Error(`Doador ${doadorId} não encontrado`);

  const pagamentosConfirmados = doador.pagamentos_confirmados + 1;
  db.prepare('UPDATE doadores SET pagamentos_confirmados = ? WHERE id = ?').run(pagamentosConfirmados, doadorId);

  const valorBonus = obterConfigNumero(db, 'bonus_adimplencia_valor', VALOR_BONUS_ADIMPLENCIA_PADRAO);
  const avaliacao = avaliarBonusAdimplencia({
    pagamentosConfirmados,
    jaPago: Boolean(doador.bonus_adimplencia_pago),
    valorBonus,
  });

  let bonusConcedido = null;
  if (avaliacao.concedido) {
    db.prepare('UPDATE doadores SET bonus_adimplencia_pago = 1 WHERE id = ?').run(doadorId);
    const info = db
      .prepare('INSERT INTO bonus_adimplencia (doador_id, captador_id, valor) VALUES (?, ?, ?)')
      .run(doadorId, doador.captador_id, avaliacao.valor);
    bonusConcedido = db.prepare('SELECT * FROM bonus_adimplencia WHERE id = ?').get(Number(info.lastInsertRowid));
  }

  return { doador: obterDoador(db, doadorId), bonusConcedido };
}

/**
 * Registra uma renovação anual de parceria e concede o bônus correspondente
 * à cota. Renovação não conta para a meta mensal (só gera o registro de bônus).
 */
export function registrarRenovacao(db, { doadorId, data, cota }) {
  const doador = obterDoador(db, doadorId);
  if (!doador) throw new Error(`Doador ${doadorId} não encontrado`);

  const tabela = Object.fromEntries(
    db.prepare('SELECT cota, valor FROM bonus_renovacao_config').all().map((r) => [r.cota, r.valor])
  );
  const valorBonus = calcularBonusRenovacao(cota, tabela);

  if (cota !== doador.cota) {
    db.prepare('UPDATE doadores SET cota = ? WHERE id = ?').run(cota.toLowerCase(), doadorId);
  }

  const info = db
    .prepare('INSERT INTO renovacoes (doador_id, captador_id, cota, data, valor_bonus) VALUES (?, ?, ?, ?, ?)')
    .run(doadorId, doador.captador_id, cota.toLowerCase(), data, valorBonus);

  return db.prepare('SELECT * FROM renovacoes WHERE id = ?').get(Number(info.lastInsertRowid));
}

export function listarBonusAdimplencia(db, { captadorId } = {}) {
  const sql = captadorId
    ? 'SELECT * FROM bonus_adimplencia WHERE captador_id = ? ORDER BY criado_em DESC'
    : 'SELECT * FROM bonus_adimplencia ORDER BY criado_em DESC';
  return captadorId ? db.prepare(sql).all(captadorId) : db.prepare(sql).all();
}

export function listarRenovacoes(db, { captadorId } = {}) {
  const sql = captadorId
    ? 'SELECT * FROM renovacoes WHERE captador_id = ? ORDER BY data DESC'
    : 'SELECT * FROM renovacoes ORDER BY data DESC';
  return captadorId ? db.prepare(sql).all(captadorId) : db.prepare(sql).all();
}

export function listarBonusRenovacaoConfig(db) {
  return db.prepare('SELECT * FROM bonus_renovacao_config ORDER BY valor').all();
}

export function definirBonusRenovacaoConfig(db, cota, valor) {
  if (!(valor >= 0)) throw new Error('valor deve ser >= 0');
  db.prepare(
    'INSERT INTO bonus_renovacao_config (cota, valor) VALUES (?, ?) ON CONFLICT(cota) DO UPDATE SET valor = excluded.valor'
  ).run(cota.toLowerCase(), valor);
  return listarBonusRenovacaoConfig(db);
}
