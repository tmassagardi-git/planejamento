/**
 * Lógica de agregação para o painel KairOS, construída sobre os "bancos"
 * confirmados da ApiSTI (ver docs/api-sti.md): a consulta paginada de
 * doações e os recursos de dashboard (previsto, recebido, fichasNovas,
 * turmaOperador, dia, ...).
 *
 * Decisões de design (documentadas aqui porque a API não define isso
 * explicitamente):
 *   - Sem filtro de operadora: os cards e o gráfico mês a mês usam os
 *     recursos oficiais de dashboard (rápidos, um valor agregado por
 *     chamada). `previsto` não tem um recurso equivalente a `dia` para
 *     granularidade diária/mensal, então o gráfico mensal de previsto é
 *     montado com uma chamada a `recurso=previsto` por mês do período
 *     selecionado (por isso o limite de MAX_MONTH_SLICES meses).
 *   - Com filtro de operadora: nenhum recurso de dashboard aceita
 *     `operador`, então previsto/realizado são derivados diretamente da
 *     consulta de doações (que aceita `operador` como filtro server-side —
 *     a API já reduz o volume antes de paginar). `fichasNovas` não tem
 *     equivalente derivável dos campos de doações, então fica marcado como
 *     indisponível quando há filtro de operadora.
 *   - O filtro "tipo de data" (vencimento x pagamento/baixa) decide qual
 *     campo de data da consulta de doações é usado quando há filtro de
 *     operadora (e na lista de doadores). Os recursos de dashboard
 *     (previsto/recebido/dia/fichasNovas) usam seu próprio critério interno
 *     de data, não documentado publicamente pela STI.
 */
import { fetchDashboardResource, fetchAllRecords, fetchPage, REQUIRED_LIMITE } from './apiClient.js';

export const MAX_MONTH_SLICES = 24;
const MAX_DASHBOARD_RANGE_DAYS = 366;

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function primeiraLinha(json) {
  const dados = json?.dados;
  if (Array.isArray(dados)) return dados[0] ?? {};
  return dados ?? {};
}

function formatDate(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function parseDate(str) {
  const date = new Date(`${str}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Data inválida: "${str}" (use o formato AAAA-MM-DD).`);
  }
  return date;
}

/**
 * Divide um período em fatias mensais (clipadas ao período), cada uma com
 * `{ key: 'AAAA-MM', ini: 'AAAA-MM-DD', fim: 'AAAA-MM-DD' }`.
 */
export function monthSlices(dataIniStr, dataFimStr) {
  const dataIni = parseDate(dataIniStr);
  const dataFim = parseDate(dataFimStr);
  if (dataIni > dataFim) {
    throw new Error('Período inválido: a data inicial deve ser anterior ou igual à data final.');
  }

  const slices = [];
  let cursor = new Date(Date.UTC(dataIni.getUTCFullYear(), dataIni.getUTCMonth(), 1));
  while (cursor <= dataFim) {
    const ano = cursor.getUTCFullYear();
    const mes = cursor.getUTCMonth();
    const inicioMes = new Date(Date.UTC(ano, mes, 1));
    const fimMes = new Date(Date.UTC(ano, mes + 1, 0));
    const ini = inicioMes > dataIni ? inicioMes : dataIni;
    const fim = fimMes < dataFim ? fimMes : dataFim;
    slices.push({ key: `${ano}-${String(mes + 1).padStart(2, '0')}`, ini: formatDate(ini), fim: formatDate(fim) });
    cursor = new Date(Date.UTC(ano, mes + 1, 1));
  }
  return slices;
}

/**
 * Divide um período em fatias de no máximo `maxDays` dias (para respeitar o
 * limite de 366 dias por chamada dos recursos de dashboard).
 */
