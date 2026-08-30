import { useLocation } from 'react-router-dom'
import { useFilters, type CompanyFilter } from '../lib/filters'

const TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Visão geral da parceria Everest & Jungers' },
  '/contratos': { title: 'Contratos', subtitle: 'Cadastro e acompanhamento dos contratos ativos' },
  '/repasses': { title: 'Repasses & Planilha', subtitle: 'Lançamentos mensais no formato de planilha' },
  '/reembolsos': { title: 'Reembolsos', subtitle: 'Despesas reembolsadas entre as empresas' },
  '/configuracoes': { title: 'Configurações', subtitle: 'Regras de repasse, impostos e dados' },
}

const companyOptions: { value: CompanyFilter; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'JUNGERS', label: 'Jungers' },
  { value: 'EVEREST', label: 'Everest' },
]

export function Topbar() {
  const location = useLocation()
  const meta = TITLES[location.pathname] ?? { title: 'Contratos & Repasses', subtitle: '' }
  const { company, setCompany, yearFrom, yearTo, setYearFrom, setYearTo, search, setSearch } = useFilters()
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 2020 + 4 }, (_, i) => 2021 + i)

  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-slate-200/70 bg-white/80 px-4 py-3 backdrop-blur md:px-8">
      <div className="mr-auto">
        <h1 className="text-lg font-semibold text-slate-900">{meta.title}</h1>
        {meta.subtitle && <p className="text-xs text-slate-400">{meta.subtitle}</p>}
      </div>

      <label className="relative hidden lg:block">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar contrato ou parceiro..."
          className="w-64 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-brand-400 focus:bg-white"
        />
      </label>

      <div className="flex items-center rounded-lg bg-slate-100 p-1 text-sm">
        {companyOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setCompany(opt.value)}
            className={`rounded-md px-3 py-1.5 font-medium transition ${
              company === opt.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-600">
        <select
          value={yearFrom}
          onChange={(e) => setYearFrom(Number(e.target.value))}
          className="bg-transparent outline-none"
        >
          {years.map((y) => (
            <option key={y} value={y} disabled={y > yearTo}>
              {y}
            </option>
          ))}
        </select>
        <span className="text-slate-300">→</span>
        <select value={yearTo} onChange={(e) => setYearTo(Number(e.target.value))} className="bg-transparent outline-none">
          {years.map((y) => (
            <option key={y} value={y} disabled={y < yearFrom}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </header>
  )
}
