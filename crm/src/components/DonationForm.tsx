import { useState } from 'react';
import { createDonation, type DonationInput } from '../services/donations';
import { Button, Field, Input, Select, Textarea } from './ui/Primitives';
import { useCatalog } from '../hooks/useCatalog';
import { formatCurrency, todayISODate } from '../lib/format';

export function DonationForm({
  companyId,
  opportunityId,
  suggestedProject,
  suggestedValue,
  onSaved,
  onCancel,
}: {
  companyId: string;
  opportunityId?: string;
  suggestedProject?: string;
  suggestedValue?: number;
  onSaved: (donationId: string) => void;
  onCancel: () => void;
}) {
  const catalog = useCatalog();
  const [project, setProject] = useState(suggestedProject ?? '');
  const [category, setCategory] = useState('');
  const [strategy, setStrategy] = useState('');
  const [totalValue, setTotalValue] = useState(suggestedValue ?? 0);
  const [installmentsCount, setInstallmentsCount] = useState(1);
  const [startDate, setStartDate] = useState(todayISODate());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const parcelValue = installmentsCount > 0 ? totalValue / installmentsCount : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!project.trim() || totalValue <= 0 || installmentsCount < 1) return;
    setSaving(true);
    try {
      const input: DonationInput = {
        companyId,
        opportunityId,
        project,
        category: category || undefined,
        strategy: strategy || undefined,
        totalValue,
        installmentsCount,
        startDate,
        notes: notes || undefined,
      };
      const id = await createDonation(input);
      onSaved(id);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Projeto apoiado *">
        <Input value={project} onChange={(e) => setProject(e.target.value)} required autoFocus />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Cota / Categoria">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">—</option>
            {catalog?.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Estratégia">
          <Select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
            <option value="">—</option>
            {catalog?.strategies.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Valor total (R$) *">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={totalValue}
            onChange={(e) => setTotalValue(Number(e.target.value))}
            required
          />
        </Field>
        <Field label="Nº de parcelas *">
          <Input
            type="number"
            min={1}
            value={installmentsCount}
            onChange={(e) => setInstallmentsCount(Math.max(1, Number(e.target.value)))}
            required
          />
        </Field>
        <Field label="Início (1ª parcela)">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
      </div>
      <p className="text-xs text-slate-500">
        {installmentsCount}x de {formatCurrency(parcelValue)} — parcelas mensais geradas automaticamente a partir da
        data de início.
      </p>
      <Field label="Observações">
        <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          Registrar doação
        </Button>
      </div>
    </form>
  );
}
