// Modelo de dados do CRM.
//
// Convenções pensadas para migração futura ao Supabase/Postgres (via Lovable):
// - ids são strings (uuid v4) -> mapeiam para `uuid` no Postgres
// - datas são strings ISO 'YYYY-MM-DD' (sem hora) -> mapeiam para `date`
// - timestamps são strings ISO completas -> mapeiam para `timestamptz`
// - valores monetários são `number` em reais (não centavos)
// - toda entidade tem `id`, `createdAt`, `updatedAt`

export type ID = string;

export interface BaseEntity {
  id: ID;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface Company extends BaseEntity {
  name: string;
  cnpj?: string;
  segment?: string; // segmento de atuação
  url?: string;
  address?: string;
  phone?: string;
  email?: string;
  notes?: string;
  tags?: string[]; // ex.: "Empresa Amiga", "Ex-doador"
}

export interface Contact extends BaseEntity {
  companyId: ID;
  name: string;
  role?: string; // cargo
  phone?: string;
  whatsapp?: string;
  email?: string;
  isPrimary?: boolean;
  notes?: string;
  previousCompanyIds?: ID[]; // histórico de empresas anteriores (ao trocar de empresa)
}

export interface Funnel extends BaseEntity {
  name: string;
  isDefault?: boolean;
}

export interface Stage extends BaseEntity {
  funnelId: ID;
  name: string;
  order: number;
  color: string; // hex, usado no kanban
}

export type OpportunityStatus = 'aberta' | 'ganha' | 'perdida';

export interface Opportunity extends BaseEntity {
  funnelId: ID;
  stageId: ID;
  companyId: ID;
  contactId?: ID;
  name: string; // nome da oportunidade
  proposal?: string; // o que foi ofertado
  value?: number; // valor total proposto
  workingMonth?: string; // 'YYYY-MM' - mês que está sendo trabalhado
  expectedCloseDate?: string; // 'YYYY-MM-DD' - previsão de fechamento
  notes?: string; // observação
  status: OpportunityStatus;
  lostReason?: string;
  closedAt?: string; // ISO timestamp de quando ganhou/perdeu
  order: number; // ordenação dentro da etapa (drag and drop)
  donationId?: ID; // preenchido quando a oportunidade gera uma doação (ganha)
}

export type DonationStatus = 'ativa' | 'concluida' | 'cancelada';

export interface Donation extends BaseEntity {
  companyId: ID;
  opportunityId?: ID;
  project: string; // projeto que a doação apoia
  category?: string; // cota / categoria (ex.: Bronze, Prata, Ouro...)
  strategy?: string; // estratégia (ex.: Empresa Amiga, Corrida...)
  totalValue: number;
  installmentsCount: number;
  startDate: string; // 'YYYY-MM-DD'
  status: DonationStatus;
  notes?: string;
}

export type InstallmentStatus = 'em_aberto' | 'pago' | 'cancelado' | 'permuta';

export interface Installment extends BaseEntity {
  donationId: ID;
  number: number; // nº da parcela
  value: number;
  dueDate: string; // 'YYYY-MM-DD' - data prevista
  paymentDate?: string; // 'YYYY-MM-DD' - data da baixa
  status: InstallmentStatus;
  paymentMethod?: string; // meio de pagamento
  notes?: string;
}

export interface Catalog extends BaseEntity {
  // singleton (sempre 1 registro) com listas configuráveis usadas em selects
  categories: string[]; // cotas/categorias de doação
  strategies: string[]; // estratégias de captação
  paymentMethods: string[]; // meios de pagamento
  lossReasons: string[]; // motivos de perda de oportunidade
  relationshipTypes: string[]; // tipos de conexão do mapa de relacionamento
}

// --- Mapa de relacionamento entre contatos ---
// Uma conexão liga dois contatos (de qualquer empresa) com um tipo de
// relação. O tipo pode ser diferente em cada sentido (ex.: A é "Pai" de B,
// B é "Filho(a)" de A) — para relações simétricas (Amigos, Família,
// Colegas de trabalho) os dois lados usam o mesmo tipo.
export interface ContactConnection extends BaseEntity {
  contactAId: ID;
  contactBId: ID;
  tipoAB: string; // tipo de A em relação a B
  tipoBA: string; // tipo de B em relação a A
  auto?: boolean; // criada automaticamente por estarem/terem estado na mesma empresa
  notes?: string;
}

// --- Sistema VIC (Vínculo, Interesse, Capacidade) ---
// Método de qualificação de prospects: cada critério pertence a um dos três
// eixos e tem um peso; a nota de um eixo é a média ponderada das notas
// (0-5) dadas a cada critério daquele eixo. Uma empresa pode ter mais de
// uma avaliação VIC (uma por projeto).

export type VicAxis = 'V' | 'I' | 'C';

export interface VicCriterion extends BaseEntity {
  eixo: VicAxis;
  nome: string;
  peso: number; // os pesos de cada eixo devem somar 10
  order: number;
}

export interface VicEvaluation extends BaseEntity {
  companyId: ID;
  projeto: string; // enquadramento da avaliação, ex. "Institucional"
  notas: Record<string, number>; // criterionId -> nota 0..5
  obs: Record<string, string>; // criterionId -> observação livre
}
