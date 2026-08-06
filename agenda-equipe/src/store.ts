import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { supabase } from './lib/supabase'
import {
  fromCategoryRow,
  fromClientRow,
  fromEntryRow,
  fromHolidayRow,
  fromMemberRow,
  toCategoryRow,
  toClientRow,
  toEntryRow,
  toMemberRow,
  type CategoryRow,
  type ClientRow,
  type EntryRow,
  type HolidayRow,
  type MemberRow,
} from './lib/mappers'
import type { Category, Client, Entry, Holiday, Member, Modality, ScheduleState } from './types'
import { nextPaletteColor } from './utils/color'

function id() {
  return nanoid(8)
}

function logError(context: string) {
  return (result: { error: unknown }) => {
    if (result.error) console.error(`[agenda-equipe] ${context} failed:`, result.error)
  }
}

function sortKey(e: Entry): string {
  return e.allDay ? '' : e.time ?? '99:99'
}

export function cellEntries(entries: Record<string, Entry>, memberId: string, date: string): Entry[] {
  return Object.values(entries)
    .filter((e) => e.memberId === memberId && e.date === date)
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)) || a.id.localeCompare(b.id))
}

type ScheduleInput = {
  allDay: boolean
  time?: string
  endTime?: string
  modality?: Modality
  travelConfirmed?: boolean
  notes?: string
  link?: string
}

type NewEntryInput = ScheduleInput & ({ kind: 'client' | 'category'; refId: string } | { kind: 'meeting'; label: string })

type ActiveRange = { startDate?: string; endDate?: string }

type Actions = {
  initialize: () => Promise<void>

  addMember: (name: string, range?: ActiveRange) => void
  updateMember: (id: string, patch: Partial<Omit<Member, 'id'>>) => void
  removeMember: (id: string) => void
  reorderMembers: (orderedIds: string[]) => void

  addClient: (name: string, abbrev: string, color?: string, range?: ActiveRange) => void
  updateClient: (id: string, patch: Partial<Omit<Client, 'id'>>) => void
  removeClient: (id: string) => void
  reorderClients: (orderedIds: string[]) => void

  addCategory: (name: string, abbrev: string, color?: string) => void
  updateCategory: (id: string, patch: Partial<Omit<Category, 'id'>>) => void
  removeCategory: (id: string) => void
  reorderCategories: (orderedIds: string[]) => void

  addEntry: (memberId: string, date: string, input: NewEntryInput) => void
  updateEntry: (
    entryId: string,
    patch: Partial<
      Pick<Entry, 'time' | 'endTime' | 'allDay' | 'modality' | 'travelConfirmed' | 'label' | 'notes' | 'link'>
    >,
  ) => void
  moveEntry: (entryId: string, toMemberId: string, toDate: string) => void
  duplicateEntry: (entryId: string, toDate: string, toMemberId?: string) => void
  removeEntry: (entryId: string) => void

  setHoliday: (date: string, label: string) => void
  clearHoliday: (date: string) => void
}

type SyncState = { loading: boolean; initialized: boolean; syncError: string | null }

export type Store = ScheduleState & SyncState & Actions

function refColor(state: ScheduleState, kind: 'client' | 'category', refId: string): { color: string; label: string } {
  if (kind === 'client') {
    const c = state.clients.find((c) => c.id === refId)
    return { color: c?.color ?? '#94A3B8', label: c?.abbrev ?? '?' }
  }
  const c = state.categories.find((c) => c.id === refId)
  return { color: c?.color ?? '#94A3B8', label: c?.abbrev ?? '?' }
}

let realtimeStarted = false

