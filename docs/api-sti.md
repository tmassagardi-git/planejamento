# API ApiSTI — Telemarketing / Doações

Referência interna da API fornecida pela plataforma de telemarketing (ScriptCase),
usada para alimentar os painéis do KairOS.

## Endpoints

- Documentação: `https://tele.ongrentavel.com.br/scriptcase/app/ApiSTI/api_saude/`
- Produção: `https://tele.ongrentavel.com.br/scriptcase/app/ApiSTI/blank/`

## Autenticação e escopo

- Cada chamada exige `codigo_cliente` + token ativo.
- **Forma recomendada pela doc oficial**: enviar o token no header `X-API-Token: SEU_TOKEN`
  (também aceito: `Authorization: Bearer SEU_TOKEN`). O parâmetro `token` na URL
  continua funcionando (é o que usamos hoje, e o que os exemplos abaixo mostram por
  simplicidade), mas a própria doc avisa que **pode aparecer em históricos e logs de
  proxy** — preferir header em qualquer integração nova.
- Clientes têm **acessos individuais** — nem todo token necessariamente serve para
  todo `codigo_cliente`. Por isso os tokens são armazenados por cliente em
  `config/clients.json` (fora do git — veja `config/clients.example.json`).
- Health check do banco do cliente (não revela servidor/usuário/senha do Firebird):
  `GET /scriptcase/app/ApiSTI/api_saude/?formato=json&codigo_cliente=HCL` (com header/token).
- Erros: `400` parâmetro ausente/inválido, `401` cliente/token/validade inválidos,
  `500` falha na consulta, `503` autenticação central ou banco do cliente indisponível.
  Toda resposta de erro traz um `request_id` para rastreio.

## Parâmetros de consulta

| Parâmetro        | Exemplo               | Descrição                                  |
|-------------------|------------------------|---------------------------------------------|
| `codigo_cliente`  | `HCL`                  | Código do cliente                            |
| `token`           | `72f9cf2d...`          | Token de acesso do cliente (ou via header, ver acima) |
| `recurso`         | `dashboard`            | Recurso consultado (ver seção abaixo) — omitido, o default é a listagem paginada de doações |
| `pagina`          | `1`                    | Página atual (1-based), inteiro > 0 — só na listagem de doações |
| `limite`          | `1000`                 | Registros por página — deve ser **exatamente 1000**, só na listagem de doações |
| `vencimento_ini`/`vencimento_fim` | `2026-07-01`/`2026-07-31` | Período de vencimento — listagem de doações |
| `pagamento_ini`/`pagamento_fim`   | `2026-07-01`/`2026-07-31` | Período de pagamento/baixa — **também disponível na listagem de doações** (descoberto via doc oficial em 2026-09-15; não é exclusivo do `recurso=dashboard`) |
| `data_ini`/`data_fim` | `2026-07-01`/`2026-07-31` | Período (intervalo máx. **366 dias**) — obrigatório nos recursos de `dashboard` (ver abaixo) |
| `contribuinte`, `nossonum`, `tipodoador`, `genero`, `tpdoac`, `status_doacao`, `operador`, `operadorfixo` | — | Filtros opcionais adicionais da listagem de doações (documentados oficialmente, ainda não usados neste cliente/no KairOS) |

Datas sempre em `AAAA-MM-DD`, enviadas como intervalo completo.

Exemplo (busca vencimentos de julho/2026 do cliente HCL):

```
https://tele.ongrentavel.com.br/scriptcase/app/ApiSTI/blank/?codigo_cliente=HCL&token=SEU_TOKEN&vencimento_ini=2026-07-01&vencimento_fim=2026-07-31&pagina=1&limite=1000
```

## Outros recursos (`recurso=...`)

Documentados oficialmente em `/scriptcase/app/ApiSTI/api_saude/` e confirmados com
dados reais do HCL (agosto/2026). Todos exigem `data_ini`/`data_fim` (máx. 366 dias),
não usam paginação, e refletem **data de pagamento/baixa** (não vencimento):

