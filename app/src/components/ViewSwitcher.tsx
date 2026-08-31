import { CalendarDays, Kanban, List } from 'lucide-react'
import { ViewMode } from '../types'
import { cn } from '../lib/utils'

const options: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  { id: 'list', label: 'Lista', icon: <List size={16} /> },
  { id: 'kanban', label: 'Kanban', icon: <Kanban size={16} /> },
  { id: 'calendar', label: 'Calendário', icon: <CalendarDays size={16} /> },
]

export function ViewSwitcher({
  value,
  onChange,
}: {
  value: ViewMode
  onChange: (v: ViewMode) => void
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-card dark:border-slate-800 dark:bg-slate-900">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            value === opt.id
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          )}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  )
}
