#!/usr/bin/env node
/**
 * Servidor do painel KairOS: expõe uma API HTTP fina sobre dashboardService.js
 * (que por sua vez usa apiClient.js contra a ApiSTI real) e serve o front-end
 * estático em public/. Sem dependências externas (http nativo do Node),
 * mantendo o padrão de zero-deps do resto do projeto.
 *
 * Uso:
 *   npm run dashboard
 *   PORT=4000 npm run dashboard
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config, resolveClientToken } from './config.js';
import {
  getOperadoras,
  getResumo,
  getSerieMensalPrevistoRealizado,
  getFichasNovasSerieMensal,
  getDoadores,
} from './dashboardService.js';
import { ApiStiError } from './apiClient.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const PORT = Number(process.env.PORT) || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function apiOptionsFor(codigoCliente) {
  return { baseUrl: config.apiBaseUrl, token: resolveClientToken(codigoCliente), codigoCliente };
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

function requireParams(query, nomes) {
  const faltando = nomes.filter((nome) => !query.get(nome));
  if (faltando.length) {
    throw new ApiStiError(`Parâmetros obrigatórios ausentes: ${faltando.join(', ')}`);
  }
}

async function handleApi(res, url) {
  const query = url.searchParams;
  try {
    requireParams(query, ['cliente']);
    const codigoCliente = query.get('cliente');
    const apiOptions = apiOptionsFor(codigoCliente);
    const dataIni = query.get('dataIni');
    const dataFim = query.get('dataFim');
    const tipoData = query.get('tipoData') || 'vencimento';
    const operador = query.get('operador') || undefined;

    if (url.pathname === '/api/operadoras') {
      requireParams(query, ['dataIni', 'dataFim']);
      return sendJson(res, 200, await getOperadoras({ apiOptions, dataIni, dataFim }));
    }

    if (url.pathname === '/api/resumo') {
      requireParams(query, ['dataIni', 'dataFim']);
      return sendJson(res, 200, await getResumo({ apiOptions, dataIni, dataFim, tipoData, operador }));
    }

    if (url.pathname === '/api/serie-mensal') {
      requireParams(query, ['dataIni', 'dataFim']);
      return sendJson(res, 200, await getSerieMensalPrevistoRealizado({ apiOptions, dataIni, dataFim, tipoData, operador }));
    }

    if (url.pathname === '/api/fichas-novas-serie') {
      requireParams(query, ['dataIni', 'dataFim']);
      return sendJson(res, 200, await getFichasNovasSerieMensal({ apiOptions, dataIni, dataFim }));
    }

    if (url.pathname === '/api/doadores') {
      requireParams(query, ['dataIni', 'dataFim']);
      const pagina = Number(query.get('pagina')) || 1;
      return sendJson(res, 200, await getDoadores({ apiOptions, dataIni, dataFim, tipoData, operador, pagina }));
    }

    return sendJson(res, 404, { erro: 'Rota de API não encontrada.' });
  } catch (err) {
    const status = err instanceof ApiStiError ? (err.status && err.status < 500 ? err.status : 502) : 400;
    return sendJson(res, status, { erro: err.message });
  }
}

function serveStatic(res, pathname) {
  const semQueryString = pathname.split('?')[0];
  const caminhoRelativo = semQueryString === '/' ? 'index.html' : semQueryString.replace(/^\/+/, '');
  const filePath = path.normalize(path.join(PUBLIC_DIR, caminhoRelativo));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Não encontrado');
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith('/api/')) {
    handleApi(res, url);
  } else {
    serveStatic(res, url.pathname);
  }
});

server.listen(PORT, () => {
  console.log(`Painel KairOS (ApiSTI) rodando em http://localhost:${PORT}`);
});
