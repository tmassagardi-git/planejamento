import type { Category, Client, Entry, Holiday, Member } from '../types'

// Supabase rows use snake_case; the app model uses camelCase. Keep the
// conversion in one place so store.ts stays readable.

export type MemberRow = {
  id: string
  name: string
  color: string
  order: number
  start_date: string | null
  end_date: string | null
}

export type ClientRow = MemberRow & { abbrev: string }
export type CategoryRow = { id: string; name: string; abbrev: string; color: string; order: number }

export type EntryRow = {
  id: string
  member_id: string
  date: string
  kind: string
  ref_id: string | null
  label: string
  all_day: boolean
  time: string | null
  end_time: string | null
  modality: string | null
  travel_confirmed: boolean | null
  notes: string | null
  link: string | null
  color: string
}

export type HolidayRow = { date: string; label: string }

export function fromMemberRow(row: MemberRow): Member {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    order: row.order,
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
  }
}

export function toMemberRow(m: Member): MemberRow {
  return { id: m.id, name: m.name, color: m.color, order: m.order, start_date: m.startDate ?? null, end_date: m.endDate ?? null }
}

export function fromClientRow(row: ClientRow): Client {
  return { ...fromMemberRow(row), abbrev: row.abbrev }
}

export function toClientRow(c: Client): ClientRow {
  return { ...toMemberRow(c), abbrev: c.abbrev }
}

export function fromCategoryRow(row: CategoryRow): Category {
  return { id: row.id, name: row.name, abbrev: row.abbrev, color: row.color, order: row.order }
}

export function toCategoryRow(c: Category): CategoryRow {
  return { id: c.id, name: c.name, abbrev: c.abbrev, color: c.color, order: c.order }
}

export function fromEntryRow(row: EntryRow): Entry {
  return {
    id: row.id,
    memberId: row.member_id,
    date: row.date,
    kind: row.kind as Entry['kind'],
    refId: row.ref_id ?? undefined,
    label: row.label,
    allDay: row.all_day,
    time: row.time ?? undefined,
    endTime: row.end_time ?? undefined,
    modality: (row.modality as Entry['modality']) ?? undefined,
    travelConfirmed: row.travel_confirmed ?? undefined,
    notes: row.notes ?? undefined,
    link: row.link ?? undefined,
    color: row.color,
  }
}

export function toEntryRow(e: Entry): EntryRow {
  return {
    id: e.id,
    member_id: e.memberId,
    date: e.date,
    kind: e.kind,
    ref_id: e.refId ?? null,
    label: e.label,
    all_day: e.allDay,
    time: e.time ?? null,
    end_time: e.endTime ?? null,
    modality: e.modality ?? null,
    travel_confirmed: e.travelConfirmed ?? null,
    notes: e.notes ?? null,
    link: e.link ?? null,
    color: e.color,
  }
}

export function fromHolidayRow(row: HolidayRow): Holiday {
  return { date: row.date, label: row.label }
}
