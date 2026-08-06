import { useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import type { Entry } from '../types'
import Block from './Block'

type Props = {
  memberId: string
  date: string
  entry?: Entry
  mergeLeft: boolean
  mergeRight: boolean
  isWeekend: boolean
  isToday: boolean
  isHoliday: boolean
  onCellClick: (e: React.MouseEvent) => void
  onRemove: () => void
  onResizeStart: (e: React.PointerEvent) => void
}

export default function DayCell({
  memberId,
  date,
  entry,
  mergeLeft,
  mergeRight,
  isWeekend,
  isToday,
  isHoliday,
  onCellClick,
  onRemove,
  onResizeStart,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: `cell:${memberId}:${date}` })

  return (
    <div
      ref={setNodeRef}
      data-member={memberId}
      data-date={date}
      className={`group relative h-11 border-b border-slate-100 py-0.5 ${mergeRight ? '' : 'border-r pr-0.5'} ${
        mergeLeft ? '' : 'pl-0.5'
      } ${isWeekend ? 'bg-slate-50/70' : 'bg-white'} ${isHoliday ? 'bg-rose-50' : ''} ${
        isOver ? 'ring-2 ring-inset ring-indigo-400' : ''
      } ${isToday ? 'outline outline-2 -outline-offset-2 outline-indigo-300' : ''}`}
    >
      {entry ? (
        <Block entry={entry} mergeLeft={mergeLeft} mergeRight={mergeRight} onClick={onCellClick} onRemove={onRemove} onResizeStart={onResizeStart} />
      ) : (
        <button
          onClick={onCellClick}
          className="flex h-full w-full items-center justify-center rounded-md text-slate-300 opacity-0 hover:bg-indigo-50 hover:text-indigo-400 group-hover:opacity-100"
        >
          <Plus size={14} />
        </button>
      )}
    </div>
  )
}
