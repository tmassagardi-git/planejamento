import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import type { Entry } from '../types'
import { textColorFor } from '../utils/color'

type Props = {
  memberId: string
  memberName: string
  date: string
  entry?: Entry
  anchor: { x: number; y: number }
  onClose: () => void
}

export default function QuickAddPopover({ memberId, memberName, date, entry, anchor, onClose }: Props) {
  const clients = useStore((s) => s.clients)
  const categories = useStore((s) => s.categories)
  const setFullDayEntry = useStore((s) => s.setFullDayEntry)
  const setMeetingEntry = useStore((s) => s.setMeetingEntry)
  const clearEntry = useStore((s) => s.clearEntry)

  const [mode, setMode] = useState<'day' | 'meeting'>(entry && !entry.isFullDay ? 'meeting' : 'day')
  const [label, setLabel] = useState(entry?.kind === 'meeting' ? entry.label : '')
  const [detail, setDetail] = useState(entry?.detail ?? '')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  const dateLabel = format(new Date(date + 'T00:00:00'), "d 'de' MMMM", { locale: ptBR })

  const popW = 280
  const left = Math.min(Math.max(8, anchor.x - popW / 2), window.innerWidth - popW - 8)
  const top = Math.min(anchor.y + 10, window.innerHeight - 360)

  function pickFullDay(kind: 'client' | 'category', refId: string) {
    setFullDayEntry(memberId, date, kind, refId)
    onClose()
  }

  function saveMeeting() {
    if (!label.trim()) return
    setMeetingEntry(memberId, date, label.trim(), detail.trim() || undefined)
    onClose()
  }

  return (
    <div
      ref={ref}
      className="fixed z-40 w-[280px] animate-pop-in rounded-2xl border border-slate-200 bg-white p-3 shadow-pop"
      style={{ left, top }}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500">
          {memberName} · <span className="capitalize">{dateLabel}</span>
        </p>
        {entry && (
          <button
            onClick={() => {
              clearEntry(memberId, date)
              onClose()
            }}
            className="flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-xs font-medium text-rose-500 hover:bg-rose-50"
          >
            <Trash2 size={12} /> remover
          </button>
        )}
      </div>

      <div className="mb-2 flex gap-1 rounded-lg bg-slate-100 p-0.5">
        <button
          onClick={() => setMode('day')}
          className={`flex-1 rounded-md px-2 py-1 text-xs font-semibold ${
            mode === 'day' ? 'bg-white text-indigo-600 shadow-soft' : 'text-slate-500'
          }`}
        >
          Dia todo
        </button>
        <button
          onClick={() => setMode('meeting')}
          className={`flex-1 rounded-md px-2 py-1 text-xs font-semibold ${
            mode === 'meeting' ? 'bg-white text-indigo-600 shadow-soft' : 'text-slate-500'
          }`}
        >
          Reunião
        </button>
      </div>

      {mode === 'day' ? (
        <div className="max-h-52 space-y-2 overflow-y-auto pr-0.5">
          {clients.length > 0 && (
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Clientes</p>
              <div className="flex flex-wrap gap-1.5">
                {clients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => pickFullDay('client', c.id)}
                    className="rounded-lg px-2 py-1 text-xs font-bold shadow-soft transition-transform hover:scale-105"
                    style={{ backgroundColor: c.color, color: textColorFor(c.color) }}
                  >
                    {c.abbrev}
                  </button>
                ))}
              </div>
            </div>
          )}
          {categories.length > 0 && (
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Outros</p>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => pickFullDay('category', c.id)}
                    className="rounded-lg px-2 py-1 text-xs font-bold shadow-soft transition-transform hover:scale-105"
                    style={{ backgroundColor: c.color, color: textColorFor(c.color) }}
                  >
                    {c.abbrev}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex: Call 10h com fulano"
            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-indigo-400 focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && saveMeeting()}
          />
          <input
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="Detalhe / horário (opcional)"
            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-indigo-400 focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && saveMeeting()}
          />
          <button
            onClick={saveMeeting}
            className="w-full rounded-lg bg-indigo-600 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Salvar reunião
          </button>
        </div>
      )}
    </div>
  )
}
