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
