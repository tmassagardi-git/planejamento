import { useDraggable } from '@dnd-kit/core'
import { X } from 'lucide-react'
import type { Entry } from '../types'
import { textColorFor, withAlpha } from '../utils/color'

type Props = {
  entry: Entry
  mergeLeft: boolean
  mergeRight: boolean
  onClick: (e: React.MouseEvent) => void
  onRemove: () => void
  onResizeStart: (e: React.PointerEvent) => void
}

export default function Block({ entry, mergeLeft, mergeRight, onClick, onRemove, onResizeStart }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `block:${entry.memberId}:${entry.date}`,
  })

  if (entry.isFullDay) {
    const textColor = textColorFor(entry.color)
    return (
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className="group relative flex h-full w-full cursor-grab items-center overflow-hidden px-1 text-[11px] font-bold active:cursor-grabbing"
        style={{
          backgroundColor: entry.color,
          color: textColor,
          opacity: isDragging ? 0.35 : 1,
          borderRadius: `${mergeLeft ? 0 : 6}px ${mergeRight ? 0 : 6}px ${mergeRight ? 0 : 6}px ${mergeLeft ? 0 : 6}px`,
          touchAction: 'none',
        }}
        onClick={onClick}
      >
        {!mergeLeft && <span className="flex-1 truncate">{entry.label}</span>}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="absolute right-0.5 top-0.5 rounded-full p-0.5 opacity-0 hover:bg-black/15 group-hover:opacity-100"
          style={{ color: textColor }}
        >
          <X size={11} />
        </button>
        {!mergeRight && (
          <div
            onPointerDown={(e) => {
              e.stopPropagation()
              onResizeStart(e)
            }}
            className="absolute right-0 top-0 h-full w-3 cursor-ew-resize opacity-0 hover:opacity-100"
            style={{ background: `linear-gradient(to right, transparent, ${withAlpha('#000000', 0.15)})` }}
          />
        )}
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      className="group relative flex h-full w-full cursor-pointer items-center rounded-md border-l-[3px] bg-slate-50 px-1.5 text-[11px] font-semibold text-slate-600"
      style={{ borderLeftColor: entry.color, opacity: isDragging ? 0.35 : 1 }}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <span className="truncate">{entry.label}</span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="absolute right-0.5 top-0.5 rounded-full p-0.5 text-slate-400 opacity-0 hover:bg-slate-200 group-hover:opacity-100"
      >
        <X size={10} />
      </button>
    </div>
  )
}
