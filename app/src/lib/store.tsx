import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { buildInitialData } from './seedTransform'
import type { AppData, Company, Contract, MonthlyEntry, Reimbursement, Settings } from './types'

const STORAGE_KEY = 'contratos-repasses:v1'

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AppData
  } catch {
    // ignore corrupt storage
  }
  return buildInitialData()
}

function save(data: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // storage full / unavailable — edits stay in-memory for this session
  }
}

let uid = 0
function newId(prefix: string) {
  uid += 1
  return `${prefix}-${Date.now().toString(36)}-${uid}`
}

interface Store {
  data: AppData
  addContract: (input: Omit<Contract, 'id' | 'archived'>) => string
  updateContract: (id: string, patch: Partial<Contract>) => void
  removeContract: (id: string) => void
  upsertMonthlyEntry: (contractId: string, year: number, month: number, patch: Partial<Pick<MonthlyEntry, 'gross' | 'repasse'>>) => void
  addReimbursement: (input: Omit<Reimbursement, 'id'>) => void
  updateReimbursement: (id: string, patch: Partial<Reimbursement>) => void
  removeReimbursement: (id: string) => void
  setSaldo: (year: number, month: number, patch: { saldoEverest?: number | null; paymentDate?: string | null }) => void
  updateSettings: (patch: Partial<Settings>) => void
  resetToSeed: () => void
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(load)

  useEffect(() => {
    save(data)
  }, [data])

  const addContract = useCallback((input: Omit<Contract, 'id' | 'archived'>) => {
    const id = newId(input.company === 'JUNGERS' ? 'J' : 'E')
    setData((d) => ({ ...d, contracts: [...d.contracts, { ...input, id, archived: false }] }))
    return id
  }, [])

  const updateContract = useCallback((id: string, patch: Partial<Contract>) => {
    setData((d) => ({
      ...d,
      contracts: d.contracts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }))
  }, [])

  const removeContract = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      contracts: d.contracts.filter((c) => c.id !== id),
      monthlyEntries: d.monthlyEntries.filter((e) => e.contractId !== id),
    }))
  }, [])

  const upsertMonthlyEntry = useCallback(
    (contractId: string, year: number, month: number, patch: Partial<Pick<MonthlyEntry, 'gross' | 'repasse'>>) => {
      setData((d) => {
        const idx = d.monthlyEntries.findIndex((e) => e.contractId === contractId && e.year === year && e.month === month)
        if (idx === -1) {
          const entry: MonthlyEntry = {
            id: `${contractId}-${year}-${String(month).padStart(2, '0')}`,
            contractId,
            year,
            month,
            gross: patch.gross ?? 0,
            repasse: patch.repasse ?? null,
          }
          return { ...d, monthlyEntries: [...d.monthlyEntries, entry] }
        }
        const entries = d.monthlyEntries.slice()
        entries[idx] = { ...entries[idx], ...patch }
        return { ...d, monthlyEntries: entries }
      })
    },
    []
  )

  const addReimbursement = useCallback((input: Omit<Reimbursement, 'id'>) => {
    setData((d) => ({ ...d, reimbursements: [...d.reimbursements, { ...input, id: newId('reemb') }] }))
  }, [])

  const updateReimbursement = useCallback((id: string, patch: Partial<Reimbursement>) => {
    setData((d) => ({
      ...d,
      reimbursements: d.reimbursements.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }))
  }, [])

  const removeReimbursement = useCallback((id: string) => {
    setData((d) => ({ ...d, reimbursements: d.reimbursements.filter((r) => r.id !== id) }))
  }, [])

  const setSaldo = useCallback((year: number, month: number, patch: { saldoEverest?: number | null; paymentDate?: string | null }) => {
    setData((d) => {
      const idx = d.settlements.findIndex((s) => s.year === year && s.month === month)
      if (idx === -1) {
        return {
          ...d,
          settlements: [...d.settlements, { year, month, saldoEverest: patch.saldoEverest ?? null, paymentDate: patch.paymentDate ?? null }],
        }
      }
      const settlements = d.settlements.slice()
      settlements[idx] = { ...settlements[idx], ...patch }
      return { ...d, settlements }
    })
  }, [])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }))
  }, [])

  const resetToSeed = useCallback(() => {
    setData(buildInitialData())
  }, [])

  const value = useMemo<Store>(
    () => ({
      data,
      addContract,
      updateContract,
      removeContract,
      upsertMonthlyEntry,
      addReimbursement,
      updateReimbursement,
      removeReimbursement,
      setSaldo,
      updateSettings,
      resetToSeed,
    }),
    [data, addContract, updateContract, removeContract, upsertMonthlyEntry, addReimbursement, updateReimbursement, removeReimbursement, setSaldo, updateSettings, resetToSeed]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

export function otherCompany(c: Company): Company {
  return c === 'JUNGERS' ? 'EVEREST' : 'JUNGERS'
}
