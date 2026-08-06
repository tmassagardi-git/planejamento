import { CalendarOff, CalendarPlus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import type { Entry } from '../types'
import { daysInMonth, isSameDay, isWeekend, toISO, weekdayShort } from '../utils/date'
import DayCell from './DayCell'
import QuickAddPopover from './QuickAddPopover'

type Props = {
  month: Date
}

type SelectedCell = { memberId: string; date: string; anchor: { x: number; y: number } }
type ResizeSession = { memberId: string; fromDate: string }
type Resizing = { memberId: string; fromDate: string; hoverDate: string }

const NAME_COL = 168
const DAY_COL = 64

export default function CalendarGrid({ month }: Props) {
  const members = useStore((s) => [...s.members].sort((a, b) => a.order - b.order))
  const entries = useStore((s) => s.entries)
  const holidays = useStore((s) => s.holidays)
  const setHoliday = useStore((s) => s.setHoliday)
  const clearHoliday = useStore((s) => s.clearHoliday)
  const clearEntry = useStore((s) => s.clearEntry)
  const extendEntryRange = useStore((s) => s.extendEntryRange)

  const [selected, setSelected] = useState<SelectedCell | null>(null)
  const [resizeSession, setResizeSession] = useState<ResizeSession | null>(null)
  const [hoverDate, setHoverDate] = useState<string | null>(null)
  const hoverDateRef = useRef<string | null>(null)

  const days = daysInMonth(month)
  const today = new Date()

  useEffect(() => {
    if (!resizeSession) return
    const { memberId, fromDate } = resizeSession
    hoverDateRef.current = fromDate

    function onMove(e: PointerEvent) {
      const el = document.elementFromPoint(e.clientX, e.clientY)
      const cell = el?.closest<HTMLElement>('[data-member][data-date]')
      if (cell && cell.dataset.member === memberId && cell.dataset.date) {
        hoverDateRef.current = cell.dataset.date
        setHoverDate(cell.dataset.date)
      }
    }
    function onUp() {
      extendEntryRange(memberId, fromDate, hoverDateRef.current ?? fromDate)
      setResizeSession(null)
      setHoverDate(null)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [resizeSession, extendEntryRange])

  const resizing: Resizing | null = resizeSession
    ? { memberId: resizeSession.memberId, fromDate: resizeSession.fromDate, hoverDate: hoverDate ?? resizeSession.fromDate }
    : null

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
        className="grid min-w-max"
        style={{ gridTemplateColumns: `${NAME_COL}px repeat(${days.length}, ${DAY_COL}px)` }}
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
        {members.map((member) => {
          return (
            <FragmentRow
              key={member.id}
              memberId={member.id}
              memberName={member.name}
              memberColor={member.color}
              days={days}
              entries={entries}
              holidays={holidays}
              today={today}
              resizing={resizing}
              onCellClick={(memberId, date, e) =>
                setSelected({ memberId, date, anchor: { x: e.clientX, y: e.clientY } })
              }
              onRemove={(memberId, date) => clearEntry(memberId, date)}
              onResizeStart={(memberId, fromDate, e) => {
                e.preventDefault()
                setResizeSession({ memberId, fromDate })
              }}
            />
          )
        })}

        {members.length === 0 && (
          <div className="col-span-full flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
            <CalendarPlus size={16} /> Adicione pessoas da equipe para começar.
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
              entry={entries[`${selected.memberId}|${selected.date}`]}
              anchor={selected.anchor}
              onClose={() => setSelected(null)}
            />
          )
        })()}
    </div>
  )
}

function FragmentRow({
  memberId,
  memberName,
  memberColor,
  days,
  entries,
  holidays,
  today,
  resizing,
  onCellClick,
  onRemove,
  onResizeStart,
}: {
  memberId: string
  memberName: string
  memberColor: string
  days: Date[]
  entries: Record<string, Entry>
  holidays: Record<string, { date: string; label: string }>
  today: Date
  resizing: Resizing | null
  onCellClick: (memberId: string, date: string, e: React.MouseEvent) => void
  onRemove: (memberId: string, date: string) => void
  onResizeStart: (memberId: string, fromDate: string, e: React.PointerEvent) => void
}) {
  const isoList = days.map(toISO)

  function entryAt(idx: number): Entry | undefined {
    return entries[`${memberId}|${isoList[idx]}`]
  }

  function sameBlock(a?: Entry, b?: Entry) {
    return !!a && !!b && a.isFullDay && b.isFullDay && a.kind === b.kind && a.refId === b.refId
  }

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
      {days.map((day, idx) => {
        const iso = isoList[idx]
        const entry = entryAt(idx)
        const prev = idx > 0 ? entryAt(idx - 1) : undefined
        const next = idx < days.length - 1 ? entryAt(idx + 1) : undefined
        const inResizePreview =
          !!resizing &&
          resizing.memberId === memberId &&
          iso >= (resizing.fromDate < resizing.hoverDate ? resizing.fromDate : resizing.hoverDate) &&
          iso <= (resizing.fromDate < resizing.hoverDate ? resizing.hoverDate : resizing.fromDate)
        return (
          <div key={iso} className={inResizePreview ? 'ring-2 ring-inset ring-indigo-300' : ''}>
            <DayCell
              memberId={memberId}
              date={iso}
              entry={entry}
              mergeLeft={sameBlock(entry, prev)}
              mergeRight={sameBlock(entry, next)}
              isWeekend={isWeekend(day)}
              isToday={isSameDay(day, today)}
              isHoliday={!!holidays[iso]}
              onCellClick={(e) => onCellClick(memberId, iso, e)}
              onRemove={() => onRemove(memberId, iso)}
              onResizeStart={(e) => onResizeStart(memberId, iso, e)}
            />
          </div>
        )
      })}
    </>
  )
}
