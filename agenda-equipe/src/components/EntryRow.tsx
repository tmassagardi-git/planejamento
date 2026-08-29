import { useDraggable } from '@dnd-kit/core'
import { Link2, Plane, StickyNote, X } from 'lucide-react'
import type { Entry } from '../types'
import { withAlpha } from '../utils/color'
import { timeLabel } from '../utils/entry'
import ModalityIcon from './ModalityIcon'

type Props = {
  entry: Entry
  onClick: (e: React.MouseEvent) => void
  onRemove: () => void
}

export default function EntryRow({ entry, onClick, onRemove }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `entry:${entry.id}` })
  const label = timeLabel(entry)

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`group relative flex w-full cursor-grab items-center gap-1 rounded px-1 py-[3px] text-[10px] font-semibold leading-tight text-slate-700 active:cursor-grabbing ${
        entry.travelConfirmed ? 'border-2 border-sky-400' : ''
      }`}
      style={{
        backgroundColor: withAlpha(entry.color, 0.16),
        borderLeft: entry.travelConfirmed ? undefined : `3px solid ${entry.color}`,
        opacity: isDragging ? 0.35 : 1,
        touchAction: 'none',
      }}
      onClick={onClick}
    >
      {!entry.allDay && entry.time && <span className="shrink-0 tabular-nums text-slate-500">{entry.time}</span>}
      <span className="flex-1 truncate">{entry.label}</span>
      {entry.travelConfirmed && <Plane size={10} className="shrink-0 text-sky-500" />}
      {entry.notes && <StickyNote size={10} className="shrink-0 text-slate-400" />}
      {entry.link && <Link2 size={10} className="shrink-0 text-slate-400" />}
      <ModalityIcon modality={entry.modality} />
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="shrink-0 rounded-full p-0.5 text-slate-400 opacity-0 hover:bg-black/10 group-hover:opacity-100"
      >
        <X size={10} />
      </button>

      <div className="pointer-events-none absolute left-0 top-full z-50 mt-1 w-56 max-w-[80vw] scale-95 rounded-xl border border-slate-200 bg-white p-2.5 text-left opacity-0 shadow-pop transition-all delay-300 duration-100 group-hover:scale-100 group-hover:opacity-100">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="truncate text-xs font-bold text-slate-700">{entry.label}</span>
          <ModalityIcon modality={entry.modality} className="text-slate-400" />
        </div>
        {label && <p className="mt-1 text-[11px] font-semibold tabular-nums text-slate-500">{label}</p>}
        {entry.travelConfirmed && (
          <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-sky-600">
            <Plane size={11} /> Reservas confirmadas
          </p>
        )}
        {entry.notes && <p className="mt-1 whitespace-pre-wrap text-[11px] text-slate-600">{entry.notes}</p>}
        {entry.link && (
          <a
            href={entry.link}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="pointer-events-auto mt-1 flex items-center gap-1 truncate text-[11px] font-medium text-indigo-600 hover:underline"
          >
            <Link2 size={11} className="shrink-0" /> {entry.link}
          </a>
        )}
      </div>
    </div>
  )
}
