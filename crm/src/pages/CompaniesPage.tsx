import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import type { Company } from '../lib/types';
import { Badge, Button, Input } from '../components/ui/Primitives';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { CompanyForm } from '../components/CompanyForm';
import { CompanyDetailDrawer } from '../components/CompanyDetailDrawer';
import { deleteCompany } from '../services/companies';
import { formatDate } from '../lib/format';
import { Plus, Search, Trash2 } from 'lucide-react';

export function CompaniesPage() {
  const companies = useLiveQuery(() => db.companies.orderBy('name').toArray(), []);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);

  const filtered = useMemo(() => {
    if (!companies) return [];
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.cnpj?.toLowerCase().includes(q) ||
        c.segment?.toLowerCase().includes(q),
    );
  }, [companies, search]);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Empresas</h1>
          <p className="text-sm text-slate-500">Cadastro de empresas prospectadas e doadoras</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus size={16} /> Nova empresa
        </Button>
      </div>

      <div className="mb-4 relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, CNPJ ou segmento..."
          className="pl-9"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Nome</th>
              <th className="px-4 py-2.5">Segmento</th>
              <th className="px-4 py-2.5">Tags</th>
              <th className="px-4 py-2.5">Cadastrada em</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((company) => (
              <tr
                key={company.id}
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => setSelectedId(company.id)}
              >
                <td className="px-4 py-3 font-medium text-slate-900">{company.name}</td>
                <td className="px-4 py-3 text-slate-500">{company.segment || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {company.tags?.map((t) => (
                      <Badge key={t}>{t}</Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDate(company.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingCompany(company);
                    }}
                    className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {companies && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  Nenhuma empresa encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="Nova empresa">
        <CompanyForm
          onSaved={(id) => {
            setCreating(false);
            setSelectedId(id);
          }}
          onCancel={() => setCreating(false)}
        />
      </Modal>

      {selectedId && <CompanyDetailDrawer companyId={selectedId} onClose={() => setSelectedId(null)} />}

      <ConfirmDialog
        open={!!deletingCompany}
        onClose={() => setDeletingCompany(null)}
        onConfirm={() => deletingCompany && deleteCompany(deletingCompany.id)}
        title="Excluir empresa"
        message={`Isso excluirá "${deletingCompany?.name}" e todos os contatos, oportunidades e doações relacionadas. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
      />
    </div>
  );
}
