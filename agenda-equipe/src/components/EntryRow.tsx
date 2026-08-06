import { useDraggable } from '@dnd-kit/core'
import { X } from 'lucide-react'
import type { Entry } from '../types'
import { withAlpha } from '../utils/color'
import ModalityIcon from './ModalityIcon'

type Props = {
  entry: Entry
  onClick: (e: React.MouseEvent) => void
  onRemove: () => void
}

export default function EntryRow({ entry, onClick, onRemove }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `entry:${entry.id}` })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="group relative flex w-full cursor-grab items-center gap-1 rounded px-1 py-[3px] text-[10px] font-semibold leading-tight text-slate-700 active:cursor-grabbing"
      style={{
        backgroundColor: withAlpha(entry.color, 0.16),
        borderLeft: `3px solid ${entry.color}`,
        opacity: isDragging ? 0.35 : 1,
        touchAction: 'none',
      }}
      onClick={onClick}
      title={entry.time ? `${entry.time} · ${entry.label}` : entry.label}
    >
      {entry.time && <span className="shrink-0 tabular-nums text-slate-500">{entry.time}</span>}
      <span className="flex-1 truncate">{entry.label}</span>
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
    </div>
  )
}
