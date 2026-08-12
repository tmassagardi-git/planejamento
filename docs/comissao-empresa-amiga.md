# Sistema de Controle de Comissão — Projeto Empresa Amiga

Implementação da "Política de Incentivo Mensal por Resultado — Projeto Empresa
Amiga" (documento original: `Proposta_de_comissao_Projeto_Empresa_Amiga.docx`).

## Como rodar

```bash
npm run comissao            # sobe o servidor em http://localhost:3000
npm run comissao -- --porta=4000   # porta customizada
```

Acesse `/metas.html` (painel de administração de metas, faixas e bônus) e
`/lancamentos.html` (painel de lançamento de doações e acompanhamento da
comissão mensal). O banco de dados é um arquivo SQLite em `data/comissao.db`
(criado automaticamente, fora do git — ver `COMISSAO_DB_PATH` no `.env` para
customizar o caminho).

## Modelo de dados e regras implementadas

### Metas
Cada **captador(a)** tem sua própria meta mensal (a política fala em "a
captadora", no singular — confirmado com o usuário que a meta e a comissão
são individuais, não da equipe como um todo). A meta de um mês específico
pode ser definida via painel; se não houver, vale a meta específica mais
recente anterior àquele mês; se nunca houver nenhuma, vale a meta padrão
global (R$3.000,00 conforme o documento).

### Faixas de incentivo (alíquota por % de atingimento da meta)

| Atingimento | Alíquota |
|---|---|
| Até 49% | 0% (sem incentivo) |
| 50% a 79% | 3% |
| 80% a 99% | 4% |
| 100% ou mais | 7% |

Editável no painel de Metas.

### Provisionamento de 12 meses (o "crédito futuro")

Dois tipos de lançamento, duas regras diferentes:

- **Empresa Amiga** (doação mensal recorrente): o valor **mensal** lançado se
  repete, sem dividir, no mês atual + 11 meses seguintes (12 parcelas iguais).
  Reflete o pedido do usuário: "lançar 1 valor e já entrar na provisão para
  os demais meses [...] já entra nos próximos 11 meses além do mês atual
  (primeira parcela)", já que o ciclo de doação é mensal.
- **Patrocínio, Edital, Projeto incentivado** (captação pontual): o **valor
  total** lançado é **dividido por 12** e entra como crédito no mês atual +
  11 meses seguintes, 1/12 avos por mês — conforme a política: "o valor a
  ser calculado das linhas de patrocínio, editais e projetos incentivados
  será dividido por 12, as 11 parcelas restantes entram como crédito para os
  meses seguintes".

A divisão por 12 nunca perde centavos: o resto da divisão é distribuído nas
primeiras parcelas (1 centavo a mais cada), então a soma das 12 parcelas
sempre fecha exatamente com o valor total lançado.

Se um doador cancelar ou um patrocínio não se repetir, o painel permite
interromper o crédito futuro a partir de um mês (endpoint
`POST /api/lancamentos/:id/cancelar-futuras`), preservando o histórico das
parcelas já passadas.

### Cálculo da comissão mensal

