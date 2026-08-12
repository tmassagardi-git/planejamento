/**
 * Servidor HTTP do sistema de controle de comissão — API REST (JSON) +
 * arquivos estáticos dos painéis (public/). Sem framework (http nativo do
 * Node), no mesmo espírito de zero-dependências do resto do repositório.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { listarCaptadores, criarCaptador, atualizarCaptador } from './repo/captadores.js';
import { listarMetas, definirMeta, obterMetaPadrao, definirMetaPadrao } from './repo/metas.js';
import { listarFaixas, substituirFaixas } from './repo/faixas.js';
import {
  listarDoadores,
  criarDoador,
  confirmarPagamento,
  registrarRenovacao,
  listarBonusAdimplencia,
  listarRenovacoes,
  listarBonusRenovacaoConfig,
  definirBonusRenovacaoConfig,
} from './repo/doadores.js';
import { criarLancamento, listarLancamentos, cancelarProvisoesFuturas, obterLancamentoComProvisoes } from './repo/lancamentos.js';
import { calcularComissaoCaptadorMes, calcularComissaoTodosCaptadoresMes } from './repo/comissao.js';
import { calcularESalvarPremiacao, listarPremiacoes, obterPremiacao, aprovarPremiacao } from './repo/premiacao.js';
import { obterConfigNumero, definirConfig } from './repo/config.js';
import { VALOR_BONUS_ADIMPLENCIA_PADRAO } from './calc/bonuses.js';
import { PERCENTUAL_PREMIACAO_PADRAO } from './calc/annualAward.js';
import { mesAtual } from './calc/mesUtil.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function lerCorpoJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'Corpo da requisição não é um JSON válido');
  }
}

function enviarJson(res, status, dados) {
  const corpo = JSON.stringify(dados);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(corpo),
  });
  res.end(corpo);
}

const MIME_POR_EXTENSAO = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function servirArquivoEstatico(req, res) {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const relativo = urlPath === '/' ? '/index.html' : urlPath;
  const caminhoResolvido = path.normalize(path.join(PUBLIC_DIR, relativo));

  // Impede path traversal (ex.: "/../../etc/passwd") saindo de PUBLIC_DIR.
  if (!caminhoResolvido.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(caminhoResolvido, (err, conteudo) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Não encontrado');
    }
    const ext = path.extname(caminhoResolvido);
    res.writeHead(200, { 'Content-Type': MIME_POR_EXTENSAO[ext] || 'application/octet-stream' });
    res.end(conteudo);
  });
}

/**
 * Roteador simples: cada rota é { metodo, padrao (regex com grupos nomeados
 * via posição), manipulador(req, res, params, db) }.
 */
