# API ApiSTI — Telemarketing / Doações

Referência interna da API fornecida pela plataforma de telemarketing (ScriptCase),
usada para alimentar os painéis do KairOS.

## Endpoints

- Documentação: `https://tele.ongrentavel.com.br/scriptcase/app/ApiSTI/api_saude/`
- Produção: `https://tele.ongrentavel.com.br/scriptcase/app/ApiSTI/blank/`

## Autenticação e escopo

- Cada chamada exige `codigo_cliente` + `token`.
- Clientes têm **acessos individuais** — nem todo token necessariamente serve para
  todo `codigo_cliente`. Por isso os tokens são armazenados por cliente em
  `config/clients.json` (fora do git — veja `config/clients.example.json`).

## Parâmetros de consulta

| Parâmetro        | Exemplo               | Descrição                                  |
|-------------------|------------------------|---------------------------------------------|
| `codigo_cliente`  | `HCL`                  | Código do cliente                            |
| `token`           | `72f9cf2d...`          | Token de acesso do cliente                   |
| `vencimento_ini`  | `2026-07-01`           | Início do período de vencimento              |
| `vencimento_fim`  | `2026-07-31`           | Fim do período de vencimento                 |
| `pagina`          | `1`                    | Página atual (1-based)                       |
| `limite`          | `1000`                 | Registros por página                         |

Exemplo (busca vencimentos de julho/2026 do cliente HCL):

```
https://tele.ongrentavel.com.br/scriptcase/app/ApiSTI/blank/?codigo_cliente=HCL&token=SEU_TOKEN&vencimento_ini=2026-07-01&vencimento_fim=2026-07-31&pagina=1&limite=1000
```

## Paginação

A busca é paginada. Para descobrir o total de páginas, a própria documentação
orienta repetir a mesma chamada com uma página "estourada" (ex.: `pagina=99999`);
a resposta traz o total de páginas disponível junto com os dados. Na prática,
isso indica que **toda resposta** (não só a primeira) inclui a metainformação de
paginação — por isso `fetchAllRecords` lê o total de páginas já na primeira
chamada (`pagina=1`) e seque buscando `pagina=2..total`.

## ⚠️ Schema da resposta — pendente de confirmação

Este projeto foi construído **sem acesso de rede ao domínio da API** no ambiente
de build (bloqueado pela política de egress do sandbox). Por isso:

- `src/apiClient.js` tenta reconhecer automaticamente os nomes de campo mais
  comuns para a lista de registros (`dados`, `data`, `registros`, ...) e para o
  total de páginas (`total_paginas`, `totalPages`, ...).
- **Assim que houver acesso à API** (rede liberada neste ambiente, ou execução
  local/em outro ambiente com acesso), rode:

  ```bash
  npm run inspect -- --cliente=HCL --inicio=2026-07-01 --fim=2026-07-31
  ```

  Isso imprime a resposta bruta (chaves de topo + JSON). Confirme:
  1. o nome exato do campo com a lista de registros;
  2. o nome exato do campo com o total de páginas;
  3. os nomes dos campos de cada registro (valor, data de vencimento, operador/
     operadora, status, etc.) — necessários para os futuros filtros por operadora.

  Se os nomes reais não baterem com os candidatos em `DATA_KEY_CANDIDATES` /
  `TOTAL_PAGES_KEY_CANDIDATES` (topo de `src/apiClient.js`), adicione-os à lista
  (ou fixe o nome direto, é mais simples).

## Próximos passos (fora do escopo desta primeira entrega)

- Painel geral (visão consolidada) e painel com filtro por operadora — a
  implementar no KairOS (Lovable), depois que o schema real dos registros for
  confirmado.
- Possível sincronização periódica para uma tabela no Supabase, para os
  painéis lerem dados já agregados em vez de chamar a API a cada acesso.
