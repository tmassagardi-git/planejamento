import { CalendarHeart, Settings2, Users } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../store'
import PaletteChip from './PaletteChip'

type Tab = 'clients' | 'categories'

type Props = {
  onManageClients: () => void
  onManageCategories: () => void
  onManageMembers: () => void
}

export default function Sidebar({ onManageClients, onManageCategories, onManageMembers }: Props) {
  const clients = useStore((s) => [...s.clients].sort((a, b) => a.order - b.order))
  const categories = useStore((s) => [...s.categories].sort((a, b) => a.order - b.order))
  const [tab, setTab] = useState<Tab>('clients')

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-4">
        <div className="flex items-center gap-2 text-slate-800">
          <CalendarHeart className="text-indigo-500" size={22} />
          <h1 className="text-base font-extrabold tracking-tight">Agenda da Equipe</h1>
        </div>
        <p className="mt-1 text-xs text-slate-400">Arraste um bloco para um dia da agenda</p>
      </div>

      <div className="flex gap-1 border-b border-slate-100 p-2">
        <button
          onClick={() => setTab('clients')}
          className={`flex-1 rounded-lg px-2 py-1.5 text-sm font-semibold transition-colors ${
            tab === 'clients' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          Clientes
        </button>
        <button
          onClick={() => setTab('categories')}
          className={`flex-1 rounded-lg px-2 py-1.5 text-sm font-semibold transition-colors ${
            tab === 'categories' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          Outros
        </button>
      </div>

      <div className="flex-1 flex-wrap content-start gap-2 overflow-y-auto p-3 flex">
        {tab === 'clients' &&
          clients.map((c) => (
            <PaletteChip key={c.id} dragId={`palette:client:${c.id}`} label={c.abbrev} sublabel={c.name} color={c.color} />
          ))}
        {tab === 'categories' &&
          categories.map((c) => (
            <PaletteChip key={c.id} dragId={`palette:category:${c.id}`} label={c.abbrev} sublabel={c.name} color={c.color} />
          ))}
        {tab === 'clients' && clients.length === 0 && (
          <p className="px-1 text-sm text-slate-400">Nenhum cliente ainda. Use "Gerenciar clientes" abaixo.</p>
        )}
        {tab === 'categories' && categories.length === 0 && (
          <p className="px-1 text-sm text-slate-400">Nenhuma categoria ainda.</p>
        )}
      </div>

      <div className="space-y-1 border-t border-slate-100 p-3">
        <button
          onClick={tab === 'clients' ? onManageClients : onManageCategories}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <Settings2 size={16} /> Gerenciar {tab === 'clients' ? 'clientes' : 'categorias'}
        </button>
        <button
          onClick={onManageMembers}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <Users size={16} /> Gerenciar equipe
        </button>
      </div>
    </aside>
  )
}
