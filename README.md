# KairOS — Integração Telemarketing (ApiSTI)

Cliente de integração com a API de Telemarketing da plataforma de doações
(ApiSTI), para alimentar os painéis de resultado do KairOS (geral e por
operadora). Ver detalhes da API em [`docs/api-sti.md`](docs/api-sti.md).

## Status atual

- [x] Cliente HTTP com paginação automática (`src/apiClient.js`)
- [x] Testes unitários com API mockada (`test/apiClient.test.js`)
- [x] Scripts de inspeção e busca (`scripts/inspect.js`, `scripts/fetch-client.js`)
- [ ] **Teste real contra a API pendente** — o ambiente onde este código foi
      escrito não tem acesso de rede ao domínio `tele.ongrentavel.com.br`
      (bloqueado pela política de egress do sandbox). Ver "Rodando o teste
      real" abaixo.
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

## Rodando o teste real

Assim que houver acesso de rede ao domínio da API (neste ambiente, liberando o
domínio na política de egress, ou rodando localmente/em outro ambiente):

```bash
# 1. Inspecionar a resposta bruta (confirma o schema real dos campos)
npm run inspect -- --cliente=HCL --inicio=2026-07-01 --fim=2026-07-31

# 2. Buscar todos os registros do período (pagina automaticamente) e salvar em output/
npm run fetch -- --cliente=HCL --inicio=2026-07-01 --fim=2026-07-31
```

O passo 1 é o que valida se a documentação enviada bate com o comportamento
real da API. Se os nomes de campo vierem diferentes do esperado, ajuste
`DATA_KEY_CANDIDATES` / `TOTAL_PAGES_KEY_CANDIDATES` no topo de
`src/apiClient.js` (veja o aviso em `docs/api-sti.md`).

## Testes

```bash
npm test
```

Os testes usam um `fetch` mockado (sem chamar a API real) para validar:
montagem da URL, tratamento de erros HTTP/JSON, loop de paginação até o total
de páginas informado, trava de segurança (`maxPages`) e retry em erro 5xx.

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
  api-sti.md     # referência da API e pendências de confirmação
config/
  clients.example.json  # modelo (sem tokens reais)
output/
  <cliente>_<inicio>_<fim>.json  # resultado das buscas (gitignored)
```

## Próximos passos

Depois de confirmar o schema real com o teste acima, a ideia é levar esta
lógica de integração para o Lovable (KairOS), tipicamente como uma edge
function que sincroniza os dados para uma tabela (Supabase) usada pelos
painéis de:

1. **Visão geral** — resultados consolidados de todos os clientes/operações.
2. **Análise por operadora** — mesmos dados filtráveis por operadora/telefonista.

Esses painéis serão tratados em uma etapa seguinte, após validar a integração
aqui.
