import type { Entry } from '../types'

export function timeLabel(entry: Pick<Entry, 'allDay' | 'time' | 'endTime'>): string {
  if (entry.allDay) return 'Dia todo'
  if (!entry.time) return ''
  return entry.endTime ? `${entry.time}–${entry.endTime}` : entry.time
}
