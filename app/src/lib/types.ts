export type Company = 'JUNGERS' | 'EVEREST'

export interface Contract {
  id: string
  name: string
  company: Company
  startDate: string | null // ISO yyyy-mm-dd
  endDate: string | null // ISO yyyy-mm-dd
  reajusteClause: string | null
  travelExpense: string | null
  notes: string
  archived: boolean
}

export interface MonthlyEntry {
  id: string
  contractId: string
  year: number
  month: number // 1-12
  gross: number
  repasse: number | null
}

export interface Reimbursement {
  id: string
  year: number
  month: number
  company: Company
  description: string
  amount: number
}

export interface Settlement {
  year: number
  month: number
  saldoEverest: number | null
  paymentDate: string | null
}

export interface Settings {
  repassePercent: number
  taxJungers: number
  taxEverest: number
}

export interface AppData {
  contracts: Contract[]
  monthlyEntries: MonthlyEntry[]
  reimbursements: Reimbursement[]
  settlements: Settlement[]
  settings: Settings
}

export const COMPANY_LABEL: Record<Company, string> = {
  JUNGERS: 'Jungers',
  EVEREST: 'Everest',
}

export const MONTH_LABELS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

export const MONTH_LABELS_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
