export type Priority = 'alta' | 'media' | 'baixa'

export type Status = 'todo' | 'delegated' | 'in_progress' | 'done'

export interface Task {
  id: string
  title: string
  description: string
  dueDate: string | null // ISO date (yyyy-MM-dd), null = sem prazo
  priority: Priority
  status: Status
  assignee: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export type TaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>

export type ViewMode = 'list' | 'kanban' | 'calendar'

export const STATUS_ORDER: Status[] = ['todo', 'delegated', 'in_progress', 'done']

export const STATUS_LABELS: Record<Status, string> = {
  todo: 'Para fazer',
  delegated: 'Delegada',
  in_progress: 'Em execução',
  done: 'Realizada',
}

export const PRIORITY_ORDER: Priority[] = ['alta', 'media', 'baixa']

export const PRIORITY_LABELS: Record<Priority, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
}

export const PRIORITY_WEIGHT: Record<Priority, number> = {
  alta: 0,
  media: 1,
  baixa: 2,
}
