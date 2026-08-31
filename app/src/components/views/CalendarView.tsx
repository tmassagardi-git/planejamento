import { useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { PRIORITY_WEIGHT, Task } from '../../types'
import { Button } from '../ui/Button'
import { cn, priorityDotClass, toISODate } from '../../lib/utils'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function CalendarView({
  tasks,
  onEdit,
  onAddOnDate,
}: {
  tasks: Task[]
  onEdit: (task: Task) => void
  onAddOnDate: (iso: string) => void
}) {
  const [cursor, setCursor] = useState(() => new Date())

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const task of tasks) {
      if (!task.dueDate) continue
      const list = map.get(task.dueDate) ?? []
      list.push(task)
      map.set(task.dueDate, list)
    }
    for (const list of map.values()) {
      list.sort((a, b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority])
    }
    return map
  }, [tasks])

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [cursor])

  const today = new Date()

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-card dark:border-slate-800 dark:bg-slate-900 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold capitalize text-slate-900 dark:text-slate-100">
          {format(cursor, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setCursor((c) => subMonths(c, 1))} aria-label="Mês anterior">
            <ChevronLeft size={18} />
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setCursor(new Date())}>
            Hoje
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCursor((c) => addMonths(c, 1))} aria-label="Próximo mês">
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg bg-slate-200 text-center text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-slate-50 py-1.5 dark:bg-slate-900">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800">
        {days.map((day) => {
          const iso = toISODate(day)
          const dayTasks = tasksByDate.get(iso) ?? []
          const inMonth = isSameMonth(day, cursor)
          const isCurrentDay = isSameDay(day, today) || isToday(day)
          const visibleTasks = dayTasks.slice(0, 3)
          const extra = dayTasks.length - visibleTasks.length

          return (
            <div
              key={iso}
              className={cn(
                'group relative flex min-h-[92px] flex-col gap-1 bg-white p-1.5 dark:bg-slate-900 sm:min-h-[110px]',
                !inMonth && 'bg-slate-50 dark:bg-slate-950/40'
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs',
                    isCurrentDay
                      ? 'bg-indigo-600 font-semibold text-white'
                      : inMonth
                      ? 'text-slate-700 dark:text-slate-300'
                      : 'text-slate-350 text-slate-400 dark:text-slate-600'
                  )}
                >
                  {format(day, 'd')}
                </span>
                <button
                  onClick={() => onAddOnDate(iso)}
                  className="rounded p-0.5 text-slate-300 opacity-0 hover:bg-slate-100 hover:text-indigo-600 group-hover:opacity-100 dark:text-slate-600 dark:hover:bg-slate-800"
                  aria-label="Adicionar tarefa"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="flex flex-col gap-0.5">
                {visibleTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onEdit(task)}
                    className={cn(
                      'flex items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[11px] hover:bg-slate-100 dark:hover:bg-slate-800',
                      task.status === 'done' && 'text-slate-400 line-through dark:text-slate-600'
                    )}
                    title={task.title}
                  >
                    <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', priorityDotClass(task.priority))} />
                    <span className="truncate text-slate-700 dark:text-slate-300">{task.title}</span>
                  </button>
                ))}
                {extra > 0 && (
                  <span className="px-1 text-[11px] text-slate-400 dark:text-slate-500">+{extra} mais</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-priority-alta" /> Alta
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-priority-media" /> Média
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-priority-baixa" /> Baixa
        </span>
        <span className="ml-auto">Tarefas do dia ordenadas por prioridade</span>
      </div>
    </div>
  )
}
