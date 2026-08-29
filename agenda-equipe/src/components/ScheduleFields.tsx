import { Building2, Plane, Video } from 'lucide-react'
import type { Modality } from '../types'

type Props = {
  allDay: boolean
  onAllDayChange: (allDay: boolean) => void
  time: string
  onTimeChange: (time: string) => void
  endTime: string
  onEndTimeChange: (endTime: string) => void
  modality: Modality | undefined
  onModalityChange: (modality: Modality | undefined) => void
  travelConfirmed: boolean
  onTravelConfirmedChange: (value: boolean) => void
  notes: string
  onNotesChange: (notes: string) => void
  link: string
  onLinkChange: (link: string) => void
  compact?: boolean
}

export default function ScheduleFields({
  allDay,
  onAllDayChange,
  time,
  onTimeChange,
  endTime,
  onEndTimeChange,
  modality,
  onModalityChange,
  travelConfirmed,
  onTravelConfirmedChange,
  notes,
  onNotesChange,
  link,
  onLinkChange,
  compact,
}: Props) {
  function setModality(next: Modality | undefined) {
    onModalityChange(next)
    if (next !== 'presencial') onTravelConfirmedChange(false)
  }
  const inputCls = `w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-indigo-400 focus:outline-none ${
    compact ? 'px-1.5 py-1 text-xs' : ''
  }`
  const labelCls = `mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400`

  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-3'}>
      <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5">
        <button
          type="button"
          onClick={() => onAllDayChange(true)}
          className={`flex-1 rounded-md px-2 py-1 text-xs font-semibold ${
            allDay ? 'bg-white text-indigo-600 shadow-soft' : 'text-slate-500'
          }`}
        >
          Dia todo
        </button>
        <button
          type="button"
          onClick={() => onAllDayChange(false)}
          className={`flex-1 rounded-md px-2 py-1 text-xs font-semibold ${
            !allDay ? 'bg-white text-indigo-600 shadow-soft' : 'text-slate-500'
          }`}
        >
          Hora agendada
        </button>
      </div>

      {!allDay && (
        <div className="flex gap-2">
          <div className="flex-1">
            {!compact && <label className={labelCls}>Início</label>}
            <input type="time" value={time} onChange={(e) => onTimeChange(e.target.value)} className={`${inputCls} tabular-nums`} />
          </div>
          <div className="flex-1">
            {!compact && <label className={labelCls}>Término</label>}
            <input
              type="time"
              value={endTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
              className={`${inputCls} tabular-nums`}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        {!compact && <span className={`${labelCls} mb-0`}>Formato</span>}
        <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5">
          <button
            type="button"
            title="Presencial"
            onClick={() => setModality(modality === 'presencial' ? undefined : 'presencial')}
            className={`rounded-md p-[7px] ${
              modality === 'presencial' ? 'bg-white text-indigo-600 shadow-soft' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Building2 size={compact ? 13 : 16} />
          </button>
          <button
            type="button"
            title="Online"
            onClick={() => setModality(modality === 'online' ? undefined : 'online')}
            className={`rounded-md p-[7px] ${
              modality === 'online' ? 'bg-white text-indigo-600 shadow-soft' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Video size={compact ? 13 : 16} />
          </button>
        </div>
      </div>

      {modality === 'presencial' && (
        <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs font-medium text-sky-700">
          <input
            type="checkbox"
            checked={travelConfirmed}
            onChange={(e) => onTravelConfirmedChange(e.target.checked)}
            className="h-3.5 w-3.5 accent-sky-600"
          />
          <Plane size={13} className="shrink-0" />
          Reservas confirmadas (voo, hospedagem, etc)
        </label>
      )}

      <div>
        {!compact && <label className={labelCls}>Anotações (opcional)</label>}
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder={compact ? 'Anotações...' : 'Detalhes que aparecem ao passar o mouse...'}
          rows={compact ? 1 : 2}
          className={`${inputCls} resize-none`}
        />
      </div>

      <div>
        {!compact && <label className={labelCls}>Link da reunião (opcional)</label>}
        <input
          value={link}
          onChange={(e) => onLinkChange(e.target.value)}
          placeholder="https://..."
          className={inputCls}
        />
      </div>
    </div>
  )
}
