import { useMemo, useState } from 'react';
import { useContactNetwork } from '../../hooks/useContactNetwork';
import { colorForConnectionType } from '../../lib/connection-colors';
import { initials } from '../../lib/format';
import { deleteConnection } from '../../services/connections';
import { Badge, Button } from '../ui/Primitives';
import { ConfirmDialog } from '../ui/Modal';
import { ConnectionForm } from './ConnectionForm';
import { ArrowLeft, Building2, Plus, Trash2, X } from 'lucide-react';

const WIDTH = 640;
const HEIGHT = 520;
const CENTER = { x: WIDTH / 2, y: HEIGHT / 2 - 10 };

export function NetworkMapModal({ contactId, onClose }: { contactId: string; onClose: () => void }) {
  const [focalId, setFocalId] = useState(contactId);
  const [history, setHistory] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const [deletingEdgeId, setDeletingEdgeId] = useState<string | null>(null);

  const network = useContactNetwork(focalId);

  const radius = useMemo(() => {
    const n = network?.edges.length ?? 0;
    return Math.max(120, Math.min(220, 90 + n * 8));
  }, [network?.edges.length]);

  const positioned = useMemo(() => {
    const edges = network?.edges ?? [];
    return edges.map((edge, i) => {
      const angle = (2 * Math.PI * i) / edges.length - Math.PI / 2;
      const x = CENTER.x + radius * Math.cos(angle);
      const y = CENTER.y + radius * Math.sin(angle);
      const anchor: 'start' | 'end' = Math.cos(angle) >= 0 ? 'start' : 'end';
      return { edge, x, y, anchor };
    });
  }, [network?.edges, radius]);

  function goTo(id: string) {
    if (id === focalId) return;
    setHistory((h) => [...h, focalId]);
    setFocalId(id);
    setAdding(false);
    setEditingEdgeId(null);
  }

  function goBack() {
    setHistory((h) => {
      if (h.length === 0) return h;
      const next = h.slice(0, -1);
      setFocalId(h[h.length - 1]);
      return next;
    });
  }

  if (!network) return null;
  const { focal, focalCompany, edges } = network;
  const editingEdge = edges.find((e) => e.connectionId === editingEdgeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="flex h-[88vh] w-full max-w-6xl overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex flex-1 flex-col border-r border-slate-200">
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-3">
            {history.length > 0 && (
              <button onClick={goBack} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <ArrowLeft size={18} />
              </button>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-semibold text-slate-900">Mapa de relacionamento</h2>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Building2 size={12} /> {focal.name} {focalCompany && `· ${focalCompany.name}`}
              </div>
            </div>
            <button onClick={onClose} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-full w-full">
              {positioned.map(({ edge, x, y }) => (
                <line
                  key={edge.connectionId}
                  x1={CENTER.x}
                  y1={CENTER.y}
                  x2={x}
                  y2={y}
                  stroke={colorForConnectionType(edge.tipo)}
                  strokeWidth={2}
                  opacity={0.5}
                />
              ))}
              {positioned.map(({ edge, x, y }) => {
                const midX = CENTER.x + (x - CENTER.x) * 0.55;
                const midY = CENTER.y + (y - CENTER.y) * 0.55;
                return (
                  <text
                    key={`label-${edge.connectionId}`}
                    x={midX}
                    y={midY}
                    textAnchor="middle"
                    fontSize={10.5}
                    fontFamily="monospace"
                    fill={colorForConnectionType(edge.tipo)}
                  >
                    {edge.tipo}
                  </text>
                );
              })}
              <circle cx={CENTER.x} cy={CENTER.y} r={30} fill="#4338ca" />
              <text x={CENTER.x} y={CENTER.y + 4} textAnchor="middle" fontSize={11} fontWeight={600} fill="#fff">
                {initials(focal.name)}
              </text>
              <text x={CENTER.x} y={CENTER.y + 48} textAnchor="middle" fontSize={12.5} fontWeight={600} fill="#1e293b">
                {focal.name}
              </text>
              {positioned.map(({ edge, x, y, anchor }) => (
                <g
                  key={edge.connectionId}
                  className="cursor-pointer"
                  onClick={() => goTo(edge.contact.id)}
                >
                  <circle cx={x} cy={y} r={22} fill="#fff" stroke={colorForConnectionType(edge.tipo)} strokeWidth={2} />
                  <text x={x} y={y + 4} textAnchor="middle" fontSize={10} fontWeight={600} fill="#1e293b">
                    {initials(edge.contact.name)}
                  </text>
                  <text
                    x={anchor === 'start' ? x + 26 : x - 26}
                    y={y + 4}
                    textAnchor={anchor}
                    fontSize={11.5}
                    fontWeight={500}
                    fill="#334155"
                  >
                    {edge.contact.name}
                  </text>
                </g>
              ))}
            </svg>
            {edges.length === 0 && (
              <p className="mt-2 text-center text-sm text-slate-400">
                Nenhuma conexão ainda. Use "Adicionar conexão" para começar o mapa.
              </p>
            )}
          </div>
        </div>

        <aside className="flex w-96 shrink-0 flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-800">Conexões ({edges.length})</h3>
            <Button className="px-2 py-1 text-xs" onClick={() => setAdding(true)}>
              <Plus size={13} /> Adicionar conexão
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {adding && (
              <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <ConnectionForm
                  focalContact={focal}
                  onSaved={() => setAdding(false)}
                  onCancel={() => setAdding(false)}
                />
              </div>
            )}
            {editingEdge && (
              <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <ConnectionForm
                  focalContact={focal}
                  initialOtherContactId={editingEdge.contact.id}
                  initialTipoAB={editingEdge.tipo}
                  onSaved={() => setEditingEdgeId(null)}
                  onCancel={() => setEditingEdgeId(null)}
                />
              </div>
            )}
            <div className="space-y-2">
              {edges.map((edge) => (
                <div key={edge.connectionId} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => goTo(edge.contact.id)}
                      className="text-left text-sm font-medium text-slate-900 hover:text-indigo-600"
                    >
                      {edge.contact.name}
                    </button>
                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => setEditingEdgeId(edge.connectionId)}
                        className="text-xs text-slate-400 hover:text-slate-700"
                      >
                        editar
                      </button>
                      <button
                        onClick={() => setDeletingEdgeId(edge.connectionId)}
                        className="rounded p-0.5 text-slate-300 hover:text-red-600"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  {edge.company && <div className="text-xs text-slate-400">{edge.company.name}</div>}
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ background: `${colorForConnectionType(edge.tipo)}1a`, color: colorForConnectionType(edge.tipo) }}
                    >
                      {edge.tipo}
                    </span>
                    {edge.auto && <Badge>automática</Badge>}
                  </div>
                </div>
              ))}
              {edges.length === 0 && !adding && (
                <p className="text-sm text-slate-400">Nenhuma conexão cadastrada para {focal.name}.</p>
              )}
            </div>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={!!deletingEdgeId}
        onClose={() => setDeletingEdgeId(null)}
        onConfirm={() => deletingEdgeId && deleteConnection(deletingEdgeId)}
        title="Excluir conexão"
        message="Esta conexão será removida para os dois contatos. Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
      />
    </div>
  );
}
