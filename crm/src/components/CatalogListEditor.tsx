import { useState } from 'react';
import type { Catalog } from '../lib/types';
import { updateCatalog } from '../services/catalog';
import { Button, Input } from './ui/Primitives';
import { Plus, Trash2 } from 'lucide-react';

export function CatalogListEditor({
  title,
  field,
  items,
}: {
  title: string;
  field: keyof Pick<Catalog, 'categories' | 'strategies' | 'paymentMethods' | 'lossReasons' | 'relationshipTypes'>;
  items: string[];
}) {
  const [draft, setDraft] = useState('');

  async function add() {
    const value = draft.trim();
    if (!value || items.includes(value)) return;
    await updateCatalog({ [field]: [...items, value] });
    setDraft('');
  }

  async function remove(value: string) {
    await updateCatalog({ [field]: items.filter((i) => i !== value) });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-800">{title}</h3>
      <div className="mb-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="flex items-center gap-1 rounded-full bg-slate-100 py-1 pl-3 pr-1.5 text-sm text-slate-700">
            {item}
            <button onClick={() => remove(item)} className="rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-red-600">
              <Trash2 size={12} />
            </button>
          </span>
        ))}
        {items.length === 0 && <span className="text-sm text-slate-400">Nenhum item.</span>}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="Adicionar item..."
        />
        <Button type="button" variant="secondary" onClick={add}>
          <Plus size={15} />
        </Button>
      </div>
    </div>
  );
}
