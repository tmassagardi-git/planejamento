import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { Drawer } from './ui/Drawer';
import { Badge, Button, Field, Select } from './ui/Primitives';
import { Modal, ConfirmDialog } from './ui/Modal';
import { OpportunityForm } from './OpportunityForm';
import { DonationForm } from './DonationForm';
import { DonationCard } from './DonationCard';
import { deleteOpportunity, markOpportunityLost, markOpportunityWon, reopenOpportunity } from '../services/opportunities';
import { useCatalog } from '../hooks/useCatalog';
import { formatCurrency, formatDate, formatMonthKey } from '../lib/format';
import { Pencil, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react';

export function OpportunityDrawer({ opportunityId, onClose }: { opportunityId: string; onClose: () => void }) {
  const opportunity = useLiveQuery(() => db.opportunities.get(opportunityId), [opportunityId]);
  const company = useLiveQuery(
    () => (opportunity ? db.companies.get(opportunity.companyId) : undefined),
    [opportunity?.companyId],
  );
  const contact = useLiveQuery(
    () => (opportunity?.contactId ? db.contacts.get(opportunity.contactId) : undefined),
    [opportunity?.contactId],
  );
  const stage = useLiveQuery(() => (opportunity ? db.stages.get(opportunity.stageId) : undefined), [opportunity?.stageId]);
  const donation = useLiveQuery(
    () => (opportunity?.donationId ? db.donations.get(opportunity.donationId) : undefined),
    [opportunity?.donationId],
  );
  const catalog = useCatalog();

  const [editing, setEditing] = useState(false);
  const [winning, setWinning] = useState(false);
  const [losing, setLosing] = useState(false);
  const [lossReason, setLossReason] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!opportunity) return null;

  async function handleLose() {
    if (!lossReason) return;
    await markOpportunityLost(opportunity!.id, lossReason);
    setLosing(false);
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={opportunity.name}
      subtitle={
        <span className="flex items-center gap-2">
          {company?.name}
          {stage && <Badge color="indigo">{stage.name}</Badge>}
          {opportunity.status === 'ganha' && <Badge color="green">Ganha</Badge>}
          {opportunity.status === 'perdida' && <Badge color="red">Perdida</Badge>}
        </span>
      }
      headerActions={
        <>
          <Button variant="secondary" className="px-2 py-1.5 text-xs" onClick={() => setEditing(true)}>
            <Pencil size={14} /> Editar
          </Button>
          {opportunity.status === 'aberta' && (
            <>
              <Button variant="secondary" className="px-2 py-1.5 text-xs text-red-600" onClick={() => setLosing(true)}>
                <ThumbsDown size={14} /> Marcar perda
              </Button>
              <Button className="px-2 py-1.5 text-xs" onClick={() => setWinning(true)}>
                <ThumbsUp size={14} /> Marcar venda
              </Button>
            </>
          )}
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Contato">
            <div className="text-sm text-slate-700">{contact?.name || '—'}</div>
          </Field>
          <Field label="Valor da proposta">
            <div className="text-sm font-semibold text-slate-900">{formatCurrency(opportunity.value)}</div>
          </Field>
          <Field label="Criada em">
            <div className="text-sm text-slate-700">{formatDate(opportunity.createdAt)}</div>
          </Field>
          <Field label="Mês trabalhado">
            <div className="text-sm text-slate-700">{formatMonthKey(opportunity.workingMonth)}</div>
          </Field>
          <Field label="Previsão de fechamento">
            <div className="text-sm text-slate-700">{formatDate(opportunity.expectedCloseDate) || '—'}</div>
          </Field>
          {opportunity.status === 'perdida' && (
            <Field label="Motivo da perda">
              <div className="text-sm text-slate-700">{opportunity.lostReason}</div>
            </Field>
          )}
        </div>
        <Field label="Proposta (o que foi ofertado)">
          <div className="whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm text-slate-700">
            {opportunity.proposal || '—'}
          </div>
        </Field>
        <Field label="Observações">
          <div className="whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm text-slate-700">
            {opportunity.notes || '—'}
          </div>
        </Field>

        {donation && (
          <div>
            <div className="mb-2 text-xs font-medium text-slate-600">Doação gerada</div>
            <DonationCard donation={donation} defaultOpen />
          </div>
        )}

        {opportunity.status !== 'aberta' && (
          <Button variant="ghost" className="text-xs" onClick={() => reopenOpportunity(opportunity.id)}>
            Reabrir oportunidade
          </Button>
        )}

        <div className="border-t border-slate-100 pt-4">
          <Button variant="ghost" className="text-xs text-red-600" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={14} /> Excluir oportunidade
          </Button>
        </div>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Editar oportunidade">
        <OpportunityForm
          funnelId={opportunity.funnelId}
          stageId={opportunity.stageId}
          opportunity={opportunity}
          onSaved={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      </Modal>

      <Modal open={winning} onClose={() => setWinning(false)} title="Registrar doação (ganho)" width="lg">
        <DonationForm
          companyId={opportunity.companyId}
          opportunityId={opportunity.id}
          suggestedProject={opportunity.name}
          suggestedValue={opportunity.value}
          onSaved={async (donationId) => {
            await markOpportunityWon(opportunity.id, donationId);
            setWinning(false);
          }}
          onCancel={() => setWinning(false)}
        />
      </Modal>

      <Modal open={losing} onClose={() => setLosing(false)} title="Marcar oportunidade como perdida" width="sm">
        <div className="space-y-4">
          <Field label="Motivo da perda">
            <Select value={lossReason} onChange={(e) => setLossReason(e.target.value)}>
              <option value="">Selecione...</option>
              {catalog?.lossReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setLosing(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleLose} disabled={!lossReason}>
              Confirmar perda
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteOpportunity(opportunity.id);
          onClose();
        }}
        title="Excluir oportunidade"
        message="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
      />
    </Drawer>
  );
}
