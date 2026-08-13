# KairOS — Integração Telemarketing (ApiSTI)

Cliente de integração com a API de Telemarketing da plataforma de doações
(ApiSTI), para alimentar os painéis de resultado do KairOS (geral e por
operadora). Ver detalhes da API em [`docs/api-sti.md`](docs/api-sti.md).

> Este repositório também contém, em [`crm/`](crm/README.md), um CRM de
> prospecção e fechamento de empresas doadoras (funil de vendas, doações e
> dashboard), que roda offline no navegador. Ver [`crm/README.md`](crm/README.md).

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

Com o schema já confirmado, a ideia é levar esta lógica de integração para o
Lovable (KairOS), tipicamente como uma edge function que sincroniza os dados
para uma tabela (Supabase) usada pelos painéis de:

1. **Visão geral** — resultados consolidados de todos os clientes/operações.
2. **Análise por operadora** — mesmos dados filtráveis pelo campo `operador`
   (código da operadora/telefonista, confirmado no schema real).

Esses painéis serão tratados em uma etapa seguinte.
