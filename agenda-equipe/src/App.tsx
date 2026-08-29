import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { CalendarHeart, WifiOff } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import CalendarGrid from './components/CalendarGrid'
import Header from './components/Header'
import ManageItemsModal from './components/ManageItemsModal'
import ManageMembersModal from './components/ManageMembersModal'
import MonthSummary from './components/MonthSummary'
import Sidebar from './components/Sidebar'
import { useStore } from './store'
import { textColorFor } from './utils/color'

type ModalName = 'clients' | 'categories' | 'members' | null

export default function App() {
  const [month, setMonth] = useState(new Date())
  const [modal, setModal] = useState<ModalName>(null)
  const [activeDragLabel, setActiveDragLabel] = useState<{ label: string; color: string } | null>(null)

  const loading = useStore((s) => s.loading)
  const syncError = useStore((s) => s.syncError)
  const initialize = useStore((s) => s.initialize)
  const googleConnections = useStore((s) => s.googleConnections)
  const connectGoogle = useStore((s) => s.connectGoogle)
  const refreshGoogleConnections = useStore((s) => s.refreshGoogleConnections)

  useEffect(() => {
    initialize()
  }, [initialize])

  const [googleNotice, setGoogleNotice] = useState<'connected' | 'error' | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const google = params.get('google')
    if (google === 'connected' || google === 'error') {
      setGoogleNotice(google)
      if (google === 'connected') refreshGoogleConnections()
      params.delete('google')
      params.delete('reason')
      const query = params.toString()
      window.history.replaceState({}, '', window.location.pathname + (query ? `?${query}` : ''))
      const timer = setTimeout(() => setGoogleNotice(null), 6000)
      return () => clearTimeout(timer)
    }
  }, [refreshGoogleConnections])

  const clients = useStore((s) => s.clients)
  const categories = useStore((s) => s.categories)
  const members = useStore((s) => s.members)

  const addMember = useStore((s) => s.addMember)
  const updateMember = useStore((s) => s.updateMember)
  const removeMember = useStore((s) => s.removeMember)
  const reorderMembers = useStore((s) => s.reorderMembers)

  const addClient = useStore((s) => s.addClient)
  const updateClient = useStore((s) => s.updateClient)
  const removeClient = useStore((s) => s.removeClient)
  const reorderClients = useStore((s) => s.reorderClients)

  const addCategory = useStore((s) => s.addCategory)
  const updateCategory = useStore((s) => s.updateCategory)
  const removeCategory = useStore((s) => s.removeCategory)
  const reorderCategories = useStore((s) => s.reorderCategories)

  const addEntry = useStore((s) => s.addEntry)
  const moveEntry = useStore((s) => s.moveEntry)
  const entries = useStore((s) => s.entries)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const byId = useMemo(() => {
    const clientMap = new Map(clients.map((c) => [c.id, c]))
    const categoryMap = new Map(categories.map((c) => [c.id, c]))
    return { clientMap, categoryMap }
  }, [clients, categories])

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id)
    const parts = id.split(':')
    if (parts[0] === 'palette') {
      const [, kind, refId] = parts
      const item = kind === 'client' ? byId.clientMap.get(refId) : byId.categoryMap.get(refId)
      if (item) setActiveDragLabel({ label: item.abbrev, color: item.color })
    } else if (parts[0] === 'entry') {
      const entry = entries[parts[1]]
      if (entry) setActiveDragLabel({ label: entry.label, color: entry.color })
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragLabel(null)
    const { active, over } = event
    if (!over) return
    const activeParts = String(active.id).split(':')
    const overParts = String(over.id).split(':')
    if (overParts[0] !== 'cell') return
    const [, targetMemberId, targetDate] = overParts

    if (activeParts[0] === 'palette') {
      const [, kind, refId] = activeParts
      addEntry(targetMemberId, targetDate, { kind: kind as 'client' | 'category', refId, allDay: true })
    } else if (activeParts[0] === 'entry') {
      const entryId = activeParts[1]
      const entry = entries[entryId]
      if (entry && entry.memberId === targetMemberId && entry.date === targetDate) return
      moveEntry(entryId, targetMemberId, targetDate)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-slate-400">
        <CalendarHeart className="animate-pulse text-indigo-400" size={40} />
        <p className="text-sm font-medium">Carregando agenda compartilhada...</p>
      </div>
    )
  }

  if (syncError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-6 text-center text-slate-500">
        <WifiOff className="text-rose-400" size={40} />
        <p className="max-w-sm text-sm font-medium">{syncError}</p>
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-screen flex-col">
        {googleNotice && (
          <div
            className={`px-4 py-2 text-center text-sm font-medium ${
              googleNotice === 'connected' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {googleNotice === 'connected'
              ? 'Google Calendar conectado com sucesso!'
              : 'Não foi possível conectar ao Google Calendar. Tente novamente.'}
          </div>
        )}
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            month={month}
            onManageClients={() => setModal('clients')}
            onManageCategories={() => setModal('categories')}
            onManageMembers={() => setModal('members')}
          />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header month={month} onChangeMonth={setMonth} />
            <CalendarGrid month={month} />
            <MonthSummary month={month} />
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeDragLabel && (
          <div
            className="rounded-xl px-3 py-2 text-sm font-bold shadow-pop"
            style={{ backgroundColor: activeDragLabel.color, color: textColorFor(activeDragLabel.color) }}
          >
            {activeDragLabel.label}
          </div>
        )}
      </DragOverlay>

      {modal === 'clients' && (
        <ManageItemsModal
          title="Clientes"
          items={clients}
          onClose={() => setModal(null)}
          onAdd={addClient}
          onUpdate={updateClient}
          onRemove={removeClient}
          onReorder={reorderClients}
          dateRange
        />
      )}
      {modal === 'categories' && (
        <ManageItemsModal
          title="Outras categorias"
          items={categories}
          onClose={() => setModal(null)}
          onAdd={addCategory}
          onUpdate={updateCategory}
          onRemove={removeCategory}
          onReorder={reorderCategories}
        />
      )}
      {modal === 'members' && (
        <ManageMembersModal
          members={members}
          onClose={() => setModal(null)}
          onAdd={addMember}
          onUpdate={updateMember}
          onRemove={removeMember}
          onReorder={reorderMembers}
          googleConnections={googleConnections}
          onConnectGoogle={connectGoogle}
        />
      )}
    </DndContext>
  )
}