export function chunkRangeByMaxDays(dataIniStr, dataFimStr, maxDays = MAX_DASHBOARD_RANGE_DAYS) {
  const chunks = [];
  let ini = dataIniStr;
  for (;;) {
    const iniDate = parseDate(ini);
    const fimTotal = parseDate(dataFimStr);
    const diasRestantes = Math.round((fimTotal - iniDate) / 86400000);
    if (diasRestantes <= maxDays) {
      chunks.push({ ini, fim: dataFimStr });
      break;
    }
    const fimChunk = new Date(iniDate);
    fimChunk.setUTCDate(fimChunk.getUTCDate() + maxDays);
    const proximoIni = new Date(fimChunk);
    proximoIni.setUTCDate(proximoIni.getUTCDate() + 1);
    chunks.push({ ini, fim: formatDate(fimChunk) });
    ini = formatDate(proximoIni);
  }
  return chunks;
}

function assertLimiteMeses(meses, contexto) {
  if (meses.length > MAX_MONTH_SLICES) {
    throw new Error(
      `Período muito longo para "${contexto}" (máximo ${MAX_MONTH_SLICES} meses, selecionado: ${meses.length}). Reduza o intervalo.`
    );
  }
}

/**
 * Lista de operadoras (deduplicadas por código) com totais de realizado no
 * período, para popular o filtro por operadora.
 */
export async function getOperadoras({ apiOptions, dataIni, dataFim }) {
  const json = await fetchDashboardResource({ ...apiOptions, recurso: 'turmaOperador', dataIni, dataFim });
  const porOperador = new Map();
  for (const row of json.dados ?? []) {
    const chave = row.operador;
    const atual = porOperador.get(chave) ?? {
      operador: row.operador,
      nome: row.nome_operador,
      valorRecebido: 0,
      contribuintes: 0,
    };
    atual.valorRecebido += toNumber(row.valor_recebido);
    atual.contribuintes += toNumber(row.contribuintes);
    porOperador.set(chave, atual);
  }
  return [...porOperador.values()].sort((a, b) => b.valorRecebido - a.valorRecebido);
}

// A consulta de doações filtrada por operadora ainda pode ter dezenas de
// páginas (1000 registros/página); buscar sequencialmente com pausa entre
// páginas (comportamento padrão de fetchAllRecords, pensado para exports em
// lote) levaria a UI a esperar mais de um minuto. Concorrência moderada e
// sem pausa artificial equilibra responsividade da UI com não sobrecarregar
// a API da STI (que não parece dimensionada para alta concorrência — testes
// reais mostraram respostas mais lentas/timeouts com concorrência muito alta
// somada às chamadas em paralelo do resumo/série mensal/fichas novas).
const CONCURRENCY_CONSULTA_OPERADORA = 4;

// Cache curtíssimo (evita duplicar a mesma busca paginada quando /api/resumo
// e /api/serie-mensal são chamados quase ao mesmo tempo pelo front-end com o
// período exatamente igual — comum quando o período selecionado é um único
// mês). Não é um cache de dados "de verdade": só existe para deduplicar
// chamadas concorrentes/quase-simultâneas dentro da mesma janela de alguns
// segundos.
const CACHE_TTL_MS = 20000;
const cacheSomaDoacoes = new Map();

function chaveCacheSomaDoacoes({ apiOptions, dataIni, dataFim, tipoData, operador }) {
  return [apiOptions.codigoCliente, dataIni, dataFim, tipoData, operador ?? ''].join('|');
}

function somaDoacoesComCache(args) {
  const chave = chaveCacheSomaDoacoes(args);
  const emCache = cacheSomaDoacoes.get(chave);
  if (emCache && Date.now() - emCache.timestamp < CACHE_TTL_MS) {
    return emCache.promise;
  }
  const promise = somaDoacoes(args);
  cacheSomaDoacoes.set(chave, { timestamp: Date.now(), promise });
  promise.catch(() => cacheSomaDoacoes.delete(chave));
  return promise;
}

