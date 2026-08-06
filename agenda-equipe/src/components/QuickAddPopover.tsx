import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Building2, Video, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import type { Entry, Modality } from '../types'
import { textColorFor } from '../utils/color'
import ModalityIcon from './ModalityIcon'

type Props = {
  memberId: string
  memberName: string
  date: string
  entries: Entry[]
  anchor: { x: number; y: number }
  onClose: () => void
}

export default function QuickAddPopover({ memberId, memberName, date, entries, anchor, onClose }: Props) {
  const clients = useStore((s) => s.clients)
  const categories = useStore((s) => s.categories)
  const addEntry = useStore((s) => s.addEntry)
  const removeEntry = useStore((s) => s.removeEntry)

  const [time, setTime] = useState('')
  const [modality, setModality] = useState<Modality | undefined>(undefined)
  const [customLabel, setCustomLabel] = useState('')
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

  const popW = 300
  const left = Math.min(Math.max(8, anchor.x - popW / 2), window.innerWidth - popW - 8)
  const top = Math.min(anchor.y + 10, window.innerHeight - 460)

  function pick(kind: 'client' | 'category', refId: string) {
    addEntry(memberId, date, { kind, refId, time: time || undefined, modality })
  }

  function addCustom() {
    if (!customLabel.trim()) return
    addEntry(memberId, date, { kind: 'meeting', label: customLabel.trim(), time: time || undefined, modality })
    setCustomLabel('')
  }

  return (
    <div
      ref={ref}
      className="fixed z-40 w-[300px] animate-pop-in rounded-2xl border border-slate-200 bg-white p-3 shadow-pop"
      style={{ left, top }}
    >
      <p className="mb-2 text-xs font-semibold text-slate-500">
        {memberName} · <span className="capitalize">{dateLabel}</span>
      </p>

      {entries.length > 0 && (
        <div className="mb-3 max-h-28 space-y-1 overflow-y-auto rounded-lg bg-slate-50 p-1.5">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center gap-1.5 rounded-md bg-white px-1.5 py-1 text-xs shadow-sm">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.time && <span className="shrink-0 tabular-nums font-semibold text-slate-500">{entry.time}</span>}
              <span className="flex-1 truncate font-medium text-slate-700">{entry.label}</span>
              <ModalityIcon modality={entry.modality} className="text-slate-400" />
              <button
                onClick={() => removeEntry(entry.id)}
                className="shrink-0 rounded-full p-0.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mb-3 flex gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Horário (opcional)
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm tabular-nums focus:border-indigo-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Formato
          </label>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5">
            <button
              type="button"
              title="Presencial"
              onClick={() => setModality((m) => (m === 'presencial' ? undefined : 'presencial'))}
              className={`rounded-md p-[7px] ${
                modality === 'presencial' ? 'bg-white text-indigo-600 shadow-soft' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Building2 size={16} />
            </button>
            <button
              type="button"
              title="Online"
              onClick={() => setModality((m) => (m === 'online' ? undefined : 'online'))}
              className={`rounded-md p-[7px] ${
                modality === 'online' ? 'bg-white text-indigo-600 shadow-soft' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Video size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-h-40 space-y-2 overflow-y-auto pr-0.5">
        {clients.length > 0 && (
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Clientes</p>
            <div className="flex flex-wrap gap-1.5">
              {clients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => pick('client', c.id)}
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
                  onClick={() => pick('category', c.id)}
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

      <div className="mt-3 flex gap-1.5 border-t border-slate-100 pt-3">
        <input
          value={customLabel}
          onChange={(e) => setCustomLabel(e.target.value)}
          placeholder="Outro texto livre..."
          className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-indigo-400 focus:outline-none"
          onKeyDown={(e) => e.key === 'Enter' && addCustom()}
        />
        <button
          onClick={addCustom}
          className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Adicionar
        </button>
      </div>
    </div>
  )
}
