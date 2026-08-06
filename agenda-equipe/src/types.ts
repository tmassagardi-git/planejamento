export type Member = {
  id: string
  name: string
  color: string
  order: number
}

export type Client = {
  id: string
  name: string
  abbrev: string
  color: string
}

export type Category = {
  id: string
  name: string
  abbrev: string
  color: string
}

export type EntryKind = 'client' | 'category' | 'meeting'

export type Entry = {
  id: string
  memberId: string
  date: string // 'YYYY-MM-DD'
  kind: EntryKind
  refId?: string // client or category id (when kind is client/category)
  label: string // display text (abbrev, or free text for meetings)
  detail?: string // optional longer note / time
  color: string
  isFullDay: boolean
}

export type Holiday = {
  date: string // 'YYYY-MM-DD'
  label: string
}

export type ScheduleState = {
  members: Member[]
  clients: Client[]
  categories: Category[]
  entries: Record<string, Entry> // key: `${memberId}|${date}`
  holidays: Record<string, Holiday> // key: date
}
