# Diagnóstico de Maturidade (protótipo)

Autodiagnóstico de captação de recursos e desenvolvimento institucional para
organizações da sociedade civil. Protótipo em um único arquivo
(`index.html`, HTML + CSS + JavaScript puro, gráficos com Chart.js via CDN),
pensado para validar conteúdo e visual antes de levar ao Lovable.

O arquivo não traz `<!doctype>`/`<html>`/`<body>` porque é publicado como
Artifact (que acrescenta esse esqueleto). Abre normalmente em um navegador.

## Telas

1. **Início**: apresentação e dados da organização.
2. **Questionário**: 57 perguntas de múltipla escolha em 7 áreas (captação,
   relacionamento com doadores, comunicação, gestão e governança, finanças,
   programas e projetos, equipe e desenvolvimento institucional).
3. **Números da captação**: estratégias ativas, tipo de recurso (livre ou
   carimbado), fase do ciclo de vida, meta do ano e valor captado mês a mês em
   24 meses (aceita colar de planilha); doadores e investimento em captação.
4. **Resultado**: nota geral e nível, radar de maturidade, evolução mensal por
   fonte, acumulado ano contra ano, participação por estratégia com o limite de
   30%, meta x realizado, tabela de desempenho por estratégia, análise
   automática (pontos fortes, pontos de atenção, prioridades) e respostas por
   área com recomendações.

## Regras de cálculo (pontos a refinar)

- Cada pergunta vale de 0 a 3 pontos. A nota da área é a soma dos pontos sobre
  o máximo possível das perguntas respondidas, de 0 a 100.
- Níveis: Básico (0–39), Intermediário (40–64), Avançado (65–84),
  Excelência (85–100). É uma simplificação da regra cumulativa da
  "Pesquisa de Maturidade DI" (80% / 60% / 70% / 80% por nível).
- A nota geral é a média simples das áreas, sem pesos.
- A comparação da captação usa o ano mais recente até o último mês informado
  contra os mesmos meses do ano anterior.
- Ritmo da meta = realizado / (meta anual × meses decorridos / 12).
- Referências usadas nos alertas: regra dos 30% por estratégia, retorno mínimo
  de 3x sobre o investimento em captação, reserva de 3 / 6 / 12 meses.

## Dados

As respostas ficam apenas no navegador (`localStorage`). A tela de resultado
permite copiar e carregar o diagnóstico em JSON. Na migração para o Lovable,
o estado `S` (org, ans, strat, data, ind) vira o modelo de dados no Supabase.
