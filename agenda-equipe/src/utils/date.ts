import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  isWeekend,
  startOfMonth,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function toISO(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function monthLabel(date: Date): string {
  const label = format(date, 'LLLL yyyy', { locale: ptBR })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function weekdayShort(date: Date): string {
  const label = format(date, 'EEEEEE', { locale: ptBR })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function daysInMonth(monthDate: Date): Date[] {
  return eachDayOfInterval({
    start: startOfMonth(monthDate),
    end: endOfMonth(monthDate),
  })
}

export function goToNextMonth(monthDate: Date): Date {
  return addMonths(monthDate, 1)
}

export function goToPrevMonth(monthDate: Date): Date {
  return subMonths(monthDate, 1)
}

export { isSameDay, isSameMonth, isWeekend }
