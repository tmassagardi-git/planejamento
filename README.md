# Planejamento — Integração Telemarketing (ApiSTI) e Controle de Comissão

Este repositório reúne dois módulos independentes:

1. **Integração Telemarketing (ApiSTI)** — cliente de integração com a API de
   Telemarketing da plataforma de doações, para alimentar os painéis de
   resultado do KairOS (geral e por operadora). Ver detalhes da API em
   [`docs/api-sti.md`](docs/api-sti.md).
2. **Controle de Comissão — Projeto Empresa Amiga** — sistema (API + painéis
   web) que implementa a política de incentivo mensal por resultado descrita
   em [`docs/comissao-empresa-amiga.md`](docs/comissao-empresa-amiga.md),
   incluindo o provisionamento de 12 meses de patrocínios/editais/projetos
   incentivados e das doações recorrentes do Empresa Amiga. Rode com
   `npm run comissao` e acesse `/metas.html` e `/lancamentos.html`.

## Status atual

- [x] Cliente HTTP com paginação automática (`src/apiClient.js`)
- [x] Testes unitários com API mockada (`test/apiClient.test.js`, 12 testes)
- [x] Scripts de inspeção e busca (`scripts/inspect.js`, `scripts/fetch-client.js`)
- [x] **Teste real contra a API confirmado** (2026-07-14, cliente HCL,
      julho/2026): 3 páginas reais buscadas e agregadas corretamente,
      schema de resposta validado. Ver [`docs/api-sti.md`](docs/api-sti.md)
      para os detalhes do schema confirmado.
- [ ] Painéis (visão geral / filtro por operadora) — próxima etapa, no Lovable

## Instalação

Requer **Node.js >= 22** (o Controle de Comissão usa `node:sqlite`, nativo do
Node, sem dependências externas).

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
```

Se rodar num ambiente sandboxed com proxy de saída obrigatório e receber
`403 Host not in allowlist` mesmo com a rede liberada, veja a nota sobre
`NODE_USE_ENV_PROXY=1` em `docs/api-sti.md` (o `fetch` nativo do Node não lê
`HTTPS_PROXY` por padrão).

## Controle de Comissão — Projeto Empresa Amiga

```bash
npm run comissao                    # sobe em http://localhost:3000
npm run comissao -- --porta=4000    # porta customizada
```

Abra `/metas.html` (metas, faixas de incentivo e config de bônus) e
`/lancamentos.html` (lançar doações e ver a comissão calculada do mês). O
banco (SQLite, `data/comissao.db`) é criado automaticamente e fica fora do
git. Detalhes completos da política, do modelo de dados e das regras de
cálculo — incluindo uma divergência sinalizada no exemplo numérico do
documento original — em
[`docs/comissao-empresa-amiga.md`](docs/comissao-empresa-amiga.md).

## Testes

```bash
npm test
```

Cobre os dois módulos: os testes de `apiClient.test.js` usam um `fetch`
mockado (sem chamar a API real) para validar montagem da URL, tratamento de
erros HTTP/JSON/negócio (`status:false`), paginação, trava de segurança
(`maxPages`), exigência de `limite=1000` e retry em erro 5xx. Os testes de
`calc.test.js`, `repo.test.js` e `server.test.js` cobrem o motor de cálculo
de comissão, a camada de dados (SQLite em memória) e a API REST ponta a
ponta.

## Estrutura

```
src/
  apiClient.js       # cliente HTTP da ApiSTI + paginação + parsing tolerante a schema
  config.js          # carrega .env e config/clients.json
  cliArgs.js         # parser simples de flags --chave=valor
  db.js              # schema SQLite do controle de comissão (node:sqlite) + seeds
  calc/              # funções puras de cálculo de comissão (ver docs/comissao-empresa-amiga.md)
  repo/              # acesso a dados sobre o SQLite
  server.js          # API REST + arquivos estáticos do controle de comissão
public/              # painéis do controle de comissão (HTML/CSS/JS vanilla)
scripts/
  inspect.js         # imprime a resposta bruta da ApiSTI (para confirmar schema)
  fetch-client.js    # busca todas as páginas de um cliente/período e salva em output/
  serve.js           # sobe o servidor do controle de comissão (npm run comissao)
test/
  apiClient.test.js
  calc.test.js, repo.test.js, server.test.js
docs/
  api-sti.md                     # referência da API: schema confirmado, campos e regras
  comissao-empresa-amiga.md      # política, modelo de dados e regras de cálculo da comissão
config/
  clients.example.json  # modelo (sem tokens reais)
output/
  <cliente>_<inicio>_<fim>.json  # resultado das buscas da ApiSTI (gitignored)
data/
  comissao.db            # banco SQLite do controle de comissão (gitignored)
```

## Próximos passos

Com o schema já confirmado, a ideia é levar esta lógica de integração para o
Lovable (KairOS), tipicamente como uma edge function que sincroniza os dados
para uma tabela (Supabase) usada pelos painéis de:

1. **Visão geral** — resultados consolidados de todos os clientes/operações.
2. **Análise por operadora** — mesmos dados filtráveis pelo campo `operador`
   (código da operadora/telefonista, confirmado no schema real).

Esses painéis serão tratados em uma etapa seguinte.
