import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import type { Entry, Modality } from '../types'
import { textColorFor } from '../utils/color'
import EntryListItem from './EntryListItem'
import ScheduleFields from './ScheduleFields'

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

  const [allDay, setAllDay] = useState(true)
  const [time, setTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [modality, setModality] = useState<Modality | undefined>(undefined)
  const [travelConfirmed, setTravelConfirmed] = useState(false)
  const [notes, setNotes] = useState('')
  const [link, setLink] = useState('')
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

  const popW = 320
  const left = Math.min(Math.max(8, anchor.x - popW / 2), window.innerWidth - popW - 8)
  const top = Math.max(8, Math.min(anchor.y + 10, window.innerHeight - 8))
  const maxHeight = window.innerHeight - top - 16

  const schedule = {
    allDay,
    time: time || undefined,
    endTime: endTime || undefined,
    modality,
    travelConfirmed,
    notes: notes.trim() || undefined,
    link: link.trim() || undefined,
  }

  function afterAdd() {
    setNotes('')
    setLink('')
  }

  function pick(kind: 'client' | 'category', refId: string) {
    addEntry(memberId, date, { kind, refId, ...schedule })
    afterAdd()
  }

  function addCustom() {
    if (!customLabel.trim()) return
    addEntry(memberId, date, { kind: 'meeting', label: customLabel.trim(), ...schedule })
    setCustomLabel('')
    afterAdd()
  }

  return (
    <div
      ref={ref}
      className="fixed z-40 w-[320px] animate-pop-in overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-pop"
      style={{ left, top, maxHeight }}
    >
      <p className="mb-2 text-xs font-semibold text-slate-500">
        {memberName} · <span className="capitalize">{dateLabel}</span>
      </p>

      {entries.length > 0 && (
        <div className="mb-3 max-h-48 space-y-1 overflow-y-auto rounded-lg bg-slate-50 p-1.5">
          {entries.map((entry) => (
            <EntryListItem key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      <div className="mb-3 border-b border-slate-100 pb-3">
        <ScheduleFields
          allDay={allDay}
          onAllDayChange={setAllDay}
          time={time}
          onTimeChange={setTime}
          endTime={endTime}
          onEndTimeChange={setEndTime}
          modality={modality}
          onModalityChange={setModality}
          travelConfirmed={travelConfirmed}
          onTravelConfirmedChange={setTravelConfirmed}
          notes={notes}
          onNotesChange={setNotes}
          link={link}
          onLinkChange={setLink}
        />
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
