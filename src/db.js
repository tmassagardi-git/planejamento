/**
 * Banco de dados do sistema de controle de comissão (Projeto Empresa Amiga).
 *
 * Usa `node:sqlite` (nativo do Node >= 22, sem dependências externas — mesmo
 * espírito do resto do repositório). É uma API experimental do Node, mas
 * estável o suficiente para uma aplicação interna deste porte.
 */
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { FAIXAS_PADRAO } from './calc/tiers.js';
import { TABELA_BONUS_RENOVACAO_PADRAO } from './calc/bonuses.js';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS captadores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  ativo INTEGER NOT NULL DEFAULT 1,
  data_admissao TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS metas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  captador_id INTEGER NOT NULL REFERENCES captadores(id),
  mes_referencia TEXT NOT NULL,
  valor_meta REAL NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(captador_id, mes_referencia)
);

CREATE TABLE IF NOT EXISTS faixas_incentivo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  percentual_min REAL NOT NULL,
  percentual_max REAL,
  percentual_comissao REAL NOT NULL,
  ordem INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS doadores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  captador_id INTEGER NOT NULL REFERENCES captadores(id),
  nome TEXT NOT NULL,
  cota TEXT,
  ativo INTEGER NOT NULL DEFAULT 1,
  pagamentos_confirmados INTEGER NOT NULL DEFAULT 0,
  bonus_adimplencia_pago INTEGER NOT NULL DEFAULT 0,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lancamentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  captador_id INTEGER NOT NULL REFERENCES captadores(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('empresa_amiga','patrocinio','edital','projeto_incentivado')),
  doador_id INTEGER REFERENCES doadores(id),
  descricao TEXT,
  valor_total REAL NOT NULL,
  mes_referencia TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS provisoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lancamento_id INTEGER NOT NULL REFERENCES lancamentos(id),
  numero_parcela INTEGER NOT NULL,
  mes_referencia TEXT NOT NULL,
  valor REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'previsto' CHECK (status IN ('previsto','cancelado'))
);
CREATE INDEX IF NOT EXISTS idx_provisoes_mes ON provisoes(mes_referencia);
CREATE INDEX IF NOT EXISTS idx_provisoes_lancamento ON provisoes(lancamento_id);

CREATE TABLE IF NOT EXISTS bonus_renovacao_config (
  cota TEXT PRIMARY KEY,
  valor REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS renovacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doador_id INTEGER NOT NULL REFERENCES doadores(id),
  captador_id INTEGER NOT NULL REFERENCES captadores(id),
  cota TEXT NOT NULL,
  data TEXT NOT NULL,
  valor_bonus REAL NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bonus_adimplencia (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doador_id INTEGER NOT NULL REFERENCES doadores(id),
  captador_id INTEGER NOT NULL REFERENCES captadores(id),
  valor REAL NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS premiacoes_anuais (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ano INTEGER NOT NULL UNIQUE,
  receita_anual_recebida REAL NOT NULL,
  percentual REAL NOT NULL,
  valor_total REAL NOT NULL,
  rateio_json TEXT NOT NULL,
  aprovado INTEGER NOT NULL DEFAULT 0,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS config (
  chave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);
`;

const DEFAULT_DB_PATH = process.env.COMISSAO_DB_PATH || 'data/comissao.db';

let dbInstance;

export function abrirDb(dbPath = DEFAULT_DB_PATH) {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  seedPadroes(db);
  return db;
}

export function getDb() {
  if (!dbInstance) dbInstance = abrirDb();
  return dbInstance;
}

export function fecharDb() {
  dbInstance?.close();
  dbInstance = undefined;
}

/**
 * `node:sqlite` não expõe um helper de transação como o `better-sqlite3`
 * (`db.transaction(fn)`); envolvemos BEGIN/COMMIT/ROLLBACK manualmente.
 */
export function withTransaction(db, fn) {
  db.exec('BEGIN');
  try {
    const resultado = fn();
    db.exec('COMMIT');
    return resultado;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

function seedPadroes(db) {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM faixas_incentivo').get();
  if (count === 0) {
    const insert = db.prepare(
      'INSERT INTO faixas_incentivo (nome, percentual_min, percentual_max, percentual_comissao, ordem) VALUES (?, ?, ?, ?, ?)'
    );
    FAIXAS_PADRAO.forEach((faixa, idx) => {
      insert.run(faixa.id, faixa.percentualMin, faixa.percentualMax, faixa.percentualComissao, idx);
    });
  }

  const { count: countRenovacao } = db.prepare('SELECT COUNT(*) AS count FROM bonus_renovacao_config').get();
  if (countRenovacao === 0) {
    const insert = db.prepare('INSERT INTO bonus_renovacao_config (cota, valor) VALUES (?, ?)');
    for (const [cota, valor] of Object.entries(TABELA_BONUS_RENOVACAO_PADRAO)) {
      insert.run(cota, valor);
    }
  }

  const defaults = { meta_padrao: '3000', bonus_adimplencia_valor: '30', premiacao_percentual: '0.01' };
  const upsertConfig = db.prepare('INSERT OR IGNORE INTO config (chave, valor) VALUES (?, ?)');
  for (const [chave, valor] of Object.entries(defaults)) {
    upsertConfig.run(chave, valor);
  }
}
