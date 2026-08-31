# TaskFlow — Gestão de Tarefas

Aplicação de gestão de tarefas com três modos de visualização (Lista, Kanban
e Calendário), prazos, prioridades e etapas de fluxo de trabalho.

## Funcionalidades

- **Criação de tarefas** com título, descrição, prazo, prioridade (Alta,
  Média, Baixa), pessoa/equipe delegada e tags.
- **Etapas do Kanban**: Para fazer → Delegada → Em execução → Realizada,
  com arraste (drag and drop) entre colunas.
- **Visão em Lista**: ordenação por prioridade, prazo ou título; filtro por
  etapa; conclusão rápida; destaque de tarefas atrasadas.
- **Visão em Calendário**: mês a mês, tarefas exibidas no dia do prazo e
  ordenadas por prioridade quando há mais de uma tarefa no mesmo dia; clique
  em um dia para criar uma tarefa já com aquele prazo preenchido.
- **Busca e filtro por prioridade**, aplicados às visões de Lista e Kanban.
- **Painel de indicadores**: total de tarefas, em execução, atrasadas e
  concluídas.
- **Tema claro/escuro** com preferência salva no navegador.
- **Persistência local**: os dados ficam salvos no `localStorage` do
  navegador (não depende de servidor/backend).

## Rodando localmente

```bash
cd app
npm install
npm run dev
```

Acesse `http://localhost:5173`.

Build de produção:

```bash
npm run build
npm run preview
```

## Stack

React 18 + TypeScript + Vite + Tailwind CSS + Zustand (estado/persistência)
+ dnd-kit (drag and drop do Kanban) + date-fns (cálculo do calendário) +
lucide-react (ícones).

## Estrutura

```
src/
  types.ts               # Task, Status, Priority e labels em pt-BR
  store/useTaskStore.ts  # estado global das tarefas (zustand + localStorage)
  store/useDarkMode.ts   # tema claro/escuro
  components/
    ui/                  # Button, Input, Select, Badge, Modal
    TaskFormModal.tsx    # formulário de criação/edição
    FilterBar.tsx        # busca + filtro de prioridade
    StatsBar.tsx         # cartões de indicadores
    ViewSwitcher.tsx     # alternância Lista/Kanban/Calendário
    views/
      ListView.tsx
      KanbanView.tsx + KanbanCard.tsx
      CalendarView.tsx
  App.tsx
```