async function somaDoacoes({ apiOptions, dataIni, dataFim, tipoData, operador }) {
  const options = {
    baseUrl: apiOptions.baseUrl,
    token: apiOptions.token,
    codigoCliente: apiOptions.codigoCliente,
    fetchImpl: apiOptions.fetchImpl,
    delayMs: 0,
    concurrency: CONCURRENCY_CONSULTA_OPERADORA,
    filtros: operador ? { operador } : undefined,
  };
  if (tipoData === 'pagamento') {
    options.filtros = { ...(options.filtros ?? {}), pagamento_ini: dataIni, pagamento_fim: dataFim };
  } else {
    options.vencimentoIni = dataIni;
    options.vencimentoFim = dataFim;
  }

  const { records } = await fetchAllRecords(options);

  let previstoValor = 0;
  let realizadoValor = 0;
  let realizadoQtd = 0;
  for (const registro of records) {
    previstoValor += toNumber(registro.valor_previsto);
    const pago = toNumber(registro.valor_pago);
    if (pago > 0) {
      realizadoValor += pago;
      realizadoQtd += 1;
    }
  }
  return { previstoValor, previstoQtd: records.length, realizadoValor, realizadoQtd };
}

/**
 * Resumo do período: previsto, realizado (valor + quantidade) e fichas
 * novas. Quando `operador` é informado, fichas novas fica indisponível
 * (ver nota de design no topo do arquivo).
 */
export async function getResumo({ apiOptions, dataIni, dataFim, tipoData = 'vencimento', operador }) {
  if (!operador) {
    const [previsto, recebido, fichasNovas] = await Promise.all([
      fetchDashboardResource({ ...apiOptions, recurso: 'previsto', dataIni, dataFim }),
      fetchDashboardResource({ ...apiOptions, recurso: 'recebido', dataIni, dataFim }),
      fetchDashboardResource({ ...apiOptions, recurso: 'fichasNovas', dataIni, dataFim }),
    ]);
    const p = primeiraLinha(previsto);
    const r = primeiraLinha(recebido);
    const f = primeiraLinha(fichasNovas);
    return {
      previstoValor: toNumber(p.valor_previsto),
      previstoQtd: toNumber(p.contribuintes),
      realizadoValor: toNumber(r.valor_recebido),
      realizadoQtd: toNumber(r.contribuintes),
      fichasNovasQtd: toNumber(f.fichas_novas),
      fichasNovasValor: toNumber(f.valor_recebido),
      fichasNovasDisponivel: true,
    };
  }

  const totais = await somaDoacoesComCache({ apiOptions, dataIni, dataFim, tipoData, operador });
  return { ...totais, fichasNovasQtd: null, fichasNovasValor: null, fichasNovasDisponivel: false };
}

async function getRealizadoDiario({ apiOptions, dataIni, dataFim }) {
  const chunks = chunkRangeByMaxDays(dataIni, dataFim, MAX_DASHBOARD_RANGE_DAYS);
  const resultados = await Promise.all(
    chunks.map((c) => fetchDashboardResource({ ...apiOptions, recurso: 'dia', dataIni: c.ini, dataFim: c.fim }))
  );
  return resultados.flatMap((json) => json.dados ?? []);
}

function agruparRealizadoPorMes(diasDados) {
  const mapa = new Map();
  for (const dia of diasDados) {
    const mes = String(dia.data).slice(0, 7);
    const atual = mapa.get(mes) ?? { valor: 0, qtd: 0 };
    atual.valor += toNumber(dia.valor_recebido);
    atual.qtd += toNumber(dia.quantidade_paga);
    mapa.set(mes, atual);
  }
  return mapa;
}

/**
 * Série mensal { mes, previstoValor, previstoQtd, realizadoValor, realizadoQtd }
 * para o gráfico de linha previsto x realizado.
 */
