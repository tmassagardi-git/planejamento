#!/usr/bin/env node
/**
 * Busca uma amostra de até 100 linhas (todos os campos) de cada "banco de
 * dados" exposto pela API ApiSTI para um cliente/período:
 *   - doacoes:      consulta paginada de doações (sem `recurso`)
 *   - previsto, recebido, fichasNovas, fichasRec, turmaOperador,
 *     mensageiroResumo, tipoPagamento, dia, operadoresAtivos,
 *     mensageirosAtivos: recursos de dashboard (`recurso=<nome>`)
 *
 * Salva cada amostra em output/amostra_<cliente>_<recurso>.json e imprime um
 * resumo (campos + contagem) no console.
 *
 * Uso:
 *   npm run sample -- --cliente=HCL --inicio=2026-07-01 --fim=2026-07-31
 */
import fs from 'node:fs';
import path from 'node:path';
import { config, resolveClientToken } from '../src/config.js';
import { fetchPage, fetchDashboardResource, DASHBOARD_RESOURCES, REQUIRED_LIMITE } from '../src/apiClient.js';
import { parseArgs } from '../src/cliArgs.js';

const args = parseArgs(process.argv.slice(2));

const codigoCliente = args.cliente;
const dataIni = args.inicio;
const dataFim = args.fim;
const amostraTamanho = args.amostra ? Number(args.amostra) : 100;

if (!codigoCliente || !dataIni || !dataFim) {
  console.error(
    'Uso: npm run sample -- --cliente=HCL --inicio=2026-07-01 --fim=2026-07-31 [--amostra=100]'
  );
  process.exit(1);
}

const token = args.token || resolveClientToken(codigoCliente);
const outDir = 'output';
fs.mkdirSync(outDir, { recursive: true });

function salvar(nomeBanco, payload) {
  const outPath = path.join(outDir, `amostra_${codigoCliente}_${nomeBanco}.json`);
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  return outPath;
}

function resumoCampos(registros) {
  if (!registros.length) return [];
  return Object.keys(registros[0]);
}

const resumoGeral = [];

console.log(`\n=== banco: doacoes (consulta paginada, vencimento ${dataIni}..${dataFim}) ===`);
const pagina = await fetchPage({
  baseUrl: config.apiBaseUrl,
  token,
  codigoCliente,
  vencimentoIni: dataIni,
  vencimentoFim: dataFim,
  pagina: 1,
  limite: REQUIRED_LIMITE,
});
const amostraDoacoes = pagina.records.slice(0, amostraTamanho);
const outDoacoes = salvar('doacoes', {
  banco: 'doacoes',
  codigoCliente,
  periodo: { vencimento_ini: dataIni, vencimento_fim: dataFim },
  totalRegistrosNoPeriodo: pagina.totalRecords,
  totalPaginas: pagina.totalPages,
  amostraLinhas: amostraDoacoes.length,
  campos: resumoCampos(amostraDoacoes),
  dados: amostraDoacoes,
});
console.log(`  total no período: ${pagina.totalRecords} | páginas: ${pagina.totalPages}`);
console.log(`  amostra salva (${amostraDoacoes.length} linhas): ${outDoacoes}`);
console.log(`  campos: ${resumoCampos(amostraDoacoes).join(', ')}`);
resumoGeral.push({ banco: 'doacoes', linhas: amostraDoacoes.length, campos: resumoCampos(amostraDoacoes) });

for (const recurso of DASHBOARD_RESOURCES) {
  console.log(`\n=== banco: ${recurso} (recurso de dashboard, ${dataIni}..${dataFim}) ===`);
  try {
    const json = await fetchDashboardResource({
      baseUrl: config.apiBaseUrl,
      token,
      codigoCliente,
      recurso,
      dataIni,
      dataFim,
    });
    const dados = Array.isArray(json.dados) ? json.dados : json.dados ? [json.dados] : [];
    const amostra = dados.slice(0, amostraTamanho);
    const outPath = salvar(recurso, {
      banco: recurso,
      codigoCliente,
      periodo: json.periodo ?? { data_ini: dataIni, data_fim: dataFim },
      totalRegistros: json.total ?? dados.length,
      amostraLinhas: amostra.length,
      campos: resumoCampos(amostra),
      dados: amostra,
    });
    console.log(`  total: ${json.total ?? dados.length}`);
    console.log(`  amostra salva (${amostra.length} linhas): ${outPath}`);
    console.log(`  campos: ${resumoCampos(amostra).join(', ')}`);
    resumoGeral.push({ banco: recurso, linhas: amostra.length, campos: resumoCampos(amostra) });
  } catch (err) {
    console.error(`  ERRO ao buscar ${recurso}: ${err.message}`);
    resumoGeral.push({ banco: recurso, erro: err.message });
  }
}

console.log('\n=== Resumo geral ===');
console.table(resumoGeral.map((r) => ({ banco: r.banco, linhas: r.linhas ?? '-', campos: r.campos?.length ?? '-', erro: r.erro ?? '' })));
