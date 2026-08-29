import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import type { Contact } from '../../lib/types';
import { createOrUpdateConnection } from '../../services/connections';
import { useCatalog } from '../../hooks/useCatalog';
import { Button, Field, Input, Select } from '../ui/Primitives';
import { Search } from 'lucide-react';

export function ConnectionForm({
  focalContact,
  initialOtherContactId,
  initialTipoAB,
  initialTipoBA,
  onSaved,
  onCancel,
}: {
  focalContact: Contact;
  initialOtherContactId?: string;
  initialTipoAB?: string;
  initialTipoBA?: string;
  onSaved: (otherContactId: string) => void;
  onCancel: () => void;
}) {
  const catalog = useCatalog();
  const allContacts = useLiveQuery(() => db.contacts.toArray(), []);
  const companies = useLiveQuery(() => db.companies.toArray(), []);
  const companyById = useMemo(() => new Map((companies ?? []).map((c) => [c.id, c])), [companies]);

  const [search, setSearch] = useState('');
  const [otherId, setOtherId] = useState(initialOtherContactId ?? '');
  const defaultTipo = catalog?.relationshipTypes[0] ?? '';
  const [tipoAB, setTipoAB] = useState(initialTipoAB ?? defaultTipo);
  const [tipoBA, setTipoBA] = useState(initialTipoBA ?? initialTipoAB ?? defaultTipo);
  const [tipoBATouched, setTipoBATouched] = useState(!!initialTipoBA && initialTipoBA !== initialTipoAB);
  const [saving, setSaving] = useState(false);

  const otherContact = allContacts?.find((c) => c.id === otherId);

  const results = useMemo(() => {
    if (!allContacts || otherId) return [];
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return allContacts
      .filter((c) => c.id !== focalContact.id)
      .filter((c) => {
        const companyName = companyById.get(c.companyId)?.name ?? '';
        return `${c.name} ${companyName}`.toLowerCase().includes(q);
      })
      .slice(0, 8);
  }, [allContacts, search, otherId, focalContact.id, companyById]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!otherId || !tipoAB) return;
    setSaving(true);
    try {
      await createOrUpdateConnection(focalContact.id, otherId, tipoAB, tipoBA || tipoAB);
      onSaved(otherId);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {!initialOtherContactId && (
        <Field label="Contato">
          {otherContact ? (
            <div className="flex items-center justify-between rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
              <span>
                {otherContact.name}{' '}
                <span className="text-slate-400">· {companyById.get(otherContact.companyId)?.name}</span>
              </span>
              <button type="button" onClick={() => setOtherId('')} className="text-xs text-indigo-600 hover:underline">
                Trocar
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar contato por nome ou empresa..."
                className="pl-8"
                autoFocus
              />
              {results.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
                  {results.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setOtherId(c.id);
                        setSearch('');
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      <span>{c.name}</span>
                      <span className="text-xs text-slate-400">{companyById.get(c.companyId)?.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </Field>
      )}

      {(otherId || initialOtherContactId) && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`${focalContact.name} é o quê de ${otherContact?.name ?? '...'}?`}>
              <Select
                value={tipoAB}
                onChange={(e) => {
                  setTipoAB(e.target.value);
                  if (!tipoBATouched) setTipoBA(e.target.value);
                }}
              >
                {catalog?.relationshipTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={`${otherContact?.name ?? '...'} é o quê de ${focalContact.name}?`}>
              <Select
                value={tipoBA}
                onChange={(e) => {
                  setTipoBA(e.target.value);
                  setTipoBATouched(true);
                }}
              >
                {catalog?.relationshipTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              Salvar conexão
            </Button>
          </div>
        </>
      )}

      {!otherId && !initialOtherContactId && (
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      )}
    </form>
  );
}
