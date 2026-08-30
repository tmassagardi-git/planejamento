# Contratos & Repasses — Everest / Jungers

Aplicativo para controlar os contratos da parceria entre **Everest** e **Jungers**, os
pagamentos mensais faturados por cada empresa e os repasses devidos entre elas, incluindo
reembolsos e o balanço mensal.

Os dados iniciais foram importados da planilha histórica `Everest e Jungers — Repasses
mensais.xlsx` (2021-2029) e ficam salvos localmente no navegador (`localStorage`) a partir daí —
todas as edições feitas no app (novos contratos, lançamentos mensais, reembolsos) persistem só
neste navegador/dispositivo, sem backend.

## Rodando localmente

```bash
npm install
npm run dev
```

## Páginas

- **Dashboard** — KPIs (faturamento, repasses trocados, contratos ativos, reembolsos),
  gráfico comparativo de valor de contrato recebido por empresa ao longo do tempo (líquido de
  reembolsos), repasses trocados entre as empresas, saldo em aberto, ticket médio por empresa e
  próximos vencimentos.
- **Contratos** — cadastro (CRUD) dos contratos, com empresa responsável, vigência, cláusula de
  reajuste, despesas de deslocamento e situação (ativo/encerrado).
- **Repasses & Planilha** — visão em formato de planilha (idêntica à estrutura da planilha
  original: contratos x meses, com o repasse devido logo abaixo de cada valor bruto, totais e
  saldo), editável célula a célula.
- **Reembolsos** — lançamentos de reembolsos por empresa/mês (não entram no cálculo de repasse).
- **Configurações** — percentual padrão de repasse e alíquotas de imposto usadas para sugerir o
  repasse de novos lançamentos, e opção de restaurar os dados originais da planilha.

## Stack

Vite + React + TypeScript + Tailwind CSS v4 + Recharts + React Router, sem backend (estado em
`localStorage`).
