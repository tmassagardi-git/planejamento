import { Search } from 'lucide-react'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { PRIORITY_LABELS, PRIORITY_ORDER, Priority } from '../types'

export interface Filters {
  search: string
  priority: Priority | 'all'
}

export function FilterBar({
  filters,
  onChange,
}: {
  filters: Filters
  onChange: (f: Filters) => void
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <Input
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Buscar tarefas..."
          className="pl-9"
        />
      </div>
      <div className="w-full sm:w-48">
        <Select
          value={filters.priority}
          onChange={(e) => onChange({ ...filters, priority: e.target.value as Filters['priority'] })}
        >
          <option value="all">Todas as prioridades</option>
          {PRIORITY_ORDER.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </option>
          ))}
        </Select>
      </div>
    </div>
  )
}

export function applyFilters<T extends { title: string; description: string; assignee: string; priority: Priority }>(
  items: T[],
  filters: Filters
): T[] {
  const q = filters.search.trim().toLowerCase()
  return items.filter((t) => {
    if (filters.priority !== 'all' && t.priority !== filters.priority) return false
    if (!q) return true
    return (
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.assignee.toLowerCase().includes(q)
    )
  })
}
