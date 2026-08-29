import { addDays, format } from 'date-fns'
import { Check, Copy, Link2, Pencil, Plane, StickyNote, X } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../store'
import type { Entry, Modality } from '../types'
import { timeLabel } from '../utils/entry'
import ModalityIcon from './ModalityIcon'
import ScheduleFields from './ScheduleFields'

type Mode = 'view' | 'edit' | 'duplicate'

type Props = {
  entry: Entry
}

export default function EntryListItem({ entry }: Props) {
  const updateEntry = useStore((s) => s.updateEntry)
  const duplicateEntry = useStore((s) => s.duplicateEntry)
  const removeEntry = useStore((s) => s.removeEntry)

  const [mode, setMode] = useState<Mode>('view')
  const [editAllDay, setEditAllDay] = useState(entry.allDay)
  const [editTime, setEditTime] = useState(entry.time ?? '')
  const [editEndTime, setEditEndTime] = useState(entry.endTime ?? '')
  const [editModality, setEditModality] = useState<Modality | undefined>(entry.modality)
  const [editTravelConfirmed, setEditTravelConfirmed] = useState(entry.travelConfirmed ?? false)
  const [editNotes, setEditNotes] = useState(entry.notes ?? '')
  const [editLink, setEditLink] = useState(entry.link ?? '')
  const [editLabel, setEditLabel] = useState(entry.label)
  const tomorrow = format(addDays(new Date(entry.date + 'T00:00:00'), 1), 'yyyy-MM-dd')
  const [dupDate, setDupDate] = useState(tomorrow)

  function startEdit() {
    setEditAllDay(entry.allDay)
    setEditTime(entry.time ?? '')
    setEditEndTime(entry.endTime ?? '')
    setEditModality(entry.modality)
    setEditTravelConfirmed(entry.travelConfirmed ?? false)
    setEditNotes(entry.notes ?? '')
    setEditLink(entry.link ?? '')
    setEditLabel(entry.label)
    setMode('edit')
  }

  function saveEdit() {
    updateEntry(entry.id, {
      allDay: editAllDay,
      time: editAllDay ? undefined : editTime || undefined,
      endTime: editAllDay ? undefined : editEndTime || undefined,
      modality: editModality,
      travelConfirmed: editModality === 'presencial' ? editTravelConfirmed : undefined,
      notes: editNotes.trim() || undefined,
      link: editLink.trim() || undefined,
      ...(entry.kind === 'meeting' ? { label: editLabel.trim() || entry.label } : {}),
    })
    setMode('view')
  }

  function confirmDuplicate() {
    if (!dupDate) return
    duplicateEntry(entry.id, dupDate)
    setMode('view')
  }

  if (mode === 'edit') {
    return (
      <div className="space-y-1.5 rounded-md bg-white px-1.5 py-1.5 text-xs shadow-sm">
        {entry.kind === 'meeting' && (
          <input
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            className="w-full rounded-md border border-slate-200 px-1.5 py-1 text-xs focus:border-indigo-400 focus:outline-none"
          />
        )}
        <ScheduleFields
          compact
          allDay={editAllDay}
          onAllDayChange={setEditAllDay}
          time={editTime}
          onTimeChange={setEditTime}
          endTime={editEndTime}
          onEndTimeChange={setEditEndTime}
          modality={editModality}
          onModalityChange={setEditModality}
          travelConfirmed={editTravelConfirmed}
          onTravelConfirmedChange={setEditTravelConfirmed}
          notes={editNotes}
          onNotesChange={setEditNotes}
          link={editLink}
          onLinkChange={setEditLink}
        />
        <div className="flex justify-end gap-1.5">
          <button title="Salvar" onClick={saveEdit} className="rounded-md bg-indigo-600 p-1 text-white hover:bg-indigo-700">
            <Check size={13} />
          </button>
          <button title="Cancelar" onClick={() => setMode('view')} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
            <X size={13} />
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'duplicate') {
    return (
      <div className="flex items-center gap-1.5 rounded-md bg-white px-1.5 py-1.5 text-xs shadow-sm">
        <span className="shrink-0 text-slate-500">Duplicar p/</span>
        <button
          onClick={() => setDupDate(tomorrow)}
          className={`shrink-0 rounded-md px-1.5 py-1 font-semibold ${
            dupDate === tomorrow ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'
          }`}
        >
          amanhã
        </button>
        <input
          type="date"
          value={dupDate}
          onChange={(e) => setDupDate(e.target.value)}
          className="min-w-0 flex-1 rounded-md border border-slate-200 px-1 py-1 text-xs focus:border-indigo-400 focus:outline-none"
        />
        <button title="Confirmar" onClick={confirmDuplicate} className="shrink-0 rounded-md bg-indigo-600 p-1 text-white hover:bg-indigo-700">
          <Check size={13} />
        </button>
        <button title="Cancelar" onClick={() => setMode('view')} className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100">
          <X size={13} />
        </button>
      </div>
    )
  }

  const label = timeLabel(entry)

  return (
    <div
      className={`flex items-center gap-1.5 rounded-md bg-white px-1.5 py-1 text-xs shadow-sm ${
        entry.travelConfirmed ? 'border-2 border-sky-400' : ''
      }`}
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
      {label && <span className="shrink-0 tabular-nums font-semibold text-slate-500">{label}</span>}
      <span className="flex-1 truncate font-medium text-slate-700">{entry.label}</span>
      {entry.travelConfirmed && <Plane size={12} className="shrink-0 text-sky-500" />}
      {entry.notes && (
        <span title={entry.notes} className="shrink-0">
          <StickyNote size={12} className="text-slate-400" />
        </span>
      )}
      {entry.link && <Link2 size={12} className="shrink-0 text-slate-400" />}
      <ModalityIcon modality={entry.modality} className="text-slate-400" />
      <button
        title="Editar"
        onClick={startEdit}
        className="shrink-0 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      >
        <Pencil size={11} />
      </button>
      <button
        title="Duplicar"
        onClick={() => setMode('duplicate')}
        className="shrink-0 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      >
        <Copy size={11} />
      </button>
      <button
        title="Remover"
        onClick={() => removeEntry(entry.id)}
        className="shrink-0 rounded-full p-0.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600"
      >
        <X size={11} />
      </button>
    </div>
  )
}