1. **% de atingimento** = novos fechamentos de Empresa Amiga **naquele mês**
   (1ª parcela dos lançamentos do tipo `empresa_amiga` com aquele mês de
   referência) dividido pela meta do mês. É essa referência — não o
   acumulado, nem as parcelas de patrocínio/edital/projeto — que define a
   faixa/alíquota (política: "a meta do programa empresa Amiga [...] será a
   referência para pagamento da comissão como um todo").
2. A **alíquota** da faixa encontrada é aplicada sobre a **base do mês**:
   - Acumulado de Empresa Amiga (soma de todas as parcelas recorrentes
     ativas naquele mês — cresce a cada novo doador, decresce se um doador
     cancelar)
   - **+** parcela do mês de Patrocínio (1/12 dos patrocínios em vigor)
   - **+** parcela do mês de Editais (1/12 dos editais em vigor)
   - **+** parcela do mês de Projetos incentivados (1/12 dos projetos em
     vigor)
3. `comissão = base_total × alíquota`

Isso está implementado em `src/calc/commission.js` e coberto por testes em
`test/calc.test.js` e `test/repo.test.js`.

## ⚠️ Divergência não resolvida no exemplo numérico do documento original

O documento traz este exemplo:

> "Digamos que o valor captado da corrida seja de R$60.000, então o valor a
> ser considerado neste mês e nos próximos 11 será de R$5.000,00, e digamos
> que no projeto incentivado tenha captado 150.000,00, portanto o valor
> mensal deste período será de 12.500. Supondo que no programa empresa amiga
> tenha fechado em 2.400,00 de novos doadores e a soma de todos os doadores
> do Empresa amiga seja de 10.000,00. O valor da comissão será de 4% sobre
> R$22.500,00 (soma das 3 estratégias) portanto R$900,00 de comissão."

Reproduzindo a regra **exatamente como está escrita no texto**:

- Atingimento: 2.400 / 3.000 = 80% → faixa 80-99% → **4%** ✅ (bate com o
  exemplo)
- Corrida: 60.000 / 12 = **5.000/mês** ✅ (bate)
- Projeto incentivado: 150.000 / 12 = **12.500/mês** ✅ (bate)
- Acumulado Empresa Amiga: **10.000** (dado direto no exemplo)
- Soma literal das "3 estratégias": 10.000 + 5.000 + 12.500 = **27.500** —
  mas o documento usa **22.500** na conta final (diferença de R$5.000,00,
  e a comissão resultante seria R$1.100,00 em vez de R$900,00).

Esse sistema implementa a **regra tal como escrita** (soma das 3
estratégias, base = 27.500 no exemplo), e não o valor "22.500" citado na
frase final do exemplo — não dá para saber, só pelo texto, se 22.500 é um
erro de digitação (ex.: um "7" que virou "2") ou se a intenção original era
excluir uma das parcelas da base. **Ação pendente**: confirmar com a
Diretoria/autor da política qual dos dois números está correto e, se for o
caso, ajustar `calcularComissaoMensal` em `src/calc/commission.js` (é a
única função que precisaria mudar — o resto do sistema já é agnóstico a essa
escolha).

## Incentivos pela Qualidade das Parcerias (fora da meta mensal)

- **Bônus de Adimplência**: R$30,00 (configurável) concedido automaticamente
  quando um doador completa 12 pagamentos confirmados — uma única vez por
  doador. Ver `src/calc/bonuses.js` e o botão "Confirmar mais um pagamento"
  no painel de Lançamentos.
- **Bônus de Renovação**: pago a cada renovação anual, por cota — Bronze/
  Prata R$30, Ouro R$60, Premium R$100 (configurável no painel de Metas). Não
  conta para a meta mensal.

## Premiação Anual por Crescimento Institucional

1% (configurável) da receita anual **efetivamente recebida** pela equipe —
não das provisões/créditos futuros, conforme a política ("serão
considerados exclusivamente os valores efetivamente recebidos"). Por isso a
receita anual e a contribuição de cada captador(a) são informadas
manualmente no fechamento do ano (endpoint `POST /api/premiacoes`), já que
essa reconciliação financeira acontece fora do dia a dia do sistema. O
rateio por pessoa (`src/calc/annualAward.js`) é uma **sugestão** proporcional
à contribuição de captação e ao período trabalhado no ano — a política exige
aprovação da Diretoria antes do pagamento (endpoint
`POST /api/premiacoes/:ano/aprovar`), então o painel deve tratar o resultado
como rascunho editável, não como valor final.

## Estrutura do código

```
src/
  db.js                 # schema SQLite (node:sqlite) + seeds padrão
  calc/                 # funções puras de cálculo (sem dependência de banco)
    mesUtil.js           # aritmética de meses 'YYYY-MM'
    provisions.js         # provisionamento de 12 meses (recorrente vs. dividido)
    tiers.js               # faixas de incentivo
    commission.js           # cálculo da comissão mensal
    bonuses.js               # bônus de adimplência e renovação
    annualAward.js            # premiação anual
  repo/                  # acesso a dados sobre o SQLite
  server.js              # API REST + arquivos estáticos (http nativo, sem framework)
public/                  # painéis (HTML/CSS/JS vanilla, sem build step)
  metas.html              # administração de metas, faixas e config de bônus
  lancamentos.html        # lançamento de doações, doadores e comissão do mês
scripts/serve.js        # sobe o servidor (npm run comissao)
test/                    # node --test (calc, repo, servidor)
```
