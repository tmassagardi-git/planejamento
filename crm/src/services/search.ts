import { db } from '../lib/db';

export type SearchResultType = 'empresa' | 'contato' | 'oportunidade' | 'doacao' | 'vic';

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle: string;
  companyId: string; // sempre presente: toda entidade buscável está ligada a uma empresa
}

const TYPE_LABEL: Record<SearchResultType, string> = {
  empresa: 'Empresa',
  contato: 'Contato',
  oportunidade: 'Oportunidade',
  doacao: 'Doação',
  vic: 'VIC',
};

export function searchResultTypeLabel(type: SearchResultType): string {
  return TYPE_LABEL[type];
}

const MAX_RESULTS = 20;

/** Busca por texto livre nas principais entidades do CRM. Não usa índice de
 * texto do Dexie (dataset pequeno o bastante para varrer em memória) —
 * simples `includes` case-insensitive nos campos relevantes de cada
 * entidade, incluindo o nome da empresa relacionada. */
export async function globalSearch(query: string): Promise<SearchResult[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const [companies, contacts, opportunities, donations, vicEvaluations] = await Promise.all([
    db.companies.toArray(),
    db.contacts.toArray(),
    db.opportunities.toArray(),
    db.donations.toArray(),
    db.vicEvaluations.toArray(),
  ]);
  const companyById = new Map(companies.map((c) => [c.id, c]));

  const results: SearchResult[] = [];

  for (const c of companies) {
    if (`${c.name} ${c.cnpj ?? ''} ${c.segment ?? ''}`.toLowerCase().includes(q)) {
      results.push({ type: 'empresa', id: c.id, title: c.name, subtitle: c.segment || 'Empresa', companyId: c.id });
    }
  }

  for (const c of contacts) {
    const companyName = companyById.get(c.companyId)?.name ?? '';
    if (`${c.name} ${c.role ?? ''} ${c.email ?? ''} ${companyName}`.toLowerCase().includes(q)) {
      results.push({
        type: 'contato',
        id: c.id,
        title: c.name,
        subtitle: [c.role, companyName].filter(Boolean).join(' · ') || 'Contato',
        companyId: c.companyId,
      });
    }
  }

  for (const o of opportunities) {
    const companyName = companyById.get(o.companyId)?.name ?? '';
    if (`${o.name} ${o.proposal ?? ''} ${companyName}`.toLowerCase().includes(q)) {
      results.push({ type: 'oportunidade', id: o.id, title: o.name, subtitle: companyName, companyId: o.companyId });
    }
  }

  for (const d of donations) {
    const companyName = companyById.get(d.companyId)?.name ?? '';
    if (`${d.project} ${d.category ?? ''} ${companyName}`.toLowerCase().includes(q)) {
      results.push({
        type: 'doacao',
        id: d.id,
        title: d.project,
        subtitle: [companyName, d.category].filter(Boolean).join(' · '),
        companyId: d.companyId,
      });
    }
  }

  for (const v of vicEvaluations) {
    const companyName = companyById.get(v.companyId)?.name ?? '';
    if (`${v.projeto} ${companyName}`.toLowerCase().includes(q)) {
      results.push({
        type: 'vic',
        id: v.id,
        title: `${companyName} — ${v.projeto}`,
        subtitle: 'Avaliação VIC',
        companyId: v.companyId,
      });
    }
  }

  results.sort((a, b) => {
    const aStarts = a.title.toLowerCase().startsWith(q);
    const bStarts = b.title.toLowerCase().startsWith(q);
    if (aStarts !== bStarts) return aStarts ? -1 : 1;
    return a.title.localeCompare(b.title, 'pt-BR');
  });

  return results.slice(0, MAX_RESULTS);
}
