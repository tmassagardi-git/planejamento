import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Status, Task, TaskInput } from '../types'
import { todayISO, uid } from '../lib/utils'

function addDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function seedTasks(): Task[] {
  const now = new Date().toISOString()
  const base: Array<Partial<Task>> = [
    {
      title: 'Definir escopo do planejamento trimestral',
      description: 'Alinhar metas e prioridades com a diretoria.',
      dueDate: addDays(1),
      priority: 'alta',
      status: 'todo',
      assignee: '',
      tags: ['planejamento'],
    },
    {
      title: 'Enviar proposta para fornecedor',
      description: 'Revisar valores antes de enviar.',
      dueDate: addDays(1),
      priority: 'media',
      status: 'todo',
      assignee: '',
      tags: ['financeiro'],
    },
    {
      title: 'Relatório mensal de captação',
      description: 'Delegado para a equipe de comunicação.',
      dueDate: addDays(3),
      priority: 'alta',
      status: 'delegated',
      assignee: 'Equipe de Comunicação',
      tags: ['relatorio'],
    },
    {
      title: 'Atualizar site institucional',
      description: 'Trocar banners da campanha atual.',
      dueDate: addDays(5),
      priority: 'baixa',
      status: 'in_progress',
      assignee: 'Marketing',
      tags: ['site'],
    },
    {
      title: 'Reunião de kickoff do projeto X',
      description: '',
      dueDate: todayISO(),
      priority: 'media',
      status: 'in_progress',
      assignee: '',
      tags: [],
    },
    {
      title: 'Revisar contrato assinado',
      description: 'Arquivar cópia digital.',
      dueDate: addDays(-2),
      priority: 'baixa',
      status: 'done',
      assignee: '',
      tags: ['juridico'],
    },
  ]
  return base.map((t) => ({
    id: uid(),
    title: t.title ?? '',
    description: t.description ?? '',
    dueDate: t.dueDate ?? null,
    priority: t.priority ?? 'media',
    status: t.status ?? 'todo',
    assignee: t.assignee ?? '',
    tags: t.tags ?? [],
    createdAt: now,
    updatedAt: now,
  }))
}

interface TaskStore {
  tasks: Task[]
  addTask: (input: TaskInput) => void
  updateTask: (id: string, input: Partial<TaskInput>) => void
  deleteTask: (id: string) => void
  moveTask: (id: string, status: Status) => void
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set) => ({
      tasks: seedTasks(),
      addTask: (input) =>
        set((state) => {
          const now = new Date().toISOString()
          const task: Task = { ...input, id: uid(), createdAt: now, updatedAt: now }
          return { tasks: [task, ...state.tasks] }
        }),
      updateTask: (id, input) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...input, updatedAt: new Date().toISOString() } : t
          ),
        })),
      deleteTask: (id) =>
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),
      moveTask: (id, status) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t
          ),
        })),
    }),
    { name: 'taskflow-tasks-v1' }
  )
)
