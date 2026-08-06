import { ArrowDown, ArrowUp, CalendarRange, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { Member } from '../types'
import { nextPaletteColor } from '../utils/color'
import { formatDateBR } from '../utils/date'
import ColorPicker from './ColorPicker'
import Modal from './Modal'

type Props = {
  members: Member[]
  onClose: () => void
  onAdd: (name: string, range?: { startDate?: string; endDate?: string }) => void
  onUpdate: (id: string, patch: Partial<Omit<Member, 'id'>>) => void
  onRemove: (id: string) => void
  onReorder: (orderedIds: string[]) => void
}

function rangeLabel(startDate?: string, endDate?: string): string | null {
  if (!startDate && !endDate) return null
  if (startDate && endDate) return `${formatDateBR(startDate)} – ${formatDateBR(endDate)}`
  if (startDate) return `A partir de ${formatDateBR(startDate)}`
  return `Até ${formatDateBR(endDate!)}`
}

export default function ManageMembersModal({ members, onClose, onAdd, onUpdate, onRemove, onReorder }: Props) {
  const sorted = [...members].sort((a, b) => a.order - b.order)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(() => nextPaletteColor(members.map((m) => m.color)))
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  function startEdit(m: Member) {
    setEditingId(m.id)
    setCreating(false)
    setName(m.name)
    setColor(m.color)
    setStartDate(m.startDate ?? '')
    setEndDate(m.endDate ?? '')
  }

  function startCreate() {
    setEditingId(null)
    setCreating(true)
    setName('')
    setColor(nextPaletteColor(members.map((m) => m.color)))
    setStartDate('')
    setEndDate('')
  }

  function save() {
    if (!name.trim()) return
    const range = { startDate: startDate || undefined, endDate: endDate || undefined }
    if (editingId) onUpdate(editingId, { name: name.trim(), color, ...range })
    else if (creating) onAdd(name.trim(), range)
    setEditingId(null)
    setCreating(false)
  }

  function move(idx: number, dir: -1 | 1) {
    const ids = sorted.map((m) => m.id)
    const target = idx + dir
    if (target < 0 || target >= ids.length) return
    ;[ids[idx], ids[target]] = [ids[target], ids[idx]]
    onReorder(ids)
  }

  const isFormOpen = creating || editingId !== null

  return (
    <Modal title={`Equipe (${sorted.length})`} onClose={onClose} width="max-w-lg">
      <div className="relative">
      <div className="max-h-96 space-y-1.5 overflow-y-auto pr-1">
        {sorted.map((m, idx) => (
          <div
            key={m.id}
            className="group flex items-center gap-2.5 rounded-xl border border-slate-100 px-3 py-2 hover:bg-slate-50"
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: m.color }}
            >
              {m.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-700">{m.name}</p>
              {rangeLabel(m.startDate, m.endDate) && (
                <p className="flex items-center gap-1 truncate text-[11px] text-slate-400">
                  <CalendarRange size={11} /> {rangeLabel(m.startDate, m.endDate)}
                </p>
              )}
            </div>
            <div className="flex opacity-0 group-hover:opacity-100">
              <button onClick={() => move(idx, -1)} disabled={idx === 0} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 disabled:opacity-30">
                <ArrowUp size={14} />
              </button>
              <button onClick={() => move(idx, 1)} disabled={idx === sorted.length - 1} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 disabled:opacity-30">
                <ArrowDown size={14} />
              </button>
              <button onClick={() => startEdit(m)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600">
                <Pencil size={14} />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Remover "${m.name}" da equipe? Isso também limpa a agenda dessa pessoa.`)) onRemove(m.id)
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
      {sorted.length > 5 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 rounded-b-lg bg-gradient-to-t from-white to-transparent" />
      )}
      </div>

      {isFormOpen ? (
        <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Nome</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Renata"
              className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Cor</label>
            <ColorPicker value={color} onChange={setColor} />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-500">Ativo a partir de (opcional)</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-500">Ativo até (opcional)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-indigo-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => {
                setCreating(false)
                setEditingId(null)
              }}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-200"
            >
              Cancelar
            </button>
            <button onClick={save} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700">
              Salvar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={startCreate}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 py-2 text-sm font-medium text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
        >
          <Plus size={16} /> Adicionar pessoa
        </button>
      )}
    </Modal>
  )
}
