import { nanoid } from 'nanoid'
import type { Category, Client, Member, ScheduleState } from '../types'
import { PALETTE } from '../utils/color'

function id() {
  return nanoid(8)
}

const memberSeed: Array<Omit<Member, 'id' | 'order'>> = [
  { name: 'Thiago', color: '#3B82F6' },
  { name: 'Danilo', color: '#10B981' },
  { name: 'Marina', color: '#D946EF' },
  { name: 'Milena', color: '#F59E0B' },
]

const clientSeed: Array<Omit<Client, 'id'>> = [
  { name: 'APAE Santo André', abbrev: 'APAE SA', color: PALETTE[0] },
  { name: 'APAE Sorocaba', abbrev: 'SRC', color: PALETTE[1] },
  { name: 'Instituto do Câncer Dr. Arnaldo', abbrev: 'Dr.A', color: PALETTE[2] },
  { name: 'Associação Cuidado Humano', abbrev: 'ACH', color: PALETTE[3] },
  { name: 'Hospital do Câncer de Londrina', abbrev: 'HCL', color: PALETTE[4] },
  { name: 'APAE São Luiz', abbrev: 'SLZ', color: PALETTE[5] },
  { name: 'Escola Americana de Campinas', abbrev: 'EAC', color: PALETTE[6] },
  { name: 'APAE Patrocínio', abbrev: 'CAPTA', color: PALETTE[7] },
  { name: 'Instituto Terra', abbrev: 'IT', color: PALETTE[8] },
]

const categorySeed: Array<Omit<Category, 'id'>> = [
  { name: 'Particular', abbrev: 'Particular', color: '#64748B' },
  { name: 'Feriado', abbrev: 'Feriado', color: '#EF4444' },
  { name: 'Viagem', abbrev: 'Viagem', color: '#0EA5E9' },
  { name: 'Interno / Organização', abbrev: 'Interno', color: '#94A3B8' },
  { name: 'Evento', abbrev: 'Evento', color: '#A855F7' },
]

export function buildSeedState(): ScheduleState {
  const members: Member[] = memberSeed.map((m, i) => ({ ...m, id: id(), order: i }))
  const clients: Client[] = clientSeed.map((c) => ({ ...c, id: id() }))
  const categories: Category[] = categorySeed.map((c) => ({ ...c, id: id() }))

  return {
    members,
    clients,
    categories,
    entries: {},
    holidays: {},
  }
}
