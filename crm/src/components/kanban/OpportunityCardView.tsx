import type { Opportunity } from '../../lib/types';
import { formatCurrency, formatMonthKey } from '../../lib/format';
import { Building2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';

export function OpportunityCardView({ opportunity }: { opportunity: Opportunity }) {
  const company = useLiveQuery(() => db.companies.get(opportunity.companyId), [opportunity.companyId]);
  return (
    <div className="cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:shadow active:cursor-grabbing">
      <div className="text-sm font-semibold text-slate-900">{opportunity.name}</div>
      <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
        <Building2 size={12} />
        <span className="truncate">{company?.name ?? '...'}</span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-900">{formatCurrency(opportunity.value)}</span>
        {opportunity.workingMonth && (
          <span className="text-xs text-slate-400">{formatMonthKey(opportunity.workingMonth)}</span>
        )}
      </div>
    </div>
  );
}
