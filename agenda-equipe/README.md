# Agenda da Equipe

Aplicação web para visualizar e organizar a agenda de toda a equipe de consultoria em uma única tela, substituindo a planilha mensal por um quadro visual com drag-and-drop.

## Funcionalidades

- **Grade mensal**: uma linha por consultor, uma coluna por dia — a equipe inteira visível de uma vez, com navegação entre meses.
- **Arrastar para agendar**: arraste um cliente (ou item da aba "Outros") da barra lateral direto para o dia de um consultor.
- **Dia todo ou reunião pontual**: cada dia de cada consultor comporta ou um bloco de dia inteiro (colorido, ocupando a célula) ou uma reunião pontual (pílula com horário/nota) — nunca os dois ao mesmo tempo, replicando a lógica da planilha original.
- **Esticar para vários dias**: passe o mouse na borda direita de um bloco de dia inteiro e arraste para estender o mesmo cliente por vários dias consecutivos (os dias aparecem mesclados visualmente, como uma célula única).
- **Mover blocos**: arraste um bloco já colocado para outro dia (ou outro consultor).
- **Além de clientes**: cadastre categorias livres (Feriado, Particular, Viagem, Interno, Evento, ou qualquer outra) com cor própria.
- **Feriados**: clique no cabeçalho de um dia para marcar (ou remover) um feriado — destaca a coluna inteira.
- **Gerenciamento**: modais para adicionar/editar/remover clientes, categorias e membros da equipe (com cor e reordenação).
- **Persistência local**: os dados ficam salvos no `localStorage` do navegador (por enquanto sem backend/sincronização entre usuários).

## Rodando localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:5173`.

## Build de produção

```bash
npm run build   # gera a pasta dist/
npm run preview # serve o build localmente para conferir
```

## Stack

Vite + React + TypeScript + Tailwind CSS + `@dnd-kit` (drag-and-drop) + Zustand (estado com persistência em `localStorage`).

## Próximos passos possíveis

- Sincronizar os dados em um backend compartilhado (ex.: Supabase) para a equipe toda ver/editar a mesma agenda em tempo real, em vez de cada pessoa ter sua cópia local.
- Exportar/imprimir a visão mensal.
- Filtro por cliente ou consultor.
