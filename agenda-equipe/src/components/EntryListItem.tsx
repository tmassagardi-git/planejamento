import { addDays, format } from 'date-fns'
import { Building2, Check, Copy, Pencil, Video, X } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../store'
import type { Entry, Modality } from '../types'
import ModalityIcon from './ModalityIcon'

type Mode = 'view' | 'edit' | 'duplicate'

type Props = {
  entry: Entry
}

export default function EntryListItem({ entry }: Props) {
  const updateEntry = useStore((s) => s.updateEntry)
  const duplicateEntry = useStore((s) => s.duplicateEntry)
  const removeEntry = useStore((s) => s.removeEntry)

  const [mode, setMode] = useState<Mode>('view')
  const [editTime, setEditTime] = useState(entry.time ?? '')
  const [editModality, setEditModality] = useState<Modality | undefined>(entry.modality)
  const [editLabel, setEditLabel] = useState(entry.label)
  const tomorrow = format(addDays(new Date(entry.date + 'T00:00:00'), 1), 'yyyy-MM-dd')
  const [dupDate, setDupDate] = useState(tomorrow)

  function startEdit() {
    setEditTime(entry.time ?? '')
    setEditModality(entry.modality)
    setEditLabel(entry.label)
    setMode('edit')
  }

  function saveEdit() {
    updateEntry(entry.id, {
      time: editTime || undefined,
      modality: editModality,
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
        <div className="flex items-center gap-1.5">
          <input
            type="time"
            value={editTime}
            onChange={(e) => setEditTime(e.target.value)}
            className="min-w-0 flex-1 rounded-md border border-slate-200 px-1.5 py-1 text-xs tabular-nums focus:border-indigo-400 focus:outline-none"
          />
          <div className="flex gap-0.5 rounded-md bg-slate-100 p-0.5">
            <button
              type="button"
              title="Presencial"
              onClick={() => setEditModality((m) => (m === 'presencial' ? undefined : 'presencial'))}
              className={`rounded p-1 ${editModality === 'presencial' ? 'bg-white text-indigo-600 shadow-soft' : 'text-slate-400'}`}
            >
              <Building2 size={13} />
            </button>
            <button
              type="button"
              title="Online"
              onClick={() => setEditModality((m) => (m === 'online' ? undefined : 'online'))}
              className={`rounded p-1 ${editModality === 'online' ? 'bg-white text-indigo-600 shadow-soft' : 'text-slate-400'}`}
            >
              <Video size={13} />
            </button>
          </div>
          <button title="Salvar" onClick={saveEdit} className="shrink-0 rounded-md bg-indigo-600 p-1 text-white hover:bg-indigo-700">
            <Check size={13} />
          </button>
          <button title="Cancelar" onClick={() => setMode('view')} className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100">
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

  return (
    <div className="flex items-center gap-1.5 rounded-md bg-white px-1.5 py-1 text-xs shadow-sm">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
      {entry.time && <span className="shrink-0 tabular-nums font-semibold text-slate-500">{entry.time}</span>}
      <span className="flex-1 truncate font-medium text-slate-700">{entry.label}</span>
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
