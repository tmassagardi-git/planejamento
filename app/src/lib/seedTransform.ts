import raw from '../data/seed.json'
import type { AppData, Company, Contract, MonthlyEntry, Reimbursement, Settlement } from './types'

interface RawContract {
  id: string
  company: Company
  name: string
}
interface RawMonthlyEntry {
  contractId: string
  year: number
  month: number
  gross: number
  repasse: number | null
}
interface RawReimbursement {
  year: number
  month: number
  company: Company
  description: string
  amount: number
}
interface RawSettlement {
  year: number
  month: number
  fromCompany?: Company
  toCompany?: Company
  kind: 'repasseTotal' | 'saldo' | 'paymentDate'
  value: number | string
}
interface RawMeta {
  name: string
  inicio: string | null
  fim: string | null
  diasParaVencer: number | null
  clausulaReajuste: string | null
  despesasDeslocamento: string | null
}

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function toIsoDate(v: string | null): string | null {
  if (!v) return null
  // stored as full ISO datetime from python; keep just the date part
  return v.slice(0, 10)
}

// Rows that are one-off events/expenses rather than real client contracts —
// never let them borrow a real contract's start/end dates via name matching.
const META_MATCH_BLOCKLIST = [
  'jantar', 'evento', 'confraterniza', 'premiacao', 'hospedagem', 'ajuste', 'dif ', 'reembolso', 'reemb ',
]

function isEventLike(normName: string): boolean {
  return META_MATCH_BLOCKLIST.some((kw) => normName.includes(kw))
}

export function buildInitialData(): AppData {
  const data = raw as unknown as {
    contracts: RawContract[]
    monthlyEntries: RawMonthlyEntry[]
    reimbursements: RawReimbursement[]
    settlements: RawSettlement[]
    contractsMeta: RawMeta[]
  }

  const metaByNorm = data.contractsMeta.map((m) => ({ ...m, norm: normalize(m.name) }))

  const contracts: Contract[] = data.contracts.map((c) => {
    const cn = normalize(c.name)
    const match = isEventLike(cn) ? undefined : metaByNorm.find((m) => cn.includes(m.norm) || m.norm.includes(cn))
    return {
      id: c.id,
      name: c.name,
      company: c.company,
      startDate: match ? toIsoDate(match.inicio) : null,
      endDate: match ? toIsoDate(match.fim) : null,
      reajusteClause: match?.clausulaReajuste ?? null,
      travelExpense: match?.despesasDeslocamento ?? null,
      notes: '',
      archived: false,
    }
  })

  const monthlyEntries: MonthlyEntry[] = data.monthlyEntries.map((e) => ({
    id: `${e.contractId}-${e.year}-${String(e.month).padStart(2, '0')}`,
    contractId: e.contractId,
    year: e.year,
    month: e.month,
    gross: typeof e.gross === 'number' ? e.gross : 0,
    repasse: e.repasse,
  }))

  const reimbursements: Reimbursement[] = data.reimbursements.map((r, i) => ({
    id: `reemb-${r.company}-${r.year}-${String(r.month).padStart(2, '0')}-${i}`,
    year: r.year,
    month: r.month,
    company: r.company,
    description: r.description,
    amount: typeof r.amount === 'number' ? r.amount : 0,
  }))

  const settlementMap = new Map<string, Settlement>()
  const key = (y: number, m: number) => `${y}-${m}`
  for (const s of data.settlements) {
    const k = key(s.year, s.month)
    if (!settlementMap.has(k)) {
      settlementMap.set(k, { year: s.year, month: s.month, saldoEverest: null, paymentDate: null })
    }
    const entry = settlementMap.get(k)!
    if (s.kind === 'saldo' && typeof s.value === 'number') entry.saldoEverest = s.value
    if (s.kind === 'paymentDate' && typeof s.value === 'string') entry.paymentDate = toIsoDate(s.value)
  }
  const settlements = Array.from(settlementMap.values()).sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month
  )

  return {
    contracts,
    monthlyEntries,
    reimbursements,
    settlements,
    settings: {
      repassePercent: 0.4235900475,
      taxJungers: 0.21,
      taxEverest: 0.135,
    },
  }
}
