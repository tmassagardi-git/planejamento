import { ChevronLeft, ChevronRight } from 'lucide-react'
import { goToNextMonth, goToPrevMonth, monthLabel } from '../utils/date'

type Props = {
  month: Date
  onChangeMonth: (date: Date) => void
}

export default function Header({ month, onChangeMonth }: Props) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChangeMonth(goToPrevMonth(month))}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="w-48 text-center text-lg font-bold text-slate-800">{monthLabel(month)}</h2>
        <button
          onClick={() => onChangeMonth(goToNextMonth(month))}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <button
        onClick={() => onChangeMonth(new Date())}
        className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-200"
      >
        Hoje
      </button>
    </header>
  )
}
