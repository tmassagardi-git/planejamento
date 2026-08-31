import { useMemo, useState } from 'react'
import { CheckSquare, Pencil, Square, Trash2 } from 'lucide-react'
import { Task, STATUS_LABELS, PRIORITY_LABELS, PRIORITY_WEIGHT, Status, STATUS_ORDER } from '../../types'
import { PriorityBadge, StatusBadge } from '../ui/Badge'
import { Select } from '../ui/Select'
import { formatDueDate, isOverdue } from '../../lib/utils'
import { cn } from '../../lib/utils'

type SortKey = 'priority' | 'dueDate' | 'title'

export function ListView({
  tasks,
  onEdit,
  onDelete,
  onToggleDone,
}: {
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onToggleDone: (task: Task) => void
}) {
  const [sortKey, setSortKey] = useState<SortKey>('priority')
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all')

  const visible = useMemo(() => {
    const filtered = statusFilter === 'all' ? tasks : tasks.filter((t) => t.status === statusFilter)
    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === 'priority') return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]
      if (sortKey === 'title') return a.title.localeCompare(b.title)
      const ad = a.dueDate ?? '9999-99-99'
      const bd = b.dueDate ?? '9999-99-99'
      return ad.localeCompare(bd)
    })
    return sorted
  }, [tasks, sortKey, statusFilter])

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
        Nenhuma tarefa encontrada. Crie uma nova tarefa para começar.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span>Ordenar por</span>
          <Select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="!w-auto"
          >
            <option value="priority">Prioridade</option>
            <option value="dueDate">Prazo</option>
            <option value="title">Título</option>
          </Select>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span>Etapa</span>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Status | 'all')}
            className="!w-auto"
          >
            <option value="all">Todas</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {visible.map((task) => {
          const overdue = isOverdue(task)
          return (
            <li
              key={task.id}
              className="group flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <button
                onClick={() => onToggleDone(task)}
                className="shrink-0 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                aria-label="Concluir tarefa"
              >
                {task.status === 'done' ? (
                  <CheckSquare size={20} className="text-emerald-500" />
                ) : (
                  <Square size={20} />
                )}
              </button>

              <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onEdit(task)}>
                <p
                  className={cn(
                    'truncate text-sm font-medium text-slate-900 dark:text-slate-100',
                    task.status === 'done' && 'text-slate-400 line-through dark:text-slate-500'
                  )}
                >
                  {task.title}
                </p>
                {task.description && (
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {task.description}
                  </p>
                )}
              </div>

              {task.assignee && (
                <span className="hidden shrink-0 text-xs text-slate-500 dark:text-slate-400 sm:block">
                  {task.assignee}
                </span>
              )}

              <span
                className={cn(
                  'hidden shrink-0 text-xs sm:block',
                  overdue ? 'font-semibold text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'
                )}
              >
                {formatDueDate(task.dueDate)}
                {overdue && ' · atrasada'}
              </span>

              <PriorityBadge priority={task.priority} label={PRIORITY_LABELS[task.priority]} />
              <div className="hidden md:block">
                <StatusBadge status={task.status} label={STATUS_LABELS[task.status]} />
              </div>

              <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => onEdit(task)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  aria-label="Editar"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => onDelete(task.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                  aria-label="Excluir"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
