import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { Button, Field, Input, Select } from '../components/ui/Primitives';
import { StagesEditor } from '../components/StagesEditor';
import { CatalogListEditor } from '../components/CatalogListEditor';
import { createFunnel, renameFunnel } from '../services/funnels';
import { downloadBackup, exportBackup, importBackup, type BackupData } from '../services/backup';
import { Download, Plus, Upload } from 'lucide-react';

export function SettingsPage() {
  const funnels = useLiveQuery(() => db.funnels.toArray(), []);
  const catalog = useLiveQuery(() => db.catalog.toCollection().first(), []);
  const [funnelId, setFunnelId] = useState('');
  const [newFunnelName, setNewFunnelName] = useState('');
  const [renaming, setRenaming] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!funnelId && funnels && funnels.length > 0) setFunnelId(funnels[0].id);
  }, [funnels, funnelId]);

  const currentFunnel = funnels?.find((f) => f.id === funnelId);

  async function handleAddFunnel() {
    const name = newFunnelName.trim();
    if (!name) return;
    const id = await createFunnel(name);
    setFunnelId(id);
    setNewFunnelName('');
  }

  async function handleExport() {
    const data = await exportBackup();
    downloadBackup(data);
  }

  async function handleImportFile(file: File) {
    setImportMsg('');
    try {
      const text = await file.text();
      const data = JSON.parse(text) as BackupData;
      if (!window.confirm('Isso substituirá TODOS os dados atuais pelos dados do arquivo. Continuar?')) return;
      await importBackup(data);
      setImportMsg('Backup importado com sucesso.');
    } catch (err) {
      setImportMsg(err instanceof Error ? `Erro: ${err.message}` : 'Erro ao importar backup.');
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Configurações</h1>
      <p className="mb-6 text-sm text-slate-500">Funis, etapas e listas usadas nos formulários do CRM</p>

      <div className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">Funil de vendas</h3>
          <div className="mb-3 flex items-end gap-2">
            <Field label="Funil selecionado">
              <Select value={funnelId} onChange={(e) => setFunnelId(e.target.value)} className="w-64">
                {funnels?.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="mb-4 flex gap-2">
            <Input
              value={renaming || currentFunnel?.name || ''}
              onChange={(e) => setRenaming(e.target.value)}
              placeholder="Nome do funil"
            />
            <Button
              variant="secondary"
              onClick={async () => {
                if (funnelId && renaming.trim()) {
                  await renameFunnel(funnelId, renaming.trim());
                  setRenaming('');
                }
              }}
            >
              Renomear
            </Button>
          </div>
          <div className="mb-4 flex gap-2 border-t border-slate-100 pt-4">
            <Input value={newFunnelName} onChange={(e) => setNewFunnelName(e.target.value)} placeholder="Novo funil..." />
            <Button variant="secondary" onClick={handleAddFunnel}>
              <Plus size={15} /> Criar funil
            </Button>
          </div>
          {funnelId && <StagesEditor funnelId={funnelId} />}
        </div>

        {catalog && (
          <>
            <CatalogListEditor title="Cotas / Categorias de doação" field="categories" items={catalog.categories} />
            <CatalogListEditor title="Estratégias de captação" field="strategies" items={catalog.strategies} />
            <CatalogListEditor title="Meios de pagamento" field="paymentMethods" items={catalog.paymentMethods} />
            <CatalogListEditor title="Motivos de perda" field="lossReasons" items={catalog.lossReasons} />
          </>
        )}

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-1 text-sm font-semibold text-slate-800">Backup dos dados</h3>
          <p className="mb-3 text-xs text-slate-500">
            Os dados ficam salvos apenas neste navegador (IndexedDB). Exporte regularmente para não perder informações.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={handleExport}>
              <Download size={15} /> Exportar backup (.json)
            </Button>
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
              <Upload size={15} /> Importar backup
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleImportFile(e.target.files[0])}
            />
          </div>
          {importMsg && <p className="mt-2 text-xs text-slate-600">{importMsg}</p>}
        </div>
      </div>
    </div>
  );
}