| `recurso=` | Retorno (campos) | Exemplo real (HCL, ago/2026) |
|---|---|---|
| `dashboard` | Executa todos os recursos abaixo numa única chamada, uma conexão Firebird | — |
| `previsto` | `{valor_previsto, contribuintes}` | `R$ 1.928.177,90` / 49.752 contribuintes |
| `recebido` | `{valor_recebido, contribuintes}` | `R$ 1.377.423,75` / 34.354 contribuintes |
| `fichasNovas` | `{fichas_novas, valor_recebido}` | 257 fichas / `R$ 9.766,00` |
| `fichasRec` | `{fichas_recuperadas, valor_recebido}` | 84 fichas / `R$ 3.853,00` |
| `turmaOperador` | lista: `{turma, operador, nome_operador, valor_recebido, contribuintes}` | 70 operadores no mês |
| `tipoPagamento` | lista: `{tipo_pagamento, valor_recebido, contribuintes}` | 4 tipos (Boleto, Copel, Pay&Go, …) |
| `dia` | lista: `{data, valor_recebido, quantidade_paga, contribuintes}` | 31 linhas (uma por dia do período) |
| `mensageiroResumo` | `{mensageiros, valor_recebido}` | `{0, R$ 0,00}` — HCL não usa mensageiros |
| `operadoresAtivos` | `{operadores_ativos, valor_recebido}` | 48 operadores ativos |
| `mensageirosAtivos` | `{mensageiros_ativos, valor_recebido}` | `{0, R$ 0,00}` |

`recurso=dashboard` está **em produção desde 2026-09-14** (KairOS/Lovable,
`tlm-dashboard-sync.server.ts`), sincronizado mês a mês para as tabelas `tlm_dash_*`.
Ver `.lovable/plan/integração-api-hcl-usar-os-endpoints-de-totais-dashboard-2026-09-14.md`
no projeto Lovable para o plano completo. Os demais sub-recursos (`turmaOperador`,
`tipoPagamento`, `dia`, etc.) já vêm embutidos na resposta de `dashboard` — chamá-los
individualmente só é útil para depuração ou para buscar um único bloco mais rápido.

Exemplo (recebido em julho/2026, cliente HCL):

```
https://tele.ongrentavel.com.br/scriptcase/app/ApiSTI/blank/?codigo_cliente=HCL&token=SEU_TOKEN&data_ini=2026-07-01&data_fim=2026-07-31&recurso=recebido
```

⚠️ **Cuidado ao comparar `previsto` com relatórios do próprio sistema do cliente**:
confirmado em produção (2026-09-15, HCL, janeiro/2026) que o `previsto` de
`recurso=dashboard` (títulos com vencimento no período, pagos + em aberto, contando
**contribuintes** distintos) não bate com a coluna "emitido" do relatório 481 do
cliente, que aparentemente conta **títulos/boletos** (não doadores) e usa um recorte
diferente. O valor `recebido`/pago bateu exatamente entre as duas fontes; só previsto
e as quantidades de doadores/títulos divergem. Antes de exibir "previsto" num painel,
confirmar com o cliente qual definição eles esperam.

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

## Ambiente e rede

Ao rodar os scripts Node deste projeto num ambiente com proxy de saída
obrigatório (ex.: Claude Code on the web / Cowork), o `fetch` nativo do Node
18-22 **não lê `HTTPS_PROXY`/`HTTP_PROXY` por padrão**. Se `npm run inspect`
ou `npm run fetch` falharem com `403 Host not in allowlist` mesmo com a rede
liberada (mas um `curl` direto funcionar), rode com
`NODE_USE_ENV_PROXY=1` (Node ≥ 22.21):

```bash
NODE_USE_ENV_PROXY=1 npm run fetch -- --cliente=HCL --inicio=2026-07-01 --fim=2026-07-31
```

Isso não deve ser necessário fora desse tipo de ambiente sandboxed.

## Próximos passos (fora do escopo desta primeira entrega)

- Painel geral (visão consolidada) e painel com filtro por operadora — a
  implementar no KairOS (Lovable), depois que o schema real dos registros for
  confirmado.
- Possível sincronização periódica para uma tabela no Supabase, para os
  painéis lerem dados já agregados em vez de chamar a API a cada acesso.
