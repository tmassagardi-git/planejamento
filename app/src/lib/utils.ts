import { Priority, Task } from '../types'

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === 'done') return false
  return task.dueDate < todayISO()
}

export function isDueToday(task: Task): boolean {
  return !!task.dueDate && task.dueDate === todayISO()
}

export function formatDueDate(iso: string | null): string {
  if (!iso) return 'Sem prazo'
  const date = parseISODate(iso)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const PRIORITY_DOT: Record<Priority, string> = {
  alta: 'bg-priority-alta',
  media: 'bg-priority-media',
  baixa: 'bg-priority-baixa',
}

export function priorityDotClass(priority: Priority): string {
  return PRIORITY_DOT[priority]
}