export async function getSerieMensalPrevistoRealizado({ apiOptions, dataIni, dataFim, tipoData = 'vencimento', operador }) {
  const meses = monthSlices(dataIni, dataFim);
  assertLimiteMeses(meses, 'o gráfico mês a mês de previsto x realizado');

  if (operador) {
    return Promise.all(
      meses.map(async (m) => {
        const totais = await somaDoacoesComCache({ apiOptions, dataIni: m.ini, dataFim: m.fim, tipoData, operador });
        return { mes: m.key, ...totais };
      })
    );
  }

  const [previstoPorMes, diasDados] = await Promise.all([
    Promise.all(
      meses.map(async (m) => {
        const json = await fetchDashboardResource({ ...apiOptions, recurso: 'previsto', dataIni: m.ini, dataFim: m.fim });
        const p = primeiraLinha(json);
        return { mes: m.key, previstoValor: toNumber(p.valor_previsto), previstoQtd: toNumber(p.contribuintes) };
      })
    ),
    getRealizadoDiario({ apiOptions, dataIni, dataFim }),
  ]);

  const realizadoPorMes = agruparRealizadoPorMes(diasDados);
  const previstoPorChave = new Map(previstoPorMes.map((p) => [p.mes, p]));

  return meses.map((m) => ({
    mes: m.key,
    previstoValor: previstoPorChave.get(m.key)?.previstoValor ?? 0,
    previstoQtd: previstoPorChave.get(m.key)?.previstoQtd ?? 0,
    realizadoValor: realizadoPorMes.get(m.key)?.valor ?? 0,
    realizadoQtd: realizadoPorMes.get(m.key)?.qtd ?? 0,
  }));
}

/**
 * Série mensal de fichas novas { mes, fichasNovas, valorRecebido }. Não
 * disponível filtrada por operadora (a API não aceita esse filtro no
 * recurso `fichasNovas`).
 */
export async function getFichasNovasSerieMensal({ apiOptions, dataIni, dataFim }) {
  const meses = monthSlices(dataIni, dataFim);
  assertLimiteMeses(meses, 'o gráfico de fichas novas');

  return Promise.all(
    meses.map(async (m) => {
      const json = await fetchDashboardResource({ ...apiOptions, recurso: 'fichasNovas', dataIni: m.ini, dataFim: m.fim });
      const f = primeiraLinha(json);
      return { mes: m.key, fichasNovas: toNumber(f.fichas_novas), valorRecebido: toNumber(f.valor_recebido) };
    })
  );
}

// Campos expostos pela API do painel para a lista de doadores. Deliberadamente
// omite CPF, telefone, e-mail e endereço (PII sensível) — quem precisar do
// registro completo usa `npm run fetch`/`npm run sample`, que gravam em
// output/ (gitignorado).
const CAMPOS_DOADOR_PAINEL = [
  'contribuinte',
  'nome',
  'operador',
  'operadorfixo',
  'tpdoac',
  'vencimento',
  'valor_previsto',
  'pagamento',
  'valor_pago',
  'status_doacao',
];

function projetarDoador(registro) {
  const projetado = {};
  for (const campo of CAMPOS_DOADOR_PAINEL) projetado[campo] = registro[campo];
  return projetado;
}

/**
 * Página da lista de doadores/doações (consulta de doações paginada,
 * repassando os mesmos filtros do painel). A resposta só inclui os campos
 * não sensíveis usados pela tabela do painel (ver CAMPOS_DOADOR_PAINEL).
 */
export async function getDoadores({ apiOptions, dataIni, dataFim, tipoData = 'vencimento', operador, pagina = 1 }) {
  const options = {
    baseUrl: apiOptions.baseUrl,
    token: apiOptions.token,
    codigoCliente: apiOptions.codigoCliente,
    fetchImpl: apiOptions.fetchImpl,
    pagina,
    limite: REQUIRED_LIMITE,
    filtros: operador ? { operador } : undefined,
  };
  if (tipoData === 'pagamento') {
    options.filtros = { ...(options.filtros ?? {}), pagamento_ini: dataIni, pagamento_fim: dataFim };
  } else {
    options.vencimentoIni = dataIni;
    options.vencimentoFim = dataFim;
  }

  const resultado = await fetchPage(options);
  return {
    registros: resultado.records.map(projetarDoador),
    pagina: resultado.currentPage ?? pagina,
    totalPaginas: resultado.totalPages ?? 1,
    totalRegistros: resultado.totalRecords ?? resultado.records.length,
  };
}
