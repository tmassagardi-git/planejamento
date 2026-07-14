#!/usr/bin/env node
/**
 * Busca TODOS os registros de um cliente num período (paginando automaticamente)
 * e salva o resultado agregado em output/<cliente>_<inicio>_<fim>.json
 *
 * Uso:
 *   npm run fetch -- --cliente=HCL --inicio=2026-07-01 --fim=2026-07-31
 */
import fs from 'node:fs';
import path from 'node:path';
import { config, resolveClientToken } from '../src/config.js';
import { fetchAllRecords } from '../src/apiClient.js';
import { parseArgs } from '../src/cliArgs.js';

const args = parseArgs(process.argv.slice(2));

const codigoCliente = args.cliente;
const vencimentoIni = args.inicio;
const vencimentoFim = args.fim;

if (!codigoCliente || !vencimentoIni || !vencimentoFim) {
  console.error(
    'Uso: npm run fetch -- --cliente=HCL --inicio=2026-07-01 --fim=2026-07-31 [--limite=1000] [--out=output/arquivo.json]'
  );
  process.exit(1);
}

const token = args.token || resolveClientToken(codigoCliente);
const limite = Number(args.limite) || config.defaultLimite;

console.log(`Buscando registros de ${codigoCliente} entre ${vencimentoIni} e ${vencimentoFim} (limite=${limite}/pagina)...`);

const startedAt = Date.now();

const result = await fetchAllRecords({
  baseUrl: config.apiBaseUrl,
  token,
  codigoCliente,
  vencimentoIni,
  vencimentoFim,
  limite,
  onPage: (info) => {
    if (info.aviso) {
      console.warn(`Aviso: ${info.aviso}`);
      return;
    }
    console.log(`  página ${info.pagina}/${info.totalPages} — ${info.registrosNaPagina} registros (acumulado: ${info.acumulado})`);
  },
});

const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);

console.log(
  `\nConcluído em ${elapsedSec}s: ${result.records.length} registros em ${result.pagesFetched} páginas ` +
    `(total_paginas informado pela API: ${result.totalPages}).`
);

const outPath = args.out || path.join('output', `${codigoCliente}_${vencimentoIni}_${vencimentoFim}.json`);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(
  outPath,
  JSON.stringify(
    {
      codigoCliente,
      vencimentoIni,
      vencimentoFim,
      totalRegistros: result.records.length,
      totalPaginas: result.totalPages,
      geradoEm: new Date().toISOString(),
      registros: result.records,
    },
    null,
    2
  )
);

console.log(`Salvo em ${outPath}`);

if (result.records[0]) {
  console.log('\nCampos do primeiro registro (para conferência do schema):');
  console.log(Object.keys(result.records[0]));
}
