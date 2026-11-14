# Finanças pessoais

Sistema de controle de despesas e receitas: lançamentos com data da compra e
data do pagamento (fatura do cartão no dia 10), categoria, estabelecimento,
tipo de pagamento, parcelas futuras em aberto, recorrentes e painel com filtros.

- `index.html` — a página do sistema, publicada como artefato privado no
  claude.ai. Os lançamentos ficam no banco de dados do artefato, não neste
  repositório.
- `build_data.py` — converte a planilha do cartão e o extrato do Itaú (.xls) nos documentos
  que alimentam o banco (`lanc/base-NN`, `cad/estabelecimentos`,
  `cad/categorias`). Gere a saída sempre fora do repositório.

```bash
python3 build_data.py cartao.xlsx extrato.xls /caminho/fora/do/repo/seed
```

## Modelo de dados

Cada documento da coleção `lanc` guarda um mapa `itens` de lançamentos:
`tipo` (entrada/saida), `dataCompra`, `dataPagamento`, `estabelecimento`,
`descricao`, `categoria`, `valor`, `meio`, `conta`, `parcela`, `grupoParcela`,
`status` (pago/aberto), `recorrente`, `interno` (transferências entre contas
próprias, pagamento da fatura já detalhada, aplicações) e `excluido`.

## Compras de mercado

A aba "Compras" é independente do financeiro e usa a coleção `mercado`:
`notas-AAAA` guarda as notas fiscais (mercado, data e itens com quantidade e
preço unitário) e `lista` guarda os produtos incluídos à mão e os dispensados.
A foto da nota é lida pelo Claude na própria página; a lista sugere o que repor
nos próximos 20 dias pelo intervalo médio entre as compras de cada produto.
