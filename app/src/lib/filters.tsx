import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Company } from './types'

export type CompanyFilter = 'ALL' | Company

interface Filters {
  company: CompanyFilter
  setCompany: (c: CompanyFilter) => void
  yearFrom: number
  yearTo: number
  setYearFrom: (y: number) => void
  setYearTo: (y: number) => void
  search: string
  setSearch: (s: string) => void
}

const FiltersContext = createContext<Filters | null>(null)

export function FiltersProvider({ children }: { children: ReactNode }) {
  const currentYear = new Date().getFullYear()
  const [company, setCompany] = useState<CompanyFilter>('ALL')
  const [yearFrom, setYearFrom] = useState(currentYear - 2)
  const [yearTo, setYearTo] = useState(currentYear)
  const [search, setSearch] = useState('')

  const value = useMemo(
    () => ({ company, setCompany, yearFrom, yearTo, setYearFrom, setYearTo, search, setSearch }),
    [company, yearFrom, yearTo, search]
  )

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>
}

export function useFilters(): Filters {
  const ctx = useContext(FiltersContext)
  if (!ctx) throw new Error('useFilters must be used within FiltersProvider')
  return ctx
}
