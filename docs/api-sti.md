# API ApiSTI — Telemarketing / Doações

Referência interna da API fornecida pela plataforma de telemarketing (ScriptCase),
usada para alimentar os painéis do KairOS.

## Autenticação e escopo

- Cada chamada exige `codigo_cliente` + token ativo.
- **Forma recomendada de enviar o token (confirmado na doc real da API,
  2026-09-15):** header `X-API-Token: SEU_TOKEN` (também aceita
  `Authorization: Bearer SEU_TOKEN`). O parâmetro `token` na query string
  continua funcionando "por compatibilidade", mas a própria API alerta que
  ele pode aparecer em históricos e logs de proxy — por isso
  `src/apiClient.js` manda o token **só via header X-API-Token**, nunca na URL.
- Clientes têm **acessos individuais** — nem todo token necessariamente serve para
  todo `codigo_cliente`. Por isso os tokens são armazenados por cliente em
  `config/clients.json` (fora do git — veja `config/clients.example.json`).

## Endpoints

| Endpoint                                                    | Objetivo                                              |
|--------------------------------------------------------------|--------------------------------------------------------|
| `/scriptcase/app/ApiSTI/api_saude/`                          | Documentação e disponibilidade da aplicação            |
| `/scriptcase/app/ApiSTI/api_saude/?formato=json`              | Testa (após auth) o banco Firebird do cliente           |
| `/scriptcase/app/ApiSTI/blank/`                               | API unificada: doações paginadas + recursos de dashboard |
| `/scriptcase/app/ApiSTI/blank/?recurso=dashboard`             | Todas as métricas de dashboard em uma única chamada     |

## Consulta de doações (sem `recurso`) — "banco" de linha por doação

| Parâmetro         | Exemplo               | Descrição                                  |
|--------------------|------------------------|---------------------------------------------|
| `codigo_cliente`  | `HCL`                  | Código do cliente                            |
| `pagina`          | `1`                    | Página atual (1-based)                       |
| `limite`          | `1000`                 | Registros por página — **precisa ser exatamente 1000** |

Filtros opcionais (confirmados na doc real): `contribuinte`, `nossonum`,
`pagamento_ini`, `pagamento_fim`, `vencimento_ini`, `vencimento_fim`,
`tipodoador`, `genero`, `tpdoac`, `status_doacao`, `operador`, `operadorfixo`.
Datas em `AAAA-MM-DD`, sempre como intervalo completo (`*_ini` + `*_fim`).

Exemplo (busca vencimentos de julho/2026 do cliente HCL):

```
https://tele.ongrentavel.com.br/scriptcase/app/ApiSTI/blank/?codigo_cliente=HCL&token=SEU_TOKEN&vencimento_ini=2026-07-01&vencimento_fim=2026-07-31&pagina=1&limite=1000
```

## Paginação

A busca é paginada. Para descobrir o total de páginas, a própria documentação
orienta repetir a mesma chamada com uma página "estourada" (ex.: `pagina=99999`);
a resposta traz o total de páginas disponível junto com os dados. Confirmado
com uma chamada real (2026-07-14, cliente HCL, julho/2026): `pagina=99999` retorna
HTTP 200, `dados: []` e `total_paginas: 57` correto. Ou seja, **toda resposta**
(não só a primeira) inclui a metainformação de paginação — por isso
`fetchAllRecords` lê o total de páginas já na primeira chamada (`pagina=1`) e
segue buscando `pagina=2..total`.

**Regra confirmada:** o parâmetro `limite` precisa ser **exatamente 1000**.
Qualquer outro valor retorna HTTP 400 com `status:false` e
`mensagem:"O parâmetro limite deve ser igual a 1000"`. O cliente
(`src/apiClient.js`) trava isso via a constante `REQUIRED_LIMITE`.

## Schema real confirmado (2026-07-14, cliente HCL)

Resposta de sucesso:

