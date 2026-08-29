import { useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import type { Entry } from '../types'
import EntryRow from './EntryRow'

type Props = {
  memberId: string
  date: string
  entries: Entry[]
  isWeekend: boolean
  isToday: boolean
  isHoliday: boolean
  onCellClick: (e: React.MouseEvent) => void
  onRemoveEntry: (entryId: string) => void
}

export default function DayCell({
  memberId,
  date,
  entries,
  isWeekend,
  isToday,
  isHoliday,
  onCellClick,
  onRemoveEntry,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: `cell:${memberId}:${date}` })

  return (
    <div
      ref={setNodeRef}
      data-member={memberId}
      data-date={date}
      className={`group relative flex min-h-[44px] flex-col gap-[2px] border-b border-r border-slate-100 p-0.5 ${
        isWeekend ? 'bg-slate-50/70' : 'bg-white'
      } ${isHoliday ? 'bg-rose-50' : ''} ${isOver ? 'ring-2 ring-inset ring-indigo-400' : ''} ${
        isToday ? 'outline outline-2 -outline-offset-2 outline-indigo-300' : ''
      }`}
    >
      {entries.map((entry) => (
        <EntryRow key={entry.id} entry={entry} onClick={onCellClick} onRemove={() => onRemoveEntry(entry.id)} />
      ))}
      <button
        onClick={onCellClick}
        className={`flex w-full items-center justify-center rounded-md text-slate-300 hover:bg-indigo-50 hover:text-indigo-400 ${
          entries.length === 0 ? 'h-full opacity-0 group-hover:opacity-100' : 'h-3 opacity-0 group-hover:opacity-100'
        }`}
      >
        <Plus size={12} />
      </button>
    </div>
  )
}
