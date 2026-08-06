import { useDraggable } from '@dnd-kit/core'
import { textColorFor } from '../utils/color'

type Props = {
  dragId: string
  label: string
  sublabel?: string
  color: string
}

export default function PaletteChip({ dragId, label, sublabel, color }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: dragId })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="inline-flex w-fit cursor-grab items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold shadow-soft transition-opacity active:cursor-grabbing"
      style={{
        backgroundColor: color,
        color: textColorFor(color),
        opacity: isDragging ? 0.3 : 1,
        touchAction: 'none',
      }}
      title={sublabel}
    >
      <span className="truncate">{label}</span>
    </div>
  )
}
