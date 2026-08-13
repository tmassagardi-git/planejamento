import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { DonationCard } from '../components/DonationCard';
import { DonationForm } from '../components/DonationForm';
import { Modal } from '../components/ui/Modal';
import { Button, Input, Select } from '../components/ui/Primitives';
import { formatCurrency } from '../lib/format';
import { Plus, Search } from 'lucide-react';

export function DonationsPage() {
  const donations = useLiveQuery(() => db.donations.reverse().sortBy('startDate'), []);
  const companies = useLiveQuery(() => db.companies.toArray(), []);
  const installments = useLiveQuery(() => db.installments.toArray(), []);
  const companyById = useMemo(() => new Map((companies ?? []).map((c) => [c.id, c])), [companies]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todas' | 'ativa' | 'concluida' | 'cancelada'>('todas');
  const [creating, setCreating] = useState(false);
  const [creatingCompanyId, setCreatingCompanyId] = useState('');

  const filtered = useMemo(() => {
    if (!donations) return [];
    const q = search.trim().toLowerCase();
    return donations.filter((d) => {
      if (statusFilter !== 'todas' && d.status !== statusFilter) return false;
      if (!q) return true;
      const companyName = companyById.get(d.companyId)?.name.toLowerCase() ?? '';
      return companyName.includes(q) || d.project.toLowerCase().includes(q) || d.category?.toLowerCase().includes(q);
    });
  }, [donations, search, statusFilter, companyById]);

  const totals = useMemo(() => {
    if (!installments) return { emAberto: 0, pago: 0, atrasado: 0 };
    const today = new Date().toISOString().slice(0, 10);
    let emAberto = 0;
    let pago = 0;
    let atrasado = 0;
    for (const inst of installments) {
      if (inst.status === 'pago') pago += inst.value;
      else if (inst.status === 'em_aberto') {
        emAberto += inst.value;
        if (inst.dueDate < today) atrasado += inst.value;
      }
    }
    return { emAberto, pago, atrasado };
  }, [installments]);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Doações</h1>
          <p className="text-sm text-slate-500">Controle financeiro de doações e parcelas dos doadores</p>
        </div>
        <Button
          onClick={() => {
            setCreatingCompanyId(companies?.[0]?.id ?? '');
            setCreating(true);
          }}
          disabled={!companies?.length}
        >
          <Plus size={16} /> Nova doação
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-400">Recebido</div>
          <div className="text-xl font-bold text-emerald-600">{formatCurrency(totals.pago)}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-400">Em aberto</div>
          <div className="text-xl font-bold text-amber-600">{formatCurrency(totals.emAberto)}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-400">Atrasado</div>
          <div className="text-xl font-bold text-red-600">{formatCurrency(totals.atrasado)}</div>
        </div>
      </div>

      <div className="mb-4 flex gap-3">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por empresa, projeto ou categoria..."
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="w-44"
        >
          <option value="todas">Todos os status</option>
          <option value="ativa">Ativas</option>
          <option value="concluida">Concluídas</option>
          <option value="cancelada">Canceladas</option>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.map((donation) => (
          <DonationCard key={donation.id} donation={donation} companyName={companyById.get(donation.companyId)?.name} />
        ))}
        {donations && filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-400">Nenhuma doação encontrada.</p>
        )}
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="Nova doação" width="lg">
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-slate-600">Empresa *</label>
          <Select value={creatingCompanyId} onChange={(e) => setCreatingCompanyId(e.target.value)}>
            {companies?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        {creatingCompanyId && (
          <DonationForm
            companyId={creatingCompanyId}
            onSaved={() => setCreating(false)}
            onCancel={() => setCreating(false)}
          />
        )}
      </Modal>
    </div>
  );
}
