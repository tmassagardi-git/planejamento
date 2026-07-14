#!/usr/bin/env node
/**
 * Chama a API UMA vez (página 1) e também com uma página "estourada" (conforme
 * a documentação), e imprime a estrutura bruta da resposta — sem tentar
 * interpretar nada. Use isto assim que houver acesso de rede para confirmar o
 * schema real antes de confiar no parser de src/apiClient.js.
 *
 * Uso:
 *   npm run inspect -- --cliente=HCL --inicio=2026-07-01 --fim=2026-07-31
 */
import { config, resolveClientToken } from '../src/config.js';
import { buildQueryUrl } from '../src/apiClient.js';
import { parseArgs } from '../src/cliArgs.js';

const args = parseArgs(process.argv.slice(2));

const codigoCliente = args.cliente;
if (!codigoCliente) {
  console.error('Uso: npm run inspect -- --cliente=HCL --inicio=2026-07-01 --fim=2026-07-31');
  process.exit(1);
}

const vencimentoIni = args.inicio;
const vencimentoFim = args.fim;
// A API exige limite=1000 exato (qualquer outro valor retorna HTTP 400).
const limite = 1000;
const token = args.token || resolveClientToken(codigoCliente);

async function callAndPrint(label, pagina) {
  const url = buildQueryUrl(config.apiBaseUrl, {
    codigo_cliente: codigoCliente,
    token,
    vencimento_ini: vencimentoIni,
    vencimento_fim: vencimentoFim,
    pagina,
    limite,
  });

  console.log(`\n=== ${label} (pagina=${pagina}) ===`);
  console.log(`GET ${url.replace(token, '***TOKEN***')}`);

  const response = await fetch(url);
  const text = await response.text();
  console.log(`HTTP ${response.status}`);

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    console.log('Corpo não é JSON válido. Primeiros 500 caracteres:');
    console.log(text.slice(0, 500));
    return;
  }

  console.log('Chaves de topo:', Array.isArray(json) ? '(resposta é um array)' : Object.keys(json));
  console.log(JSON.stringify(json, null, 2).slice(0, 4000));
}

await callAndPrint('Página normal', 1);
await callAndPrint('Página estourada (para achar total de páginas)', 99999);

console.log(
  '\nCompare as chaves acima com DATA_KEY_CANDIDATES / TOTAL_PAGES_KEY_CANDIDATES em src/apiClient.js e ajuste se necessário.'
);
