import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import type { Company, Contract } from '../lib/types'
import { MONTH_LABELS } from '../lib/types'
import { effectiveRepasse } from '../lib/analytics'
import { formatBRL, formatDate } from '../lib/format'
import { Button, Card, CompanyTag } from '../components/ui'
import { downloadCsv } from '../lib/csv'

export function Repasses() {
  const { data } = useStore()
  const currentYear = new Date().getFullYear()

  const years = useMemo(() => {
    const set = new Set<number>()
    for (const e of data.monthlyEntries) set.add(e.year)
    for (const c of data.contracts) {
      if (c.startDate) {
        const y = new Date(c.startDate).getFullYear()
        if (Number.isFinite(y)) set.add(y)
      }
    }
    set.add(currentYear)
    return Array.from(set)
      .filter((y) => Number.isFinite(y))
      .sort((a, b) => a - b)
  }, [data, currentYear])

  const [year, setYear] = useState(() => (years.includes(currentYear) ? currentYear : years[years.length - 1]))

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-500">Ano</span>
          <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={`px-3 py-1.5 text-sm font-medium transition ${
                  y === year ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Formato de planilha: cada contrato mostra o valor bruto faturado e, logo abaixo, o repasse devido à outra empresa. Clique em
          qualquer célula para editar.
        </p>
      </div>

      <CompanyBlock company="JUNGERS" year={year} />
      <CompanyBlock company="EVEREST" year={year} />

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Reembolsos e saldo do período</h3>
            <p className="text-xs text-slate-400">Reembolsos não entram no cálculo de repasse. Gerencie-os na página dedicada.</p>
          </div>
          <Link to="/reembolsos">
            <Button variant="secondary">Ver reembolsos de {year}</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

function CompanyBlock({ company, year }: { company: Company; year: number }) {
  const { data, addContract, setSaldo } = useStore()

  const contracts = useMemo(() => {
    return data.contracts
      .filter((c) => c.company === company)
      .filter((c) => {
        const hasEntry = data.monthlyEntries.some((e) => e.contractId === c.id && e.year === year)
        const startYear = c.startDate ? new Date(c.startDate).getFullYear() : null
        const endYear = c.endDate ? new Date(c.endDate).getFullYear() : null
        const inRange = (!startYear || startYear <= year) && (!endYear || endYear >= year)
        return hasEntry || inRange
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [data.contracts, data.monthlyEntries, company, year])

  const monthTotals = useMemo(() => {
    const gross = Array(12).fill(0)
    const repasse = Array(12).fill(0)
    for (const c of contracts) {
      for (let m = 1; m <= 12; m++) {
        const entry = data.monthlyEntries.find((e) => e.contractId === c.id && e.year === year && e.month === m)
        if (entry) {
          gross[m - 1] += entry.gross
          repasse[m - 1] += effectiveRepasse(entry, data.settings)
        }
      }
    }
    return { gross, repasse }
  }, [contracts, data.monthlyEntries, data.settings, year])

  function getEntry(contractId: string, month: number) {
    return data.monthlyEntries.find((e) => e.contractId === contractId && e.year === year && e.month === month)
  }

  function saldoFor(month: number) {
    return data.settlements.find((s) => s.year === year && s.month === month)
  }

  function exportCsv() {
    const header = ['Contrato', ...MONTH_LABELS.map((m) => `${m} (bruto)`), ...MONTH_LABELS.map((m) => `${m} (repasse)`)]
    const rows = contracts.map((c) => {
      const grossRow = Array.from({ length: 12 }, (_, i) => getEntry(c.id, i + 1)?.gross ?? '')
      const repasseRow = Array.from({ length: 12 }, (_, i) => {
        const e = getEntry(c.id, i + 1)
        return e ? effectiveRepasse(e, data.settings).toFixed(2) : ''
      })
      return [c.name, ...grossRow, ...repasseRow]
    })
    downloadCsv(`repasses_${company.toLowerCase()}_${year}.csv`, [header, ...rows])
  }

  const other = company === 'JUNGERS' ? 'Everest' : 'Jungers'

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
        <div className="flex items-center gap-2">
          <CompanyTag company={company} />
          <h3 className="text-sm font-semibold text-slate-800">Contratos faturados por {company === 'JUNGERS' ? 'Jungers' : 'Everest'}</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportCsv}>
            Exportar CSV
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              const name = prompt('Nome do novo contrato/parceiro:')
              if (name && name.trim()) addContract({ name: name.trim(), company, startDate: null, endDate: null, reajusteClause: null, travelExpense: null, notes: '' })
            }}
          >
            + Contrato
          </Button>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto px-2 pb-4 sm:px-4">
        <table className="w-full min-w-[1100px] border-separate border-spacing-0 text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white px-3 py-2 text-left font-medium text-slate-400">Contrato</th>
              {MONTH_LABELS.map((m) => (
                <th key={m} className="px-1.5 py-2 text-right font-medium text-slate-400">
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => (
              <ContractRows key={c.id} contract={c} year={year} />
            ))}

            <tr className="border-t-2 border-slate-200 font-semibold text-slate-700">
              <td className="sticky left-0 z-10 bg-white px-3 py-2">TOTAL {company === 'JUNGERS' ? 'JUNGERS' : 'EVEREST'}</td>
              {monthTotals.gross.map((v, i) => (
                <td key={i} className="px-1.5 py-2 text-right tabular-nums">
                  {v > 0 ? formatBRL(v, { compact: true }) : '—'}
                </td>
              ))}
            </tr>
            <tr className="text-brand-600">
              <td className="sticky left-0 z-10 bg-white px-3 py-1.5 pl-6 italic">Repasse total para {other}</td>
              {monthTotals.repasse.map((v, i) => (
                <td key={i} className="px-1.5 py-1.5 text-right tabular-nums">
                  {v > 0 ? formatBRL(v, { compact: true }) : '—'}
                </td>
              ))}
            </tr>
            {company === 'EVEREST' && (
              <>
                <tr className="border-t border-slate-100 font-medium text-slate-500">
                  <td className="sticky left-0 z-10 bg-white px-3 py-2">Saldo (Everest deve a Jungers)</td>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                    const s = saldoFor(m)
                    return (
                      <td key={m} className="px-1 py-1 text-right">
                        <input
                          className="cell-input"
                          defaultValue={s?.saldoEverest ?? ''}
                          placeholder="—"
                          onBlur={(e) => {
                            const v = e.target.value.trim()
                            setSaldo(year, m, { saldoEverest: v === '' ? null : Number(v) })
                          }}
                        />
                      </td>
                    )
                  })}
                </tr>
                <tr className="text-slate-400">
                  <td className="sticky left-0 z-10 bg-white px-3 py-1.5">Pagamento/recebimento</td>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                    const s = saldoFor(m)
                    return (
                      <td key={m} className="px-1.5 py-1.5 text-center">
                        {s?.paymentDate ? formatDate(s.paymentDate) : '—'}
                      </td>
                    )
                  })}
                </tr>
              </>
            )}
          </tbody>
        </table>
        {contracts.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Nenhum contrato para {year}.</p>}
      </div>
    </Card>
  )
}

function ContractRows({ contract, year }: { contract: Contract; year: number }) {
  const { data, upsertMonthlyEntry } = useStore()

  return (
    <>
      <tr className="border-t border-slate-50">
        <td className="sticky left-0 z-10 bg-white px-3 py-1.5 font-medium text-slate-700">{contract.name}</td>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
          const entry = data.monthlyEntries.find((e) => e.contractId === contract.id && e.year === year && e.month === m)
          return (
            <td key={m} className="px-1 py-1">
              <input
                className="cell-input"
                defaultValue={entry && entry.gross > 0 ? entry.gross : ''}
                placeholder="—"
                onBlur={(e) => {
                  const v = e.target.value.trim()
                  upsertMonthlyEntry(contract.id, year, m, { gross: v === '' ? 0 : Number(v) })
                }}
              />
            </td>
          )
        })}
      </tr>
      <tr>
        <td className="sticky left-0 z-10 bg-white px-3 py-1 pl-6 text-[11px] italic text-slate-400">↳ repasse</td>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
          const entry = data.monthlyEntries.find((e) => e.contractId === contract.id && e.year === year && e.month === m)
          const computed = entry ? effectiveRepasse(entry, data.settings) : 0
          const isOverride = entry?.repasse !== null && entry?.repasse !== undefined
          return (
            <td key={m} className="px-1 py-1">
              <input
                className={`cell-input ${isOverride ? 'text-brand-600' : 'text-slate-400'}`}
                defaultValue={computed > 0 ? computed.toFixed(2) : ''}
                placeholder="—"
                title={isOverride ? 'Valor definido manualmente' : 'Calculado automaticamente pelo % de repasse padrão'}
                onBlur={(e) => {
                  const v = e.target.value.trim()
                  upsertMonthlyEntry(contract.id, year, m, { repasse: v === '' ? null : Number(v) })
                }}
              />
            </td>
          )
        })}
      </tr>
    </>
  )
}
