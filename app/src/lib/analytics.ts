import type { AppData, Company, Contract, MonthlyEntry } from './types'

export function effectiveRepasse(entry: MonthlyEntry, settings: AppData['settings']): number {
  if (entry.repasse !== null && entry.repasse !== undefined) return entry.repasse
  return entry.gross * settings.repassePercent
}

export function periodKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function periodLabel(year: number, month: number): string {
  const short = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${short[month - 1]}/${String(year).slice(2)}`
}

export interface MonthPoint {
  key: string
  year: number
  month: number
  label: string
  jungers: number
  everest: number
  total: number
}

/** Gross contract revenue per company per month, net of reimbursements (reimbursements are a separate ledger, not included in gross). */
export function grossByMonth(data: AppData): MonthPoint[] {
  const map = new Map<string, MonthPoint>()
  for (const e of data.monthlyEntries) {
    const contract = data.contracts.find((c) => c.id === e.contractId)
    if (!contract) continue
    const key = periodKey(e.year, e.month)
    if (!map.has(key)) {
      map.set(key, { key, year: e.year, month: e.month, label: periodLabel(e.year, e.month), jungers: 0, everest: 0, total: 0 })
    }
    const point = map.get(key)!
    if (contract.company === 'JUNGERS') point.jungers += e.gross
    else point.everest += e.gross
    point.total += e.gross
  }
  return Array.from(map.values()).sort((a, b) => (a.year - b.year) || (a.month - b.month))
}

export interface RepasseFlowPoint {
  key: string
  year: number
  month: number
  label: string
  jungersToEverest: number
  everestToJungers: number
  net: number
}

/** Transfers between the two partner companies, derived from each contract's repasse. */
export function repasseFlowByMonth(data: AppData): RepasseFlowPoint[] {
  const map = new Map<string, RepasseFlowPoint>()
  for (const e of data.monthlyEntries) {
    const contract = data.contracts.find((c) => c.id === e.contractId)
    if (!contract) continue
    const key = periodKey(e.year, e.month)
    if (!map.has(key)) {
      map.set(key, { key, year: e.year, month: e.month, label: periodLabel(e.year, e.month), jungersToEverest: 0, everestToJungers: 0, net: 0 })
    }
    const point = map.get(key)!
    const value = effectiveRepasse(e, data.settings)
    if (contract.company === 'JUNGERS') point.jungersToEverest += value
    else point.everestToJungers += value
  }
  for (const point of map.values()) point.net = point.jungersToEverest - point.everestToJungers
  return Array.from(map.values()).sort((a, b) => (a.year - b.year) || (a.month - b.month))
}

export interface ReimbursementPoint {
  key: string
  year: number
  month: number
  label: string
  jungers: number
  everest: number
  total: number
}

export function reimbursementsByMonth(data: AppData): ReimbursementPoint[] {
  const map = new Map<string, ReimbursementPoint>()
  for (const r of data.reimbursements) {
    const key = periodKey(r.year, r.month)
    if (!map.has(key)) {
      map.set(key, { key, year: r.year, month: r.month, label: periodLabel(r.year, r.month), jungers: 0, everest: 0, total: 0 })
    }
    const point = map.get(key)!
    if (r.company === 'JUNGERS') point.jungers += r.amount
    else point.everest += r.amount
    point.total += r.amount
  }
  return Array.from(map.values()).sort((a, b) => (a.year - b.year) || (a.month - b.month))
}

const RECENT_ACTIVITY_MONTHS = 6

/**
 * A contract counts as active if it has an explicit end date still in the future, or — when no
 * end date is on file (true for most of the historical contracts imported from the spreadsheet) —
 * if it was actually billed in the last few months. A contract nobody has invoiced in half a year
 * with no end date recorded is presumed discontinued rather than active forever.
 */
export function isActive(contract: Contract, today: Date, monthlyEntries?: MonthlyEntry[]): boolean {
  if (contract.archived) return false
  if (contract.startDate && new Date(contract.startDate).getTime() > today.getTime()) return false
  if (contract.endDate) {
    return new Date(contract.endDate).getTime() >= today.getTime()
  }
  if (!monthlyEntries) return true
  const own = monthlyEntries.filter((e) => e.contractId === contract.id)
  if (own.length === 0) return true // just created, no billing history yet
  const cutoff = new Date(today.getFullYear(), today.getMonth() - RECENT_ACTIVITY_MONTHS, 1)
  return own.some((e) => e.gross > 0 && new Date(e.year, e.month - 1, 1).getTime() >= cutoff.getTime())
}

export function daysUntil(dateIso: string | null, today: Date): number | null {
  if (!dateIso) return null
  const end = new Date(dateIso)
  return Math.round((end.getTime() - today.getTime()) / 86_400_000)
}

/**
 * Most recent month at or before `today` with at least one recorded gross value — used as the
 * reference month for "current" stats. Bounded by `today` so that far-future planning sheets
 * (2027-2029 in the source spreadsheet) don't get picked as "now".
 */
export function latestPeriod(data: AppData, today: Date): { year: number; month: number } | null {
  const y = today.getFullYear()
  const m = today.getMonth() + 1
  let best: { year: number; month: number } | null = null
  for (const e of data.monthlyEntries) {
    if (e.gross <= 0) continue
    if (e.year > y || (e.year === y && e.month > m)) continue
    if (!best || e.year > best.year || (e.year === best.year && e.month > best.month)) {
      best = { year: e.year, month: e.month }
    }
  }
  return best
}

export function averageGrossByCompany(data: AppData, company: Company, year: number, month: number): number {
  const entries = data.monthlyEntries.filter((e) => e.year === year && e.month === month && e.gross > 0)
  const ids = new Set(data.contracts.filter((c) => c.company === company).map((c) => c.id))
  const relevant = entries.filter((e) => ids.has(e.contractId))
  if (relevant.length === 0) return 0
  return relevant.reduce((sum, e) => sum + e.gross, 0) / relevant.length
}

export function activeCountByCompany(data: AppData, today: Date): Record<Company, number> {
  const result: Record<Company, number> = { JUNGERS: 0, EVEREST: 0 }
  for (const c of data.contracts) {
    if (isActive(c, today, data.monthlyEntries)) result[c.company] += 1
  }
  return result
}

export function upcomingExpirations(data: AppData, today: Date, withinDays = 120): Array<Contract & { daysLeft: number }> {
  return data.contracts
    .filter((c) => !c.archived && c.endDate)
    .map((c) => ({ ...c, daysLeft: daysUntil(c.endDate, today)! }))
    .filter((c) => c.daysLeft >= -30 && c.daysLeft <= withinDays)
    .sort((a, b) => a.daysLeft - b.daysLeft)
}

export function sumLastNMonths<T extends { year: number; month: number }>(points: T[], n: number): T[] {
  return points.slice(Math.max(0, points.length - n))
}
