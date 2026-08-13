import { useState } from 'react';
import type { Installment } from '../lib/types';
import { formatCurrency, formatDate, todayISODate } from '../lib/format';
import { markInstallmentPaid, markInstallmentStatus } from '../services/donations';
import { Badge, Button, Input, Select } from './ui/Primitives';
import { useCatalog } from '../hooks/useCatalog';
import { Check, Undo2 } from 'lucide-react';

const STATUS_BADGE: Record<Installment['status'], { label: string; color: 'green' | 'amber' | 'red' | 'sky' }> = {
  pago: { label: 'Pago', color: 'green' },
  em_aberto: { label: 'Em aberto', color: 'amber' },
  cancelado: { label: 'Cancelado', color: 'red' },
  permuta: { label: 'Permuta', color: 'sky' },
};

export function InstallmentRow({ installment }: { installment: Installment }) {
  const catalog = useCatalog();
  const [markingPaid, setMarkingPaid] = useState(false);
  const [paymentDate, setPaymentDate] = useState(todayISODate());
  const [paymentMethod, setPaymentMethod] = useState(catalog?.paymentMethods[0] ?? '');
  const badge = STATUS_BADGE[installment.status];
  const overdue = installment.status === 'em_aberto' && installment.dueDate < todayISODate();

  async function confirmPaid() {
    await markInstallmentPaid(installment.id, paymentDate, paymentMethod || undefined);
    setMarkingPaid(false);
  }

  return (
    <div className="border-t border-slate-100 first:border-t-0">
      <div className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
        <span className="w-14 shrink-0 text-slate-400">#{installment.number}</span>
        <span className="w-28 shrink-0 font-medium text-slate-900">{formatCurrency(installment.value)}</span>
        <span className="w-40 shrink-0 text-slate-500">
          Previsto: {formatDate(installment.dueDate)}
          {overdue && <span className="ml-1 text-red-500">(atrasado)</span>}
        </span>
        <span className="w-40 shrink-0 text-slate-500">Baixa: {formatDate(installment.paymentDate)}</span>
        <Badge color={badge.color}>{badge.label}</Badge>
        {installment.paymentMethod && <span className="text-xs text-slate-400">{installment.paymentMethod}</span>}
        <div className="ml-auto flex items-center gap-2">
          {installment.status !== 'pago' && !markingPaid && (
            <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => setMarkingPaid(true)}>
              <Check size={14} /> Dar baixa
            </Button>
          )}
          {installment.status === 'pago' && (
            <Button
              variant="ghost"
              className="px-2 py-1 text-xs"
              onClick={() => markInstallmentStatus(installment.id, 'em_aberto')}
            >
              <Undo2 size={14} /> Reabrir
            </Button>
          )}
        </div>
      </div>
      {markingPaid && (
        <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-slate-200 bg-slate-50 px-3 py-2">
          <span className="text-xs text-slate-500">Data da baixa:</span>
          <Input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-40"
          />
          <span className="text-xs text-slate-500">Meio de pagamento:</span>
          <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-48">
            <option value="">—</option>
            {catalog?.paymentMethods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          <Button className="px-2 py-1 text-xs" onClick={confirmPaid}>
            Confirmar
          </Button>
          <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => setMarkingPaid(false)}>
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}
