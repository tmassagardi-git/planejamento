# KairOS — Integração Telemarketing (ApiSTI)

Cliente de integração com a API de Telemarketing da plataforma de doações
(ApiSTI), para alimentar os painéis de resultado do KairOS (geral e por
operadora). Ver detalhes da API em [`docs/api-sti.md`](docs/api-sti.md).

## Status atual

- [x] Cliente HTTP com paginação automática (`src/apiClient.js`)
- [x] Testes unitários com API mockada (`test/apiClient.test.js`, 12 testes)
- [x] Scripts de inspeção e busca (`scripts/inspect.js`, `scripts/fetch-client.js`)
- [x] **Teste real contra a API confirmado** (2026-07-14, cliente HCL,
      julho/2026): 3 páginas reais buscadas e agregadas corretamente,
      schema de resposta validado. Ver [`docs/api-sti.md`](docs/api-sti.md)
      para os detalhes do schema confirmado.
- [x] **Recursos de dashboard confirmados** (2026-09-15, cliente HCL,
      julho/2026): `previsto`, `recebido`, `fichasNovas`, `fichasRec`,
      `turmaOperador`, `mensageiroResumo`, `tipoPagamento`, `dia`,
      `operadoresAtivos`, `mensageirosAtivos` — todos testados contra a API
      real (`src/apiClient.js#fetchDashboardResource`), token agora enviado
      via header `X-API-Token` (recomendado pela doc oficial).
- [x] Script de amostragem (`scripts/sample-databases.js` / `npm run sample`)
      — busca até 100 linhas de cada um dos 11 "bancos" (doações + 10
      recursos de dashboard) para inspeção de schema.
- [ ] Painéis (visão geral / filtro por operadora / gráficos) — próxima etapa

## Instalação

```bash
npm install   # não há dependências externas hoje, mas mantém o fluxo padrão
cp .env.example .env
cp config/clients.example.json config/clients.json
```

Edite `config/clients.json` com o(s) token(s) reais por cliente:

```json
{
  "HCL": { "nome": "Hospital HCL", "token": "SEU_TOKEN_REAL" }
}
```

`config/clients.json` está no `.gitignore` — tokens reais nunca são commitados.
Alternativamente, para um único token global, defina `API_TOKEN` no `.env`.

## Rodando contra a API real

```bash
# 1. Inspecionar a resposta bruta (útil para conferir mudanças de schema no futuro)
npm run inspect -- --cliente=HCL --inicio=2026-07-01 --fim=2026-07-31

# 2. Buscar todos os registros do período (pagina automaticamente) e salvar em output/
npm run fetch -- --cliente=HCL --inicio=2026-07-01 --fim=2026-07-31

# Para limitar a poucas páginas num teste rápido (evita baixar tudo):
npm run fetch -- --cliente=HCL --inicio=2026-07-01 --fim=2026-07-31 --maxPages=3

# 3. Buscar uma amostra (até 100 linhas, todos os campos) de cada um dos 11
#    "bancos" (doações + 10 recursos de dashboard) — útil para conferir schema:
npm run sample -- --cliente=HCL --inicio=2026-07-01 --fim=2026-07-31
```

Se rodar num ambiente sandboxed com proxy de saída obrigatório e receber
`403 Host not in allowlist` mesmo com a rede liberada, veja a nota sobre
`NODE_USE_ENV_PROXY=1` em `docs/api-sti.md` (o `fetch` nativo do Node não lê
`HTTPS_PROXY` por padrão).

## Testes

```bash
npm test
```

Os testes usam um `fetch` mockado (sem chamar a API real) para validar:
montagem da URL, tratamento de erros HTTP/JSON/negócio (`status:false`), loop
de paginação até o total de páginas informado, trava de segurança
(`maxPages`), exigência de `limite=1000` e retry em erro 5xx.

## Estrutura

```
src/
  apiClient.js   # cliente HTTP + paginação + parsing tolerante a schema
  config.js      # carrega .env e config/clients.json
  cliArgs.js     # parser simples de flags --chave=valor
scripts/
  inspect.js     # imprime a resposta bruta da API (para confirmar schema)
  fetch-client.js# busca todas as páginas de um cliente/período e salva em output/
  sample-databases.js # busca até 100 linhas de cada "banco" (doações + recursos de dashboard)
test/
  apiClient.test.js
docs/
  api-sti.md     # referência da API: schema confirmado, campos e regras
config/
  clients.example.json  # modelo (sem tokens reais)
output/
  <cliente>_<inicio>_<fim>.json  # resultado das buscas (gitignored)
```

## Próximos passos

Com o schema de todos os "bancos" já confirmado (doações + 10 recursos de
dashboard, ver [`docs/api-sti.md`](docs/api-sti.md)), a ideia é levar esta
lógica de integração para o KairOS (Lovable ou front-end dedicado) e montar
um painel com:

1. **Filtros no topo** — por período (data de vencimento/baixa), operadora
   (`turmaOperador`/`operador`) e tipo (quantidade x valor).
2. **Resumo** — previsto x realizado (`previsto`/`recebido`), em valor e
   quantidade, + fichas novas (`fichasNovas`).
3. **Gráfico de linha mês a mês** — previsto x realizado no período
   selecionado (base: recurso `dia`, agregado por mês no cliente).
4. **Gráfico de fichas novas** — base: recurso `fichasNovas` por período.
5. **Lista de doadores e suas doações** — dá para montar direto da consulta
   de doações paginada (não precisa de recurso separado).

Possível sincronização periódica para uma tabela no Supabase, para os
painéis lerem dados já agregados em vez de chamar a API a cada acesso.
