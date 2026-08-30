import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { useFilters } from '../lib/filters'
import { formatBRL } from '../lib/format'
import { MONTH_LABELS_FULL } from '../lib/types'
import { Button, Card, CompanyTag } from '../components/ui'
import type { Company } from '../lib/types'

export function Reembolsos() {
  const { data, addReimbursement, updateReimbursement, removeReimbursement } = useStore()
  const { company } = useFilters()

  const years = useMemo(() => {
    const set = new Set<number>()
    for (const r of data.reimbursements) set.add(r.year)
    set.add(new Date().getFullYear())
    return Array.from(set).sort((a, b) => a - b)
  }, [data.reimbursements])
  const [year, setYear] = useState(() => years[years.length - 1])

  const rows = useMemo(
    () =>
      data.reimbursements
        .filter((r) => r.year === year)
        .filter((r) => (company === 'ALL' ? true : r.company === company))
        .sort((a, b) => a.month - b.month),
    [data.reimbursements, year, company]
  )

  const totalByCompany = useMemo(() => {
    const t: Record<Company, number> = { JUNGERS: 0, EVEREST: 0 }
    for (const r of rows) t[r.company] += r.amount
    return t
  }, [rows])

  const [newRow, setNewRow] = useState({ month: 1, company: 'JUNGERS' as Company, description: '', amount: '' })

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
                className={`px-3 py-1.5 text-sm font-medium transition ${y === year ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-2">
            <CompanyTag company="JUNGERS" /> {formatBRL(totalByCompany.JUNGERS)}
          </span>
          <span className="flex items-center gap-2">
            <CompanyTag company="EVEREST" /> {formatBRL(totalByCompany.EVEREST)}
          </span>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Mês</th>
                <th className="px-5 py-3 font-medium">Empresa</th>
                <th className="px-5 py-3 font-medium">Descrição</th>
                <th className="px-5 py-3 font-medium text-right">Valor</th>
                <th className="px-5 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-2.5 text-slate-500">{MONTH_LABELS_FULL[r.month - 1]}</td>
                  <td className="px-5 py-2.5">
                    <CompanyTag company={r.company} />
                  </td>
                  <td className="px-5 py-2.5">
                    <input
                      defaultValue={r.description}
                      className="w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 outline-none focus:border-slate-200 focus:bg-slate-50"
                      onBlur={(e) => updateReimbursement(r.id, { description: e.target.value })}
                    />
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums">
                    <input
                      defaultValue={r.amount}
                      type="number"
                      step="0.01"
                      className="w-28 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-right outline-none focus:border-slate-200 focus:bg-slate-50"
                      onBlur={(e) => updateReimbursement(r.id, { amount: Number(e.target.value) || 0 })}
                    />
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    <Button variant="ghost" onClick={() => removeReimbursement(r.id)}>
                      Excluir
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    Nenhum reembolso lançado em {year}.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-100 bg-slate-50/60">
                <td className="px-5 py-2.5">
                  <select
                    value={newRow.month}
                    onChange={(e) => setNewRow({ ...newRow, month: Number(e.target.value) })}
                    className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs"
                  >
                    {MONTH_LABELS_FULL.map((m, i) => (
                      <option key={m} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-5 py-2.5">
                  <select
                    value={newRow.company}
                    onChange={(e) => setNewRow({ ...newRow, company: e.target.value as Company })}
                    className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs"
                  >
                    <option value="JUNGERS">Jungers</option>
                    <option value="EVEREST">Everest</option>
                  </select>
                </td>
                <td className="px-5 py-2.5">
                  <input
                    value={newRow.description}
                    onChange={(e) => setNewRow({ ...newRow, description: e.target.value })}
                    placeholder="Descrição do reembolso"
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                  />
                </td>
                <td className="px-5 py-2.5">
                  <input
                    value={newRow.amount}
                    onChange={(e) => setNewRow({ ...newRow, amount: e.target.value })}
                    placeholder="0,00"
                    type="number"
                    step="0.01"
                    className="w-28 rounded-md border border-slate-200 bg-white px-2 py-1 text-right text-xs"
                  />
                </td>
                <td className="px-5 py-2.5 text-right">
                  <Button
                    onClick={() => {
                      const amount = Number(newRow.amount)
                      if (!newRow.description.trim() || !amount) return
                      addReimbursement({ year, month: newRow.month, company: newRow.company, description: newRow.description.trim(), amount })
                      setNewRow({ month: newRow.month, company: newRow.company, description: '', amount: '' })
                    }}
                  >
                    Adicionar
                  </Button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  )
}