```json
{
  "status": true,
  "mensagem": "Consulta realizada com sucesso",
  "versao_api": "2026-07-13-unificada-v11",
  "request_id": "5cd235b7647de708f3dc4213",
  "recurso": "doacoes",
  "total": 1000,
  "total_registros": 56603,
  "total_paginas": 57,
  "pagina": 1,
  "limite": 1000,
  "faixa_inicio": 1,
  "faixa_fim": 1000,
  "dados": [ { "...": "ver campos do registro abaixo" } ]
}
```

Resposta de erro de negócio (ex.: `limite` inválido) — HTTP 400 e `status:false`:

```json
{ "status": false, "mensagem": "O parâmetro limite deve ser igual a 1000", "dados": [], "total_paginas": 0 }
```

`src/apiClient.js` trata isso lançando `ApiStiError` com a `mensagem` da API.

### Campos de cada registro em `dados[]`

| Campo           | Exemplo                     | Observação                                  |
|------------------|------------------------------|-----------------------------------------------|
| `contribuinte`   | `4`                          | ID do doador                                   |
| `tpdoac`         | `"COPEL"`                    | Tipo/origem da doação                          |
| `nossonum`       | `0`                          |                                                 |
| `vencimento`     | `"2026-07-01 00:00:00"`      | Data de vencimento                             |
| `valor_previsto` | `"20.000000"`                | Valor esperado (string decimal)                |
| `pagamento`      | `"2026-07-01 00:00:00"`      | Data de pagamento                              |
| `valor_pago`     | `"0.000000"`                 | Valor efetivamente pago                        |
| `status_doacao`  | `"PENDENTE"`                 | Status da doação                               |
| `nome`           | `"MATEUS MENOCI GHELERE"`    | Nome do doador (PII)                           |
| `tipodoador`     | `"C"`                        |                                                 |
| `genero`         | `"M"`                        |                                                 |
| `operador`       | `"111"`                      | **Código da operadora/telefonista** — chave para o filtro por operadora dos painéis |
| `operadorfixo`   | `"7"`                        | Operador fixo associado                        |
| `email`          | `"..."`                      | PII                                            |
| `doc`            | `"04382733979"`              | CPF (PII sensível)                             |
| `rua`, `num`, `comp`, `bairro`, `cidade`, `uf`, `cep` | — | Endereço (PII)          |
| `niver`          | `"1983-12-27 00:00:00"`      | Data de nascimento (PII)                       |
| `telefone`, `cel1`, `cel2` | —                   | Telefones (PII)                                |

⚠️ Os registros contêm CPF, telefone, e-mail e endereço de doadores. Tratar
como dado sensível: nunca commitar arquivos de `output/` (já gitignorados),
e no KairOS/Lovable aplicar as mesmas restrições de acesso já usadas para
dados de doadores.

## Recursos de dashboard (`?recurso=<nome>`) — agregados, sem paginação

Exigem `codigo_cliente` + `data_ini` + `data_fim` (intervalo máximo de 366
dias, conforme a doc real da API). Não usam `pagina`/`limite`. `recurso=dashboard`
roda todos de uma vez (mais lento — ~15-20s numa chamada real) e retorna um
objeto único com uma chave por recurso; os individuais respondem em ~1-2s.
`DASHBOARD_RESOURCES` em `src/apiClient.js` lista os 10 nomes válidos.

Schema confirmado com chamadas reais (2026-09-15, cliente HCL, julho/2026):

