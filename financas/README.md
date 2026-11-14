# Finanças pessoais

Sistema de controle de despesas e receitas: lançamentos com data da compra e
data do pagamento (fatura do cartão no dia 10), categoria, estabelecimento,
tipo de pagamento, parcelas futuras em aberto, recorrentes e painel com filtros.

- `index.html` — a página do sistema, publicada como artefato privado no
  claude.ai. Os lançamentos ficam no banco de dados do artefato, não neste
  repositório.
- `build_data.py` — converte a planilha de extrato e faturas nos documentos
  que alimentam o banco (`lanc/base-NN`, `cad/estabelecimentos`,
  `cad/categorias`). Gere a saída sempre fora do repositório.

```bash
python3 build_data.py planilha.xlsx /caminho/fora/do/repo/seed
```

## Modelo de dados

Cada documento da coleção `lanc` guarda um mapa `itens` de lançamentos:
`tipo` (entrada/saida), `dataCompra`, `dataPagamento`, `estabelecimento`,
`descricao`, `categoria`, `valor`, `meio`, `conta`, `parcela`, `grupoParcela`,
`status` (pago/aberto), `recorrente`, `interno` (transferências entre contas
próprias, pagamento da fatura já detalhada, aplicações) e `excluido`.
