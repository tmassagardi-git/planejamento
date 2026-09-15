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
- [x] **Painel web** (`src/server.js` + `public/`, `npm run dashboard`) — filtros
      (período, tipo de data, operadora, valor/quantidade), resumo previsto x
      realizado + fichas novas, gráfico de linha mês a mês, gráfico de fichas
      novas e lista de doadores/doações paginada. Testado em navegador real
      contra a API (cliente HCL, julho/2026).

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

## Painel (dashboard)

```bash
npm run dashboard
# ou numa porta específica:
PORT=4000 npm run dashboard
```

Abre um servidor local (`http://localhost:3000`, sem dependências externas —
`http` nativo do Node servindo `public/` + uma API fina em `/api/*`) com:

- Filtros: período (data de vencimento ou pagamento/baixa), operadora,
  exibição em valor (R$) ou quantidade.
- Cards de resumo: previsto, realizado e fichas novas (valor + quantidade).
- Gráfico de linha previsto x realizado, mês a mês, no período selecionado.
- Gráfico de fichas novas, mês a mês.
- Lista paginada de doadores e suas doações (nome, operadora, vencimento,
  valor previsto, pagamento, valor pago, status — **sem** CPF/telefone/e-mail/
  endereço; para o registro completo use `npm run fetch`/`npm run sample`).

Detalhes de design (por que previsto/realizado mudam de fonte quando há
filtro de operadora, limites de período, etc.) estão comentados no topo de
`src/dashboardService.js` e na seção "Recursos de dashboard" de
[`docs/api-sti.md`](docs/api-sti.md), que também documenta a latência da API
da STI sob carga.

O Chart.js usado pelos gráficos está vendorizado em `public/vendor/` (baixado
via npm, não via CDN) para o painel funcionar mesmo em redes que bloqueiam
CDNs externos — ver `public/vendor/NOTICE.md`.

## Testes

```bash
npm test
```

Os testes usam um `fetch` mockado (sem chamar a API real) para validar:
montagem da URL, tratamento de erros HTTP/JSON/negócio (`status:false`), loop
de paginação até o total de páginas informado (sequencial e concorrente),
trava de segurança (`maxPages`), exigência de `limite=1000`, retry em erro
5xx, os recursos de dashboard, e toda a lógica de agregação do painel
(`dashboardService.js`: divisão em meses/fatias de dias, resumo com/sem
operadora, séries mensais, projeção de campos não sensíveis na lista de
doadores).

## Estrutura

```
src/
  apiClient.js        # cliente HTTP + paginação + parsing tolerante a schema
  dashboardService.js # agregações do painel sobre apiClient.js (resumo, séries, doadores)
  server.js           # servidor HTTP do painel (API fina + estático de public/)
  config.js           # carrega .env e config/clients.json
  cliArgs.js          # parser simples de flags --chave=valor
public/
  index.html, app.js, styles.css # front-end do painel
  vendor/chart.umd.js  # Chart.js vendorizado (ver vendor/NOTICE.md)
scripts/
  inspect.js     # imprime a resposta bruta da API (para confirmar schema)
  fetch-client.js# busca todas as páginas de um cliente/período e salva em output/
  sample-databases.js # busca até 100 linhas de cada "banco" (doações + recursos de dashboard)
test/
  apiClient.test.js
  dashboardService.test.js
docs/
  api-sti.md     # referência da API: schema confirmado, campos e regras
config/
  clients.example.json  # modelo (sem tokens reais)
output/
  <cliente>_<inicio>_<fim>.json  # resultado das buscas (gitignored)
```

## Próximos passos

- Sincronização periódica para uma tabela no Supabase, para o painel ler
  dados já agregados em vez de chamar a API a cada acesso (reduziria a
  exposição à latência/instabilidade da API da STI sob carga, ver
  [`docs/api-sti.md`](docs/api-sti.md)).
- Autenticação/controle de acesso no painel, caso ele saia de uso interno
  restrito para um público maior.
- Suporte a múltiplos clientes (`?cliente=`) na UI, hoje fixo em HCL — o
  back-end (`src/server.js`/`dashboardService.js`) já é agnóstico de cliente.
