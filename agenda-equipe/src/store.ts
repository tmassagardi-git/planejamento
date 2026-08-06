import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { buildSeedState } from './data/seed'
import type { Category, Client, Entry, Holiday, Member, Modality, ScheduleState } from './types'
import { nextPaletteColor } from './utils/color'

function id() {
  return nanoid(8)
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

type Actions = {
  addMember: (name: string) => void
  updateMember: (id: string, patch: Partial<Omit<Member, 'id'>>) => void
  removeMember: (id: string) => void
  reorderMembers: (orderedIds: string[]) => void

  addClient: (name: string, abbrev: string, color?: string) => void
  updateClient: (id: string, patch: Partial<Omit<Client, 'id'>>) => void
  removeClient: (id: string) => void

  addCategory: (name: string, abbrev: string, color?: string) => void
  updateCategory: (id: string, patch: Partial<Omit<Category, 'id'>>) => void
  removeCategory: (id: string) => void

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

  resetToSeed: () => void
}

export type Store = ScheduleState & Actions

function refColor(state: ScheduleState, kind: 'client' | 'category', refId: string): { color: string; label: string } {
  if (kind === 'client') {
    const c = state.clients.find((c) => c.id === refId)
    return { color: c?.color ?? '#94A3B8', label: c?.abbrev ?? '?' }
  }
  const c = state.categories.find((c) => c.id === refId)
  return { color: c?.color ?? '#94A3B8', label: c?.abbrev ?? '?' }
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...buildSeedState(),

      addMember: (name) =>
        set((s) => ({
          members: [
            ...s.members,
            { id: id(), name, color: nextPaletteColor(s.members.map((m) => m.color)), order: s.members.length },
          ],
        })),
      updateMember: (memberId, patch) =>
        set((s) => ({ members: s.members.map((m) => (m.id === memberId ? { ...m, ...patch } : m)) })),
      removeMember: (memberId) =>
        set((s) => {
          const entries = { ...s.entries }
          for (const key of Object.keys(entries)) {
            if (entries[key].memberId === memberId) delete entries[key]
          }
          return { members: s.members.filter((m) => m.id !== memberId), entries }
        }),
      reorderMembers: (orderedIds) =>
        set((s) => ({
          members: orderedIds
            .map((oid, idx) => {
              const m = s.members.find((mm) => mm.id === oid)
              return m ? { ...m, order: idx } : null
            })
            .filter((m): m is Member => !!m),
        })),

      addClient: (name, abbrev, color) =>
        set((s) => ({
          clients: [
            ...s.clients,
            { id: id(), name, abbrev, color: color ?? nextPaletteColor(s.clients.map((c) => c.color)) },
          ],
        })),
      updateClient: (clientId, patch) =>
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
        }),
      removeClient: (clientId) =>
        set((s) => {
          const entries = { ...s.entries }
          for (const key of Object.keys(entries)) {
            if (entries[key].kind === 'client' && entries[key].refId === clientId) delete entries[key]
          }
          return { clients: s.clients.filter((c) => c.id !== clientId), entries }
        }),

      addCategory: (name, abbrev, color) =>
        set((s) => ({
          categories: [
            ...s.categories,
            { id: id(), name, abbrev, color: color ?? nextPaletteColor(s.categories.map((c) => c.color)) },
          ],
        })),
      updateCategory: (categoryId, patch) =>
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
        }),
      removeCategory: (categoryId) =>
        set((s) => {
          const entries = { ...s.entries }
          for (const key of Object.keys(entries)) {
            if (entries[key].kind === 'category' && entries[key].refId === categoryId) delete entries[key]
          }
          return { categories: s.categories.filter((c) => c.id !== categoryId), entries }
        }),

      addEntry: (memberId, date, input) =>
        set((s) => {
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
          return { entries: { ...s.entries, [entryId]: entry } }
        }),

      updateEntry: (entryId, patch) =>
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
        }),

      moveEntry: (entryId, toMemberId, toDate) =>
        set((s) => {
          const entry = s.entries[entryId]
          if (!entry) return {}
          return { entries: { ...s.entries, [entryId]: { ...entry, memberId: toMemberId, date: toDate } } }
        }),

      duplicateEntry: (entryId, toDate, toMemberId) =>
        set((s) => {
          const entry = s.entries[entryId]
          if (!entry) return {}
          const newId = id()
          const copy: Entry = { ...entry, id: newId, date: toDate, memberId: toMemberId ?? entry.memberId }
          return { entries: { ...s.entries, [newId]: copy } }
        }),

      removeEntry: (entryId) =>
        set((s) => {
          const entries = { ...s.entries }
          delete entries[entryId]
          return { entries }
        }),

      setHoliday: (date, label) =>
        set((s) => ({ holidays: { ...s.holidays, [date]: { date, label } as Holiday } })),
      clearHoliday: (date) =>
        set((s) => {
          const holidays = { ...s.holidays }
          delete holidays[date]
          return { holidays }
        }),

      resetToSeed: () => set(() => buildSeedState()),
    }),
    { name: 'agenda-equipe-store-v2' },
  ),
)
