export type Member = {
  id: string
  name: string
  color: string
  order: number
  startDate?: string // 'YYYY-MM-DD' — only shows in the calendar from this month on, if set
  endDate?: string // 'YYYY-MM-DD' — stops showing in the calendar after this month, if set
}

export type Client = {
  id: string
  name: string
  abbrev: string
  color: string
  order: number
  startDate?: string // 'YYYY-MM-DD' — only shows in the sidebar/picker from this month on, if set
  endDate?: string // 'YYYY-MM-DD' — stops showing in the sidebar/picker after this month, if set
}

export type Category = {
  id: string
  name: string
  abbrev: string
  color: string
  order: number
}

export type EntryKind = 'client' | 'category' | 'meeting'

export type Modality = 'presencial' | 'online'

export type Entry = {
  id: string
  memberId: string
  date: string // 'YYYY-MM-DD'
  kind: EntryKind
  refId?: string // client or category id (when kind is client/category)
  label: string // display text (abbrev, or free text for meetings)
  allDay: boolean // true = "dia todo" (no specific time); false = scheduled with a time
  time?: string // 'HH:MM' 24h — start time, only when !allDay
  endTime?: string // 'HH:MM' 24h — optional end time, only when !allDay
  modality?: Modality // optional — shows an icon next to the label
  travelConfirmed?: boolean // only meaningful when modality === 'presencial' — flight/lodging bookings confirmed
  notes?: string // optional free-text note, shown on hover
  link?: string // optional meeting URL
  color: string
  googleEventId?: string // set once this entry has been pushed to / pulled from Google Calendar
  googleUpdatedAt?: string // Google's `updated` timestamp for googleEventId, used to avoid sync loops
}

export type Holiday = {
  date: string // 'YYYY-MM-DD'
  label: string
}

export type ScheduleState = {
  members: Member[]
  clients: Client[]
  categories: Category[]
  entries: Record<string, Entry> // key: entry.id — several entries can share the same memberId+date
  holidays: Record<string, Holiday> // key: date
}
