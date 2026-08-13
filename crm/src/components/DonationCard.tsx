import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import type { Donation } from '../lib/types';
import { formatCurrency, formatDate } from '../lib/format';
import { Badge, Button } from './ui/Primitives';
import { InstallmentRow } from './InstallmentRow';
import { ConfirmDialog } from './ui/Modal';
import { deleteDonation, updateDonation } from '../services/donations';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';

const STATUS_BADGE: Record<Donation['status'], { label: string; color: 'green' | 'slate' | 'red' }> = {
  ativa: { label: 'Ativa', color: 'green' },
  concluida: { label: 'Concluída', color: 'slate' },
  cancelada: { label: 'Cancelada', color: 'red' },
};

export function DonationCard({
  donation,
  companyName,
  defaultOpen = false,
}: {
  donation: Donation;
  companyName?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const installments = useLiveQuery(
    () => db.installments.where('donationId').equals(donation.id).sortBy('number'),
    [donation.id],
  );

  const paidCount = installments?.filter((i) => i.status === 'pago').length ?? 0;
  const total = installments?.length ?? donation.installmentsCount;
  const badge = STATUS_BADGE[donation.status];

  return (
    <div className="rounded-lg border border-slate-200">
      <button
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {companyName && <span className="font-semibold text-slate-900">{companyName}</span>}
            <span className="text-slate-600">{donation.project}</span>
            {donation.category && <Badge color="indigo">{donation.category}</Badge>}
            <Badge color={badge.color}>{badge.label}</Badge>
          </div>
          <div className="mt-0.5 text-xs text-slate-400">
            Início: {formatDate(donation.startDate)} · {paidCount}/{total} parcelas pagas
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-semibold text-slate-900">{formatCurrency(donation.totalValue)}</div>
          <div className="text-xs text-slate-400">{donation.installmentsCount}x</div>
        </div>
      </button>
      {open && (
        <div className="border-t border-slate-100">
          {donation.notes && <div className="px-4 py-2 text-sm text-slate-500">{donation.notes}</div>}
          <div className="divide-y divide-slate-100">
            {installments?.map((inst) => (
              <InstallmentRow key={inst.id} installment={inst} />
            ))}
          </div>
          <div className="flex items-center justify-between px-4 py-2">
            <select
              value={donation.status}
              onChange={(e) => updateDonation(donation.id, { status: e.target.value as Donation['status'] })}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs"
            >
              <option value="ativa">Ativa</option>
              <option value="concluida">Concluída</option>
              <option value="cancelada">Cancelada</option>
            </select>
            <Button variant="ghost" className="px-2 py-1 text-xs text-red-600" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={14} /> Excluir doação
            </Button>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteDonation(donation.id)}
        title="Excluir doação"
        message="Isso excluirá a doação e todas as suas parcelas. Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
      />
    </div>
  );
}
