import { AlertTriangle, CheckCircle2, CircleDot, ListTodo } from 'lucide-react'
import { Task } from '../types'
import { isOverdue } from '../lib/utils'

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: number
  tone: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-card dark:border-slate-800 dark:bg-slate-900">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>{icon}</div>
      <div>
        <p className="text-lg font-semibold leading-tight text-slate-900 dark:text-slate-100">
          {value}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  )
}

export function StatsBar({ tasks }: { tasks: Task[] }) {
  const total = tasks.length
  const done = tasks.filter((t) => t.status === 'done').length
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length
  const overdue = tasks.filter(isOverdue).length

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        icon={<ListTodo size={18} className="text-indigo-600 dark:text-indigo-400" />}
        label="Total de tarefas"
        value={total}
        tone="bg-indigo-50 dark:bg-indigo-500/10"
      />
      <StatCard
        icon={<CircleDot size={18} className="text-blue-600 dark:text-blue-400" />}
        label="Em execução"
        value={inProgress}
        tone="bg-blue-50 dark:bg-blue-500/10"
      />
      <StatCard
        icon={<AlertTriangle size={18} className="text-red-600 dark:text-red-400" />}
        label="Atrasadas"
        value={overdue}
        tone="bg-red-50 dark:bg-red-500/10"
      />
      <StatCard
        icon={<CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />}
        label="Concluídas"
        value={done}
        tone="bg-emerald-50 dark:bg-emerald-500/10"
      />
    </div>
  )
}
