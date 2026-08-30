import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { globalSearch, searchResultTypeLabel, type SearchResult, type SearchResultType } from '../services/search';
import { CompanyDetailDrawer } from './CompanyDetailDrawer';
import { OpportunityDrawer } from './OpportunityDrawer';
import { ContactForm } from './ContactForm';
import { Modal } from './ui/Modal';
import { Building2, HeartHandshake, Kanban, Search, Target, Users } from 'lucide-react';

const TYPE_ICON: Record<SearchResultType, typeof Building2> = {
  empresa: Building2,
  contato: Users,
  oportunidade: Kanban,
  doacao: HeartHandshake,
  vic: Target,
};

const TYPE_COLOR: Record<SearchResultType, string> = {
  empresa: 'text-indigo-600 bg-indigo-50',
  contato: 'text-sky-600 bg-sky-50',
  oportunidade: 'text-amber-600 bg-amber-50',
  doacao: 'text-emerald-600 bg-emerald-50',
  vic: 'text-purple-600 bg-purple-50',
};

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [companyView, setCompanyView] = useState<{ id: string; tab: string; vicEvaluationId?: string } | null>(null);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);

  const editingContact = useLiveQuery(
    () => (editingContactId ? db.contacts.get(editingContactId) : undefined),
    [editingContactId],
  );

  const results = useLiveQuery(() => globalSearch(query), [query]) ?? [];

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function handleSelect(result: SearchResult) {
    setOpen(false);
    setQuery('');
    switch (result.type) {
      case 'empresa':
        setCompanyView({ id: result.id, tab: 'dados' });
        break;
      case 'contato':
        setEditingContactId(result.id);
        break;
      case 'oportunidade':
        setSelectedOpportunityId(result.id);
        break;
      case 'doacao':
        setCompanyView({ id: result.companyId, tab: 'doacoes' });
        break;
      case 'vic':
        setCompanyView({ id: result.companyId, tab: 'vic', vicEvaluationId: result.id });
        break;
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        placeholder="Buscar empresas, contatos, oportunidades, doações..."
        className="w-full rounded-md border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />

      {open && query.trim().length >= 2 && (
        <div className="absolute z-30 mt-1 max-h-96 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-400">Nenhum resultado para "{query}"</p>
          ) : (
            results.map((r) => {
              const Icon = TYPE_ICON[r.type];
              return (
                <button
                  key={`${r.type}-${r.id}`}
                  onClick={() => handleSelect(r)}
                  className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-2.5 text-left last:border-b-0 hover:bg-slate-50"
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${TYPE_COLOR[r.type]}`}>
                    <Icon size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-900">{r.title}</span>
                    <span className="block truncate text-xs text-slate-500">{r.subtitle}</span>
                  </span>
                  <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    {searchResultTypeLabel(r.type)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}

      {companyView && (
        <CompanyDetailDrawer
          companyId={companyView.id}
          initialTab={companyView.tab}
          initialVicEvaluationId={companyView.vicEvaluationId}
          onClose={() => setCompanyView(null)}
        />
      )}

      {editingContactId && editingContact && (
        <Modal open onClose={() => setEditingContactId(null)} title="Editar contato">
          <ContactForm
            contact={editingContact}
            onSaved={() => setEditingContactId(null)}
            onCancel={() => setEditingContactId(null)}
          />
        </Modal>
      )}

      {selectedOpportunityId && (
        <OpportunityDrawer opportunityId={selectedOpportunityId} onClose={() => setSelectedOpportunityId(null)} />
      )}
    </div>
  );
}
