import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { useFilters } from '../lib/filters'
import { isActive, daysUntil } from '../lib/analytics'
import { formatBRL, formatDate } from '../lib/format'
import { Button, Card, CompanyTag, StatusPill } from '../components/ui'
import { Modal } from '../components/Modal'
import { downloadCsv } from '../lib/csv'
import type { Company, Contract } from '../lib/types'

type FormState = {
  name: string
  company: Company
  startDate: string
  endDate: string
  reajusteClause: string
  travelExpense: string
  notes: string
}

const emptyForm: FormState = {
  name: '',
  company: 'JUNGERS',
  startDate: '',
  endDate: '',
  reajusteClause: '',
  travelExpense: '',
  notes: '',
}

export function Contratos() {
  const { data, addContract, updateContract, removeContract } = useStore()
  const { company, search } = useFilters()
  const today = useMemo(() => new Date(), [])

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  const rows = useMemo(() => {
    return data.contracts
      .filter((c) => (company === 'ALL' ? true : c.company === company))
      .filter((c) => (search ? c.name.toLowerCase().includes(search.toLowerCase()) : true))
      .map((c) => {
        const currentMonth = latestGrossFor(c, data.monthlyEntries as typeof data.monthlyEntries)
        return { contract: c, currentGross: currentMonth }
      })
      .sort((a, b) => a.contract.name.localeCompare(b.contract.name))
  }, [data.contracts, data.monthlyEntries, company, search])

  function latestGrossFor(c: Contract, entries: typeof data.monthlyEntries) {
    const own = entries.filter((e) => e.contractId === c.id && e.gross > 0)
    if (own.length === 0) return 0
    const latest = own.reduce((best, e) => (e.year > best.year || (e.year === best.year && e.month > best.month) ? e : best))
    return latest.gross
  }

  function openNew() {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(c: Contract) {
    setEditingId(c.id)
    setForm({
      name: c.name,
      company: c.company,
      startDate: c.startDate ?? '',
      endDate: c.endDate ?? '',
      reajusteClause: c.reajusteClause ?? '',
      travelExpense: c.travelExpense ?? '',
      notes: c.notes,
    })
    setModalOpen(true)
  }

  function submit() {
    if (!form.name.trim()) return
    const payload = {
      name: form.name.trim(),
      company: form.company,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      reajusteClause: form.reajusteClause || null,
      travelExpense: form.travelExpense || null,
      notes: form.notes,
    }
    if (editingId) updateContract(editingId, payload)
    else addContract(payload)
    setModalOpen(false)
  }

  function exportCsv() {
    const header = ['Contrato', 'Empresa', 'Início', 'Fim', 'Situação', 'Valor mensal atual (R$)']
    const body = rows.map(({ contract: c, currentGross }) => [
      c.name,
      c.company === 'JUNGERS' ? 'Jungers' : 'Everest',
      formatDate(c.startDate),
      formatDate(c.endDate),
      isActive(c, today, data.monthlyEntries) ? 'Ativo' : 'Encerrado',
      currentGross.toFixed(2),
    ])
    downloadCsv('contratos.csv', [header, ...body])
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{rows.length} contrato(s) encontrados</p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportCsv}>
            <IconDownload /> Exportar CSV
          </Button>
          <Button onClick={openNew}>
            <IconPlus /> Novo contrato
          </Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Contrato</th>
                <th className="px-5 py-3 font-medium">Empresa</th>
                <th className="px-5 py-3 font-medium">Início</th>
                <th className="px-5 py-3 font-medium">Fim</th>
                <th className="px-5 py-3 font-medium">Valor mensal atual</th>
                <th className="px-5 py-3 font-medium">Situação</th>
                <th className="px-5 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ contract: c, currentGross }) => {
                const active = isActive(c, today, data.monthlyEntries)
                const days = daysUntil(c.endDate, today)
                return (
                  <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-medium text-slate-700">{c.name}</td>
                    <td className="px-5 py-3">
                      <CompanyTag company={c.company} />
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(c.startDate)}</td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(c.endDate)}</td>
                    <td className="px-5 py-3 text-slate-700">{currentGross > 0 ? formatBRL(currentGross) : '—'}</td>
                    <td className="px-5 py-3">
                      {!active ? (
                        <StatusPill tone="muted">Encerrado</StatusPill>
                      ) : days !== null && days <= 30 ? (
                        <StatusPill tone="warn">Ativo · vence em {days}d</StatusPill>
                      ) : (
                        <StatusPill tone="ok">Ativo</StatusPill>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Button variant="ghost" onClick={() => openEdit(c)}>
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Remover o contrato "${c.name}"? Os lançamentos mensais associados também serão removidos.`)) {
                              removeContract(c.id)
                            }
                          }}
                        >
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    Nenhum contrato encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar contrato' : 'Novo contrato'}>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <Field label="Nome do contrato / parceiro">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              placeholder="ex.: APAE Sorocaba"
              autoFocus
            />
          </Field>
          <Field label="Empresa responsável pela NF">
            <select value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value as Company })} className="input">
              <option value="JUNGERS">Jungers</option>
              <option value="EVEREST">Everest</option>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Início">
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="input" />
            </Field>
            <Field label="Fim">
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="input" />
            </Field>
          </div>
          <Field label="Cláusula de reajuste">
            <input
              value={form.reajusteClause}
              onChange={(e) => setForm({ ...form, reajusteClause: e.target.value })}
              className="input"
              placeholder="ex.: IPCA anual"
            />
          </Field>
          <Field label="Despesas de deslocamento">
            <input
              value={form.travelExpense}
              onChange={(e) => setForm({ ...form, travelExpense: e.target.value })}
              className="input"
              placeholder="ex.: E/J, HCL, IASAL..."
            />
          </Field>
          <Field label="Observações">
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input min-h-20" />
          </Field>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">{editingId ? 'Salvar alterações' : 'Criar contrato'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-600">{label}</span>
      {children}
    </label>
  )
}

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
function IconDownload() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v12m0 0-4-4m4 4 4-4M4 21h16" />
    </svg>
  )
}
