# Agenda da Equipe

Aplicação web para visualizar e organizar a agenda de toda a equipe de consultoria em uma única tela, substituindo a planilha mensal por um quadro visual com drag-and-drop.

## Funcionalidades

- **Grade mensal**: uma linha por consultor, uma coluna por dia — a equipe inteira visível de uma vez, com navegação entre meses.
- **Arrastar para agendar**: arraste um cliente (ou item da aba "Outros") da barra lateral direto para o dia de um consultor.
- **Vários clientes por dia**: cada dia de cada consultor comporta uma lista de itens (clientes, categorias ou texto livre), cada um com horário opcional — a lista aparece sempre ordenada por horário (itens sem horário aparecem primeiro).
- **Horário por item**: ao clicar num dia, dá para definir o horário antes de escolher o cliente/categoria, ou adicionar um texto livre com horário.
- **Mover itens**: arraste um item já colocado para outro dia (ou outro consultor).
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