| Recurso             | Formato de `dados`        | Campos                                                    | Uso pretendido no painel |
|----------------------|----------------------------|-------------------------------------------------------------|----------------------------|
| `previsto`           | objeto (1 linha)           | `valor_previsto`, `contribuintes`                            | Card "previsto" do resumo |
| `recebido`           | objeto (1 linha)           | `valor_recebido`, `contribuintes`                             | Card "realizado" do resumo |
| `fichasNovas`        | objeto (1 linha)           | `fichas_novas`, `valor_recebido`                              | Card/gráfico de fichas novas |
| `fichasRec`          | objeto (1 linha)           | `fichas_recuperadas`, `valor_recebido`                        | Complementar (fichas recuperadas) |
| `turmaOperador`      | array (1 linha/operador)   | `turma`, `operador`, `nome_operador`, `valor_recebido`, `contribuintes` | Filtro por operadora |
| `tipoPagamento`      | array (1 linha/tipo)       | `tipo_pagamento`, `valor_recebido`, `contribuintes`           | Filtro por tipo/forma de pagamento |
| `dia`                | array (1 linha/dia)        | `data`, `valor_recebido`, `quantidade_paga`, `contribuintes`  | Gráfico de linha mês a mês / por período |
| `mensageiroResumo`   | objeto (1 linha)           | `mensageiros`, `valor_recebido`                               | (HCL não usa mensageiros — sempre 0) |
| `operadoresAtivos`   | objeto (1 linha)           | `operadores_ativos`, `valor_recebido`                         | KPI operacional |
| `mensageirosAtivos`  | objeto (1 linha)           | `mensageiros_ativos`, `valor_recebido`                        | (HCL: sempre 0) |

Observações importantes:

- A API **sempre** devolve `dados` como array — para os recursos "objeto (1
  linha)" é um array de 1 item (`dados: [{...}]`), não um objeto solto.
- `recurso=recebido` é o "realizado" — não confundir com o filtro
  `status_doacao` da consulta de doações, que é por registro individual.
- `turmaOperador` **não é filtrável por operador na própria chamada** — vem
  sempre com todos os operadores do período; o filtro por operadora no painel
  deve ser feito no cliente (front-end) sobre esse array, ou usando o campo
  `operador`/`operadorfixo` da consulta de doações para dados linha a linha.
- `dia` só agrega por dia — para "mês a mês" num intervalo maior que um mês,
  o painel deve agrupar os dias retornados por mês no cliente (a API não tem
  um recurso `mes`).
- Exemplo de chamada:
  `?recurso=recebido&codigo_cliente=HCL&data_ini=2026-07-01&data_fim=2026-07-31`
  (com header `X-API-Token`, ou `&token=...` por compatibilidade).

### Amostras reais

`npm run sample -- --cliente=HCL --inicio=2026-07-01 --fim=2026-07-31` busca
até 100 linhas (todos os campos) de cada um dos 11 "bancos" acima (a consulta
de doações + os 10 recursos de dashboard) e salva em
`output/amostra_HCL_<banco>.json` (gitignorado — contém PII de doadores).

## Ambiente e rede

Ao rodar os scripts Node deste projeto num ambiente com proxy de saída
obrigatório (ex.: Claude Code on the web / Cowork), o `fetch` nativo do Node
18-22 **não lê `HTTPS_PROXY`/`HTTP_PROXY` por padrão**. Se `npm run inspect`
ou `npm run fetch` falharem com `403 Host not in allowlist` mesmo com a rede
liberada (mas um `curl` direto funcionar), rode com
`NODE_USE_ENV_PROXY=1` (Node ≥ 22.21):

```bash
NODE_USE_ENV_PROXY=1 npm run fetch -- --cliente=HCL --inicio=2026-07-01 --fim=2026-07-31
NODE_USE_ENV_PROXY=1 npm run sample -- --cliente=HCL --inicio=2026-07-01 --fim=2026-07-31
```

Isso não deve ser necessário fora desse tipo de ambiente sandboxed.

## Próximos passos (fora do escopo desta primeira entrega)

- Painel com filtros (data, operadora, tipo), resumo previsto x realizado,
  gráfico mês a mês e gráfico de fichas novas — a implementar no KairOS
  (Lovable ou front-end dedicado), agora que o schema real de todos os
  recursos (doações + 10 recursos de dashboard) está confirmado.
- Lista de doadores com suas doações: dá para montar diretamente da consulta
  de doações (`nome`, `contribuinte`, `doc` + campos de valor/status por
  registro) — não precisa de um recurso separado.
- Possível sincronização periódica para uma tabela no Supabase, para os
  painéis lerem dados já agregados em vez de chamar a API a cada acesso.
