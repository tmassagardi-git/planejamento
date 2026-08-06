import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { buildSeedState } from './data/seed'
import type { Category, Client, Entry, Holiday, Member, ScheduleState } from './types'
import { nextPaletteColor } from './utils/color'

function id() {
  return nanoid(8)
}

export function entryKey(memberId: string, date: string) {
  return `${memberId}|${date}`
}

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

  setFullDayEntry: (memberId: string, date: string, kind: 'client' | 'category', refId: string) => void
  setMeetingEntry: (memberId: string, date: string, label: string, detail?: string, color?: string) => void
  moveEntry: (fromMemberId: string, fromDate: string, toMemberId: string, toDate: string) => void
  extendEntryRange: (memberId: string, fromDate: string, toDate: string) => void
  clearEntry: (memberId: string, date: string) => void

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

      setFullDayEntry: (memberId, date, kind, refId) =>
        set((s) => {
          const { color, label } = refColor(s, kind, refId)
          const key = entryKey(memberId, date)
          const entry: Entry = { id: id(), memberId, date, kind, refId, label, color, isFullDay: true }
          return { entries: { ...s.entries, [key]: entry } }
        }),

      setMeetingEntry: (memberId, date, label, detail, color) =>
        set((s) => {
          const key = entryKey(memberId, date)
          const entry: Entry = {
            id: id(),
            memberId,
            date,
            kind: 'meeting',
            label,
            detail,
            color: color ?? '#334155',
            isFullDay: false,
          }
          return { entries: { ...s.entries, [key]: entry } }
        }),

      moveEntry: (fromMemberId, fromDate, toMemberId, toDate) =>
        set((s) => {
          const fromKey = entryKey(fromMemberId, fromDate)
          const toKey = entryKey(toMemberId, toDate)
          const entry = s.entries[fromKey]
          if (!entry) return {}
          const entries = { ...s.entries }
          delete entries[fromKey]
          entries[toKey] = { ...entry, memberId: toMemberId, date: toDate }
          return { entries }
        }),

      extendEntryRange: (memberId, fromDate, toDate) =>
        set((s) => {
          const fromKey = entryKey(memberId, fromDate)
          const source = s.entries[fromKey]
          if (!source) return {}
          const start = fromDate < toDate ? fromDate : toDate
          const end = fromDate < toDate ? toDate : fromDate
          const entries = { ...s.entries }
          let cursor = new Date(start + 'T00:00:00')
          const endDate = new Date(end + 'T00:00:00')
          while (cursor <= endDate) {
            const iso = cursor.toISOString().slice(0, 10)
            const key = entryKey(memberId, iso)
            entries[key] = { ...source, id: iso === fromDate ? source.id : id(), date: iso }
            cursor = new Date(cursor.getTime() + 86400000)
          }
          return { entries }
        }),

      clearEntry: (memberId, date) =>
        set((s) => {
          const key = entryKey(memberId, date)
          const entries = { ...s.entries }
          delete entries[key]
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
    { name: 'agenda-equipe-store' },
  ),
)