function criarRotas(db) {
  const rotas = [];
  const add = (metodo, padrao, manipulador) => rotas.push({ metodo, padrao, manipulador });

  add('GET', /^\/api\/captadores$/, () => listarCaptadores(db));
  add('POST', /^\/api\/captadores$/, async (req) => criarCaptador(db, await lerCorpoJson(req)));
  add('PUT', /^\/api\/captadores\/(\d+)$/, async (req, res, [id]) => atualizarCaptador(db, Number(id), await lerCorpoJson(req)));

  add('GET', /^\/api\/metas$/, (req) => {
    const { searchParams } = new URL(req.url, 'http://localhost');
    const captadorId = searchParams.get('captadorId');
    return listarMetas(db, { captadorId: captadorId ? Number(captadorId) : undefined });
  });
  add('POST', /^\/api\/metas$/, async (req) => {
    const corpo = await lerCorpoJson(req);
    return definirMeta(db, {
      captadorId: Number(corpo.captadorId),
      mesReferencia: corpo.mesReferencia,
      valorMeta: Number(corpo.valorMeta),
    });
  });
  add('GET', /^\/api\/metas\/padrao$/, () => ({ valor: obterMetaPadrao(db) }));
  add('PUT', /^\/api\/metas\/padrao$/, async (req) => {
    const corpo = await lerCorpoJson(req);
    definirMetaPadrao(db, Number(corpo.valor));
    return { valor: obterMetaPadrao(db) };
  });

  add('GET', /^\/api\/config\/bonus-adimplencia-valor$/, () => ({
    valor: obterConfigNumero(db, 'bonus_adimplencia_valor', VALOR_BONUS_ADIMPLENCIA_PADRAO),
  }));
  add('PUT', /^\/api\/config\/bonus-adimplencia-valor$/, async (req) => {
    const corpo = await lerCorpoJson(req);
    if (!(Number(corpo.valor) >= 0)) throw new HttpError(400, 'valor deve ser >= 0');
    return { valor: Number(definirConfig(db, 'bonus_adimplencia_valor', Number(corpo.valor))) };
  });
  add('GET', /^\/api\/config\/premiacao-percentual$/, () => ({
    valor: obterConfigNumero(db, 'premiacao_percentual', PERCENTUAL_PREMIACAO_PADRAO),
  }));
  add('PUT', /^\/api\/config\/premiacao-percentual$/, async (req) => {
    const corpo = await lerCorpoJson(req);
    if (!(Number(corpo.valor) >= 0)) throw new HttpError(400, 'valor deve ser >= 0');
    return { valor: Number(definirConfig(db, 'premiacao_percentual', Number(corpo.valor))) };
  });

  add('GET', /^\/api\/faixas$/, () => listarFaixas(db));
  add('PUT', /^\/api\/faixas$/, async (req) => substituirFaixas(db, await lerCorpoJson(req)));

  add('GET', /^\/api\/doadores$/, (req) => {
    const { searchParams } = new URL(req.url, 'http://localhost');
    const captadorId = searchParams.get('captadorId');
    return listarDoadores(db, { captadorId: captadorId ? Number(captadorId) : undefined });
  });
  add('POST', /^\/api\/doadores$/, async (req) => {
    const corpo = await lerCorpoJson(req);
    return criarDoador(db, { captadorId: Number(corpo.captadorId), nome: corpo.nome, cota: corpo.cota ?? null });
  });
  add('POST', /^\/api\/doadores\/(\d+)\/pagamentos$/, (req, res, [id]) => confirmarPagamento(db, Number(id)));
  add('POST', /^\/api\/doadores\/(\d+)\/renovacoes$/, async (req, res, [id]) => {
    const corpo = await lerCorpoJson(req);
    return registrarRenovacao(db, { doadorId: Number(id), data: corpo.data, cota: corpo.cota });
  });

  add('GET', /^\/api\/bonus-adimplencia$/, (req) => {
    const { searchParams } = new URL(req.url, 'http://localhost');
    const captadorId = searchParams.get('captadorId');
    return listarBonusAdimplencia(db, { captadorId: captadorId ? Number(captadorId) : undefined });
  });
  add('GET', /^\/api\/renovacoes$/, (req) => {
    const { searchParams } = new URL(req.url, 'http://localhost');
    const captadorId = searchParams.get('captadorId');
    return listarRenovacoes(db, { captadorId: captadorId ? Number(captadorId) : undefined });
  });
  add('GET', /^\/api\/bonus-renovacao-config$/, () => listarBonusRenovacaoConfig(db));
  add('PUT', /^\/api\/bonus-renovacao-config$/, async (req) => {
    const corpo = await lerCorpoJson(req);
    return definirBonusRenovacaoConfig(db, corpo.cota, Number(corpo.valor));
  });

  add('GET', /^\/api\/lancamentos$/, (req) => {
    const { searchParams } = new URL(req.url, 'http://localhost');
    const captadorId = searchParams.get('captadorId');
    return listarLancamentos(db, {
      captadorId: captadorId ? Number(captadorId) : undefined,
      tipo: searchParams.get('tipo') || undefined,
      mesReferencia: searchParams.get('mes') || undefined,
    });
  });
  add('POST', /^\/api\/lancamentos$/, async (req) => {
    const corpo = await lerCorpoJson(req);
    return criarLancamento(db, {
      captadorId: Number(corpo.captadorId),
      tipo: corpo.tipo,
      valorTotal: Number(corpo.valorTotal),
      mesReferencia: corpo.mesReferencia,
      doadorId: corpo.doadorId ? Number(corpo.doadorId) : null,
      descricao: corpo.descricao ?? null,
    });
  });
  add('GET', /^\/api\/lancamentos\/(\d+)$/, (req, res, [id]) => {
    const lancamento = obterLancamentoComProvisoes(db, Number(id));
    if (!lancamento) throw new HttpError(404, `Lançamento ${id} não encontrado`);
    return lancamento;
  });
  add('POST', /^\/api\/lancamentos\/(\d+)\/cancelar-futuras$/, async (req, res, [id]) => {
    const corpo = await lerCorpoJson(req);
    return cancelarProvisoesFuturas(db, Number(id), corpo.apartirDoMes);
  });

  add('GET', /^\/api\/comissoes$/, (req) => {
    const { searchParams } = new URL(req.url, 'http://localhost');
    const mes = searchParams.get('mes') || mesAtual();
    return calcularComissaoTodosCaptadoresMes(db, mes);
  });
  add('GET', /^\/api\/comissoes\/(\d+)$/, (req, res, [id]) => {
    const { searchParams } = new URL(req.url, 'http://localhost');
    const mes = searchParams.get('mes') || mesAtual();
    return calcularComissaoCaptadorMes(db, Number(id), mes);
  });

  add('GET', /^\/api\/premiacoes$/, () => listarPremiacoes(db));
  add('GET', /^\/api\/premiacoes\/(\d+)$/, (req, res, [ano]) => {
    const premiacao = obterPremiacao(db, Number(ano));
    if (!premiacao) throw new HttpError(404, `Premiação de ${ano} não encontrada`);
    return premiacao;
  });
  add('POST', /^\/api\/premiacoes$/, async (req) => {
    const corpo = await lerCorpoJson(req);
    return calcularESalvarPremiacao(db, corpo);
  });
  add('POST', /^\/api\/premiacoes\/(\d+)\/aprovar$/, (req, res, [ano]) => aprovarPremiacao(db, Number(ano)));

  return rotas;
}

export function criarServidor(db) {
  const rotas = criarRotas(db);

  return http.createServer(async (req, res) => {
    const urlPath = req.url.split('?')[0];

    if (!urlPath.startsWith('/api/')) {
      return servirArquivoEstatico(req, res);
    }

    const rota = rotas.find((r) => r.metodo === req.method && r.padrao.test(urlPath));
    if (!rota) {
      return enviarJson(res, 404, { erro: `Rota não encontrada: ${req.method} ${urlPath}` });
    }

    try {
      const params = rota.padrao.exec(urlPath).slice(1);
      const resultado = await rota.manipulador(req, res, params);
      enviarJson(res, 200, resultado ?? {});
    } catch (err) {
      if (err instanceof HttpError) {
        enviarJson(res, err.status, { erro: err.message });
      } else {
        // Erros de validação lançados pelas camadas de cálculo/repo (Error genérico)
        // viram 400 com a mensagem já descritiva; não há necessidade de logar
        // como se fosse uma falha inesperada do servidor.
        enviarJson(res, 400, { erro: err.message || 'Erro inesperado' });
      }
    }
  });
}