export const useStore = create<Store>()((set, get) => {
  function subscribeRealtime() {
    if (realtimeStarted) return
    realtimeStarted = true

    supabase
      .channel('agenda-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, (payload) => {
        set((s) => {
          const list = [...s.members]
          if (payload.eventType === 'DELETE') return { members: list.filter((m) => m.id !== (payload.old as MemberRow).id) }
          const mapped = fromMemberRow(payload.new as MemberRow)
          const idx = list.findIndex((m) => m.id === mapped.id)
          if (idx === -1) list.push(mapped)
          else list[idx] = mapped
          return { members: list }
        })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, (payload) => {
        set((s) => {
          const list = [...s.clients]
          if (payload.eventType === 'DELETE') return { clients: list.filter((c) => c.id !== (payload.old as ClientRow).id) }
          const mapped = fromClientRow(payload.new as ClientRow)
          const idx = list.findIndex((c) => c.id === mapped.id)
          if (idx === -1) list.push(mapped)
          else list[idx] = mapped
          return { clients: list }
        })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, (payload) => {
        set((s) => {
          const list = [...s.categories]
          if (payload.eventType === 'DELETE')
            return { categories: list.filter((c) => c.id !== (payload.old as CategoryRow).id) }
          const mapped = fromCategoryRow(payload.new as CategoryRow)
          const idx = list.findIndex((c) => c.id === mapped.id)
          if (idx === -1) list.push(mapped)
          else list[idx] = mapped
          return { categories: list }
        })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entries' }, (payload) => {
        set((s) => {
          const entries = { ...s.entries }
          if (payload.eventType === 'DELETE') {
            delete entries[(payload.old as EntryRow).id]
            return { entries }
          }
          const mapped = fromEntryRow(payload.new as EntryRow)
          entries[mapped.id] = mapped
          return { entries }
        })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'holidays' }, (payload) => {
        set((s) => {
          const holidays = { ...s.holidays }
          if (payload.eventType === 'DELETE') {
            delete holidays[(payload.old as HolidayRow).date]
            return { holidays }
          }
          const mapped = fromHolidayRow(payload.new as HolidayRow)
          holidays[mapped.date] = mapped
          return { holidays }
        })
      })
      .subscribe()
  }

  return {
    members: [],
    clients: [],
    categories: [],
    entries: {},
    holidays: {},
    loading: true,
    initialized: false,
    syncError: null,

    initialize: async () => {
      if (get().initialized) return
      set({ initialized: true })
      const [membersRes, clientsRes, categoriesRes, entriesRes, holidaysRes] = await Promise.all([
        supabase.from('members').select('*'),
        supabase.from('clients').select('*'),
        supabase.from('categories').select('*'),
        supabase.from('entries').select('*'),
        supabase.from('holidays').select('*'),
      ])
      const firstError =
        membersRes.error || clientsRes.error || categoriesRes.error || entriesRes.error || holidaysRes.error
      if (firstError) {
        console.error('[agenda-equipe] initial load failed:', firstError)
        set({ loading: false, syncError: 'Não foi possível conectar à agenda compartilhada. Tente recarregar a página.' })
        return
      }
      const entries: Record<string, Entry> = {}
      for (const row of (entriesRes.data ?? []) as EntryRow[]) {
        const e = fromEntryRow(row)
        entries[e.id] = e
      }
      const holidays: Record<string, Holiday> = {}
      for (const row of (holidaysRes.data ?? []) as HolidayRow[]) {
        const h = fromHolidayRow(row)
        holidays[h.date] = h
      }
      set({
        members: ((membersRes.data ?? []) as MemberRow[]).map(fromMemberRow),
        clients: ((clientsRes.data ?? []) as ClientRow[]).map(fromClientRow),
        categories: ((categoriesRes.data ?? []) as CategoryRow[]).map(fromCategoryRow),
        entries,
        holidays,
        loading: false,
      })
      subscribeRealtime()
    },

    addMember: (name, range) => {
      const member: Member = {
        id: id(),
        name,
        color: nextPaletteColor(get().members.map((m) => m.color)),
        order: get().members.length,
        startDate: range?.startDate,
        endDate: range?.endDate,
      }
      set((s) => ({ members: [...s.members, member] }))
      supabase.from('members').insert(toMemberRow(member)).then(logError('addMember'))
    },
    updateMember: (memberId, patch) => {
      set((s) => ({ members: s.members.map((m) => (m.id === memberId ? { ...m, ...patch } : m)) }))
      const updated = get().members.find((m) => m.id === memberId)
      if (updated) supabase.from('members').update(toMemberRow(updated)).eq('id', memberId).then(logError('updateMember'))
    },
    removeMember: (memberId) => {
      set((s) => {
        const entries = { ...s.entries }
        for (const key of Object.keys(entries)) {
          if (entries[key].memberId === memberId) delete entries[key]
        }
        return { members: s.members.filter((m) => m.id !== memberId), entries }
      })
      supabase.from('members').delete().eq('id', memberId).then(logError('removeMember'))
    },
    reorderMembers: (orderedIds) => {
      set((s) => ({
        members: orderedIds
          .map((oid, idx) => {
            const m = s.members.find((mm) => mm.id === oid)
            return m ? { ...m, order: idx } : null
          })
          .filter((m): m is Member => !!m),
      }))
      Promise.all(orderedIds.map((oid, idx) => supabase.from('members').update({ order: idx }).eq('id', oid))).then(
        (results) => results.forEach(logError('reorderMembers')),
      )
    },

    addClient: (name, abbrev, color, range) => {
      const client: Client = {
        id: id(),
        name,
        abbrev,
        color: color ?? nextPaletteColor(get().clients.map((c) => c.color)),
        order: get().clients.length,
        startDate: range?.startDate,
        endDate: range?.endDate,
      }
      set((s) => ({ clients: [...s.clients, client] }))
      supabase.from('clients').insert(toClientRow(client)).then(logError('addClient'))
    },
    updateClient: (clientId, patch) => {
      set((s) => {
        const clients = s.clients.map((c) => (c.id === clientId ? { ...c, ...patch } : c))
        const entries = { ...s.entries }
        for (const key of Object.keys(entries)) {
          const e = entries[key]
          if (e.kind === 'client' && e.refId === clientId) {
            const updated = clients.find((c) => c.id === clientId)!
            entries[key] = { ...e, color: updated.color, label: updated.abbrev }
          }
        }
        return { clients, entries }
      })
      const updated = get().clients.find((c) => c.id === clientId)
      if (updated) {
        supabase.from('clients').update(toClientRow(updated)).eq('id', clientId).then(logError('updateClient'))
        supabase
          .from('entries')
          .update({ color: updated.color, label: updated.abbrev })
          .match({ kind: 'client', ref_id: clientId })
          .then(logError('updateClient:entries'))
      }
    },
    removeClient: (clientId) => {
      set((s) => {
        const entries = { ...s.entries }
        for (const key of Object.keys(entries)) {
          if (entries[key].kind === 'client' && entries[key].refId === clientId) delete entries[key]
        }
        return { clients: s.clients.filter((c) => c.id !== clientId), entries }
      })
      supabase.from('clients').delete().eq('id', clientId).then(logError('removeClient'))
      supabase.from('entries').delete().match({ kind: 'client', ref_id: clientId }).then(logError('removeClient:entries'))
    },
    reorderClients: (orderedIds) => {
      set((s) => ({
        clients: orderedIds
          .map((oid, idx) => {
            const c = s.clients.find((cc) => cc.id === oid)
            return c ? { ...c, order: idx } : null
          })
          .filter((c): c is Client => !!c),
      }))
      Promise.all(orderedIds.map((oid, idx) => supabase.from('clients').update({ order: idx }).eq('id', oid))).then(
        (results) => results.forEach(logError('reorderClients')),
      )
    },

    addCategory: (name, abbrev, color) => {
      const category: Category = {
        id: id(),
        name,
        abbrev,
        color: color ?? nextPaletteColor(get().categories.map((c) => c.color)),
        order: get().categories.length,
      }
      set((s) => ({ categories: [...s.categories, category] }))
      supabase.from('categories').insert(toCategoryRow(category)).then(logError('addCategory'))
    },
    updateCategory: (categoryId, patch) => {
      set((s) => {
        const categories = s.categories.map((c) => (c.id === categoryId ? { ...c, ...patch } : c))
        const entries = { ...s.entries }
        for (const key of Object.keys(entries)) {
          const e = entries[key]
          if (e.kind === 'category' && e.refId === categoryId) {
            const updated = categories.find((c) => c.id === categoryId)!
            entries[key] = { ...e, color: updated.color, label: updated.abbrev }
          }
        }
        return { categories, entries }
      })
      const updated = get().categories.find((c) => c.id === categoryId)
      if (updated) {
        supabase.from('categories').update(toCategoryRow(updated)).eq('id', categoryId).then(logError('updateCategory'))
        supabase
          .from('entries')
          .update({ color: updated.color, label: updated.abbrev })
          .match({ kind: 'category', ref_id: categoryId })
          .then(logError('updateCategory:entries'))
      }
    },
    removeCategory: (categoryId) => {
      set((s) => {
        const entries = { ...s.entries }
        for (const key of Object.keys(entries)) {
          if (entries[key].kind === 'category' && entries[key].refId === categoryId) delete entries[key]
        }
        return { categories: s.categories.filter((c) => c.id !== categoryId), entries }
      })
      supabase.from('categories').delete().eq('id', categoryId).then(logError('removeCategory'))
      supabase
        .from('entries')
        .delete()
        .match({ kind: 'category', ref_id: categoryId })
        .then(logError('removeCategory:entries'))
    },
    reorderCategories: (orderedIds) => {
      set((s) => ({
        categories: orderedIds
          .map((oid, idx) => {
            const c = s.categories.find((cc) => cc.id === oid)
            return c ? { ...c, order: idx } : null
          })
          .filter((c): c is Category => !!c),
      }))
      Promise.all(orderedIds.map((oid, idx) => supabase.from('categories').update({ order: idx }).eq('id', oid))).then(
        (results) => results.forEach(logError('reorderCategories')),
      )
    },

    addEntry: (memberId, date, input) => {
      const s = get()
      const entryId = id()
      const schedule = {
        allDay: input.allDay,
        time: input.allDay ? undefined : input.time,
        endTime: input.allDay ? undefined : input.endTime,
        modality: input.modality,
        travelConfirmed: input.modality === 'presencial' ? input.travelConfirmed : undefined,
        notes: input.notes,
        link: input.link,
      }
      let entry: Entry
      if (input.kind === 'meeting') {
        entry = { id: entryId, memberId, date, kind: 'meeting', label: input.label, color: '#334155', ...schedule }
      } else {
        const { color, label } = refColor(s, input.kind, input.refId)
        entry = { id: entryId, memberId, date, kind: input.kind, refId: input.refId, label, color, ...schedule }
      }
      set((st) => ({ entries: { ...st.entries, [entryId]: entry } }))
      supabase.from('entries').insert(toEntryRow(entry)).then(logError('addEntry'))
    },

    updateEntry: (entryId, patch) => {
      set((s) => {
        const entry = s.entries[entryId]
        if (!entry) return {}
        const merged = { ...entry, ...patch }
        if (merged.allDay) {
          merged.time = undefined
          merged.endTime = undefined
        }
        if (merged.modality !== 'presencial') {
          merged.travelConfirmed = undefined
        }
        return { entries: { ...s.entries, [entryId]: merged } }
      })
      const updated = get().entries[entryId]
      if (updated) supabase.from('entries').update(toEntryRow(updated)).eq('id', entryId).then(logError('updateEntry'))
    },

    moveEntry: (entryId, toMemberId, toDate) => {
      set((s) => {
        const entry = s.entries[entryId]
        if (!entry) return {}
        return { entries: { ...s.entries, [entryId]: { ...entry, memberId: toMemberId, date: toDate } } }
      })
      supabase
        .from('entries')
        .update({ member_id: toMemberId, date: toDate })
        .eq('id', entryId)
        .then(logError('moveEntry'))
    },

    duplicateEntry: (entryId, toDate, toMemberId) => {
      const source = get().entries[entryId]
      if (!source) return
      const newId = id()
      const copy: Entry = { ...source, id: newId, date: toDate, memberId: toMemberId ?? source.memberId }
      set((s) => ({ entries: { ...s.entries, [newId]: copy } }))
      supabase.from('entries').insert(toEntryRow(copy)).then(logError('duplicateEntry'))
    },

    removeEntry: (entryId) => {
      set((s) => {
        const entries = { ...s.entries }
        delete entries[entryId]
        return { entries }
      })
      supabase.from('entries').delete().eq('id', entryId).then(logError('removeEntry'))
    },

    setHoliday: (date, label) => {
      set((s) => ({ holidays: { ...s.holidays, [date]: { date, label } as Holiday } }))
      supabase.from('holidays').upsert({ date, label }).then(logError('setHoliday'))
    },
    clearHoliday: (date) => {
      set((s) => {
        const holidays = { ...s.holidays }
        delete holidays[date]
        return { holidays }
      })
      supabase.from('holidays').delete().eq('date', date).then(logError('clearHoliday'))
    },
  }
})
