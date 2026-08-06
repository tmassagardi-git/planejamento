import { CalendarOff, CalendarPlus } from 'lucide-react'
import { useState } from 'react'
import { cellEntries, useStore } from '../store'
import type { Entry } from '../types'
import { daysInMonth, isActiveInMonth, isSameDay, isWeekend, toISO, weekdayShort } from '../utils/date'
import DayCell from './DayCell'
import QuickAddPopover from './QuickAddPopover'

type Props = {
  month: Date
}

type SelectedCell = { memberId: string; date: string; anchor: { x: number; y: number } }

const NAME_COL = 168
const DAY_COL = 108

export default function CalendarGrid({ month }: Props) {
  const allMembers = useStore((s) => [...s.members].sort((a, b) => a.order - b.order))
  const members = allMembers.filter((m) => isActiveInMonth(m.startDate, m.endDate, month))
  const entries = useStore((s) => s.entries)
  const holidays = useStore((s) => s.holidays)
  const setHoliday = useStore((s) => s.setHoliday)
  const clearHoliday = useStore((s) => s.clearHoliday)
  const removeEntry = useStore((s) => s.removeEntry)

  const [selected, setSelected] = useState<SelectedCell | null>(null)

  const days = daysInMonth(month)
  const today = new Date()

  function toggleHoliday(dateIso: string) {
    const existing = holidays[dateIso]
    const input = window.prompt(
      existing ? `Editar feriado de ${dateIso} (vazio para remover):` : `Nome do feriado em ${dateIso}:`,
      existing?.label ?? '',
    )
    if (input === null) return
    if (input.trim() === '') clearHoliday(dateIso)
    else setHoliday(dateIso, input.trim())
  }

  return (
    <div className="relative flex-1 overflow-auto">
      <div
        className="grid min-w-max items-stretch"
        style={{ gridTemplateColumns: `${NAME_COL}px repeat(${days.length}, ${DAY_COL}px)`, gridAutoRows: 'min-content' }}
      >
        {/* Header row */}
        <div className="sticky left-0 top-0 z-30 flex items-center border-b border-r border-slate-200 bg-white px-3 text-xs font-bold uppercase tracking-wide text-slate-400">
          Consultor
        </div>
        {days.map((day) => {
          const iso = toISO(day)
          const holiday = holidays[iso]
          const weekend = isWeekend(day)
          return (
            <div
              key={iso}
              onClick={() => toggleHoliday(iso)}
              title={holiday ? holiday.label : 'Marcar feriado'}
              className={`sticky top-0 z-20 flex cursor-pointer flex-col items-center justify-center border-b border-r border-slate-200 py-1 text-[11px] font-semibold ${
                holiday ? 'bg-rose-100 text-rose-600' : weekend ? 'bg-slate-100 text-slate-400' : 'bg-white text-slate-500'
              }`}
            >
              <span className="leading-none">{weekdayShort(day)}</span>
              <span className="text-sm leading-none">{day.getDate()}</span>
              {holiday && <CalendarOff size={10} className="mt-0.5" />}
            </div>
          )
        })}

        {/* Member rows */}
        {members.map((member) => (
          <MemberRow
            key={member.id}
            memberId={member.id}
            memberName={member.name}
            memberColor={member.color}
            days={days}
            entries={entries}
            holidays={holidays}
            today={today}
            onCellClick={(memberId, date, e) => setSelected({ memberId, date, anchor: { x: e.clientX, y: e.clientY } })}
            onRemoveEntry={removeEntry}
          />
        ))}

        {members.length === 0 && allMembers.length === 0 && (
          <div className="col-span-full flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
            <CalendarPlus size={16} /> Adicione pessoas da equipe para começar.
          </div>
        )}
        {members.length === 0 && allMembers.length > 0 && (
          <div className="col-span-full flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
            <CalendarPlus size={16} /> Nenhum membro da equipe ativo neste mês.
          </div>
        )}
      </div>

      {selected &&
        (() => {
          const member = members.find((m) => m.id === selected.memberId)
          if (!member) return null
          return (
            <QuickAddPopover
              memberId={selected.memberId}
              memberName={member.name}
              date={selected.date}
              entries={cellEntries(entries, selected.memberId, selected.date)}
              anchor={selected.anchor}
              onClose={() => setSelected(null)}
            />
          )
        })()}
    </div>
  )
}

function MemberRow({
  memberId,
  memberName,
  memberColor,
  days,
  entries,
  holidays,
  today,
  onCellClick,
  onRemoveEntry,
}: {
  memberId: string
  memberName: string
  memberColor: string
  days: Date[]
  entries: Record<string, Entry>
  holidays: Record<string, { date: string; label: string }>
  today: Date
  onCellClick: (memberId: string, date: string, e: React.MouseEvent) => void
  onRemoveEntry: (entryId: string) => void
}) {
  return (
    <>
      <div className="sticky left-0 z-10 flex items-center gap-2 border-b border-r border-slate-200 bg-white px-3">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ backgroundColor: memberColor }}
        >
          {memberName.charAt(0).toUpperCase()}
        </span>
        <span className="truncate text-sm font-semibold text-slate-700">{memberName}</span>
      </div>
      {days.map((day) => {
        const iso = toISO(day)
        return (
          <DayCell
            key={iso}
            memberId={memberId}
            date={iso}
            entries={cellEntries(entries, memberId, iso)}
            isWeekend={isWeekend(day)}
            isToday={isSameDay(day, today)}
            isHoliday={!!holidays[iso]}
            onCellClick={(e) => onCellClick(memberId, iso, e)}
            onRemoveEntry={onRemoveEntry}
          />
        )
      })}
    </>
  )
}
