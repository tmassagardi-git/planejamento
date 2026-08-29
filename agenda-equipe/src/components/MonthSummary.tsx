import { ClipboardList } from 'lucide-react'
import { useMemo } from 'react'
import { useStore } from '../store'
import { daysInMonth, toISO } from '../utils/date'
import { textColorFor, withAlpha } from '../utils/color'

type Props = {
  month: Date
}

export default function MonthSummary({ month }: Props) {
  const entries = useStore((s) => s.entries)
  const clients = useStore((s) => s.clients)

  const counts = useMemo(() => {
    const isoSet = new Set(daysInMonth(month).map(toISO))
    const byClient = new Map<string, number>()
    for (const entry of Object.values(entries)) {
      if (entry.kind !== 'client' || !entry.refId || !isoSet.has(entry.date)) continue
      byClient.set(entry.refId, (byClient.get(entry.refId) ?? 0) + 1)
    }
    return clients
      .map((c) => ({ client: c, count: byClient.get(c.id) ?? 0 }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count)
  }, [entries, clients, month])

  const total = counts.reduce((sum, c) => sum + c.count, 0)

  if (counts.length === 0) {
    return (
      <footer className="flex items-center gap-2 border-t border-slate-200 bg-white px-4 py-2 text-xs text-slate-400">
        <ClipboardList size={14} /> Nenhuma reunião ou visita registrada em clientes este mês.
      </footer>
    )
  }

  return (
    <footer className="flex items-center gap-2 overflow-x-auto border-t border-slate-200 bg-white px-4 py-2">
      <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-slate-500">
        <ClipboardList size={14} /> {total} no mês:
      </span>
      <div className="flex shrink-0 gap-1.5">
        {counts.map(({ client, count }) => (
          <span
            key={client.id}
            title={client.name}
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold"
            style={{ backgroundColor: withAlpha(client.color, 0.9), color: textColorFor(client.color) }}
          >
            {client.abbrev}
            <span className="rounded-full bg-black/15 px-1.5">{count}</span>
          </span>
        ))}
      </div>
    </footer>
  )
}
