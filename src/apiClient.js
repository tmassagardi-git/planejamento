/**
 * Cliente para a API de Telemarketing (ApiSTI) da plataforma de doações.
 *
 * Documentação (fornecida pelo cliente da API):
 *   - Docs:    https://tele.ongrentavel.com.br/scriptcase/app/ApiSTI/api_saude/
 *   - Produção: https://tele.ongrentavel.com.br/scriptcase/app/ApiSTI/blank/
 *
 * IMPORTANTE — schema ainda não confirmado contra uma resposta real (ambiente de
 * build sem acesso à rede externa no momento em que este código foi escrito).
 * Os nomes de campo abaixo (DATA_KEY_CANDIDATES / TOTAL_PAGES_KEY_CANDIDATES) são
 * tentativas cobrindo os padrões mais comuns. Assim que uma resposta real estiver
 * disponível (rode `npm run inspect`), confirme os nomes exatos e, se precisar,
 * fixe-os diretamente em vez de depender da detecção automática.
 */

const DATA_KEY_CANDIDATES = ['dados', 'data', 'registros', 'resultado', 'resultados', 'itens', 'rows'];
const TOTAL_PAGES_KEY_CANDIDATES = [
  'total_paginas',
  'totalPaginas',
  'total_pages',
  'totalPages',
  'qtd_paginas',
  'paginas_total',
  'num_paginas',
];
const CURRENT_PAGE_KEY_CANDIDATES = ['pagina', 'page', 'pagina_atual', 'currentPage'];
const TOTAL_RECORDS_KEY_CANDIDATES = ['total_registros', 'totalRegistros', 'total', 'total_rows', 'count'];

export class ApiStiError extends Error {
  constructor(message, { status, body, cause } = {}) {
    super(message);
    this.name = 'ApiStiError';
    this.status = status;
    this.body = body;
    if (cause) this.cause = cause;
  }
}

export function buildQueryUrl(baseUrl, params) {
  const url = new URL(baseUrl);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

function pickFirstArray(json, candidates) {
  if (Array.isArray(json)) return json;
  if (json && typeof json === 'object') {
    for (const key of candidates) {
      if (Array.isArray(json[key])) return json[key];
    }
  }
  return null;
}

function pickFirstNumber(json, candidates) {
  if (!json || typeof json !== 'object') return null;
  for (const key of candidates) {
    if (json[key] !== undefined && json[key] !== null) {
      const n = Number(json[key]);
      if (!Number.isNaN(n)) return n;
    }
  }
  return null;
}

/**
 * Extrai { records, totalPages, currentPage, totalRecords, schemaKnown } de uma
 * resposta bruta da API, tolerando variações de nome de campo.
 */
export function parseApiResponse(json) {
  const records = pickFirstArray(json, DATA_KEY_CANDIDATES);
  const totalPages = pickFirstNumber(json, TOTAL_PAGES_KEY_CANDIDATES);
  const currentPage = pickFirstNumber(json, CURRENT_PAGE_KEY_CANDIDATES);
  const totalRecords = pickFirstNumber(json, TOTAL_RECORDS_KEY_CANDIDATES);

  return {
    records: records ?? [],
    totalPages,
    currentPage,
    totalRecords,
    // Se não achamos nem um array de registros nem um total de páginas, o schema
    // assumido provavelmente não bate com a resposta real — sinalizamos isso em
    // vez de mascarar com dados vazios.
    schemaKnown: records !== null || totalPages !== null,
    raw: json,
  };
}

async function requestPageRaw({
  baseUrl,
  token,
  codigoCliente,
  vencimentoIni,
  vencimentoFim,
  pagina,
  limite,
  fetchImpl = fetch,
  timeoutMs = 20000,
}) {
  const url = buildQueryUrl(baseUrl, {
    codigo_cliente: codigoCliente,
    token,
    vencimento_ini: vencimentoIni,
    vencimento_fim: vencimentoFim,
    pagina,
    limite,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetchImpl(url, { signal: controller.signal });
  } catch (err) {
    throw new ApiStiError(`Falha de rede ao chamar a API: ${err.message}`, { cause: err });
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();

  if (!response.ok) {
    throw new ApiStiError(`API respondeu HTTP ${response.status} para pagina=${pagina}`, {
      status: response.status,
      body: text,
    });
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new ApiStiError(
      `Resposta da API não é um JSON válido (pagina=${pagina}). Verifique token/codigo_cliente/parâmetros.`,
      { body: text }
    );
  }

  return json;
}

/**
 * Busca uma única página e já retorna no formato normalizado.
 */
export async function fetchPage(options) {
  const json = await requestPageRaw(options);
  return parseApiResponse(json);
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(fn, { retries = 3, baseDelayMs = 500 } = {}) {
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      const isRetryable = err instanceof ApiStiError && (!err.status || err.status >= 500);
      attempt += 1;
      if (!isRetryable || attempt > retries) throw err;
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }
}

/**
 * Busca TODAS as páginas para um cliente/período, seguindo o comportamento
 * documentado: a primeira chamada informa o total de páginas, e as demais
 * são buscadas sequencialmente até cobrir esse total.
 *
 * @param {object} options
 * @param {string} options.baseUrl
 * @param {string} options.token
 * @param {string} options.codigoCliente
 * @param {string} options.vencimentoIni
 * @param {string} options.vencimentoFim
 * @param {number} [options.limite=1000]
 * @param {number} [options.maxPages=500] - trava de segurança contra loop infinito
 * @param {number} [options.delayMs=150] - pausa entre páginas para não sobrecarregar a API
 * @param {(info: object) => void} [options.onPage] - callback de progresso
 */
export async function fetchAllRecords({
  baseUrl,
  token,
  codigoCliente,
  vencimentoIni,
  vencimentoFim,
  limite = 1000,
  maxPages = 500,
  delayMs = 150,
  fetchImpl,
  onPage,
}) {
  const requestOptions = { baseUrl, token, codigoCliente, vencimentoIni, vencimentoFim, limite, fetchImpl };

  const firstPage = await withRetry(() => fetchPage({ ...requestOptions, pagina: 1 }));

  if (!firstPage.schemaKnown) {
    throw new ApiStiError(
      'Não foi possível reconhecer o formato da resposta da API (nem lista de registros nem total de páginas ' +
        'foram encontrados nas chaves esperadas). Rode `npm run inspect` e ajuste DATA_KEY_CANDIDATES / ' +
        'TOTAL_PAGES_KEY_CANDIDATES em src/apiClient.js com os nomes reais.',
      { body: JSON.stringify(firstPage.raw) }
    );
  }

  const allRecords = [...firstPage.records];
  const totalPages = firstPage.totalPages ?? 1;
  onPage?.({ pagina: 1, totalPages, registrosNaPagina: firstPage.records.length, acumulado: allRecords.length });

  const pagesToFetch = Math.min(totalPages, maxPages);
  if (totalPages > maxPages) {
    onPage?.({
      aviso: `total_paginas (${totalPages}) excede maxPages (${maxPages}); buscando só as primeiras ${maxPages} páginas.`,
    });
  }

  for (let pagina = 2; pagina <= pagesToFetch; pagina += 1) {
    if (delayMs > 0) await sleep(delayMs);
    const page = await withRetry(() => fetchPage({ ...requestOptions, pagina }));
    allRecords.push(...page.records);
    onPage?.({ pagina, totalPages, registrosNaPagina: page.records.length, acumulado: allRecords.length });
  }

  return {
    records: allRecords,
    totalPages,
    pagesFetched: pagesToFetch,
    totalRecords: firstPage.totalRecords ?? allRecords.length,
  };
}
