import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { fmtNota, vicMetrics } from '../lib/vic-calc';
import { computeBubbles, computeLabels, computeTicksX, computeTicksY } from '../lib/vic-layout';
import { deleteEvaluation } from '../services/vic';
import { CompanyDetailDrawer } from '../components/CompanyDetailDrawer';
import { ConfirmDialog } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Primitives';
import { Kanban, List, Search, Trash2 } from 'lucide-react';

interface Row {
  key: string; // evaluationId
  companyId: string;
  evaluationId: string;
  nome: string;
  ramo: string;
  projeto: string;
  v: number;
  i: number;
  c: number;
  total: number;
}

export function VicPage() {
  const criteria = useLiveQuery(() => db.vicCriteria.orderBy('order').toArray(), []);
  const companies = useLiveQuery(() => db.companies.toArray(), []);
  const evaluations = useLiveQuery(() => db.vicEvaluations.toArray(), []);

  const [view, setView] = useState<'matriz' | 'lista'>('matriz');
  const [projetoFiltro, setProjetoFiltro] = useState('todos');
  const [busca, setBusca] = useState('');
  const [ordem, setOrdem] = useState<'total' | 'v' | 'i' | 'c' | 'nome'>('total');
  const [selected, setSelected] = useState<{ companyId: string; evaluationId: string } | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);

  const allRows = useMemo<Row[]>(() => {
    if (!criteria || !companies || !evaluations) return [];
    const companyById = new Map(companies.map((c) => [c.id, c]));
    return evaluations
      .map((ev): Row | null => {
        const company = companyById.get(ev.companyId);
        if (!company) return null;
        const m = vicMetrics(criteria, ev);
        return {
          key: ev.id,
          companyId: company.id,
          evaluationId: ev.id,
          nome: company.name,
          ramo: company.segment || '',
          projeto: ev.projeto || 'Sem nome',
          v: m.v,
          i: m.i,
          c: m.c,
          total: m.total,
        };
      })
      .filter((r): r is Row => r !== null);
  }, [criteria, companies, evaluations]);

  const projetos = useMemo(
    () => Array.from(new Set(allRows.map((r) => r.projeto))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [allRows],
  );

  const rowsInProjeto = useMemo(
    () => (projetoFiltro === 'todos' ? allRows : allRows.filter((r) => r.projeto === projetoFiltro)),
    [allRows, projetoFiltro],
  );

  // No modo "todos os projetos" cada empresa com mais de uma avaliação
  // ganha o nome do projeto junto, para diferenciar as bolhas dela.
  const multiEvalCompanyIds = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of allRows) counts.set(r.companyId, (counts.get(r.companyId) ?? 0) + 1);
    return new Set(Array.from(counts.entries()).filter(([, n]) => n > 1).map(([id]) => id));
  }, [allRows]);

  const bubbleItems = useMemo(
    () =>
      rowsInProjeto.map((r) => ({
        key: r.key,
        nome: projetoFiltro === 'todos' && multiEvalCompanyIds.has(r.companyId) ? `${r.nome} · ${r.projeto}` : r.nome,
        v: r.v,
        i: r.i,
        c: r.c,
        total: r.total,
      })),
    [rowsInProjeto, projetoFiltro, multiEvalCompanyIds],
  );

  const [mostrarTodosRotulos, setMostrarTodosRotulos] = useState(false);
  const bubbles = useMemo(() => computeBubbles(bubbleItems), [bubbleItems]);
  const labels = useMemo(
    () => computeLabels(bubbleItems, 1, 7, mostrarTodosRotulos),
    [bubbleItems, mostrarTodosRotulos],
  );
  const ticksX = useMemo(() => computeTicksX(), []);
  const ticksY = useMemo(() => computeTicksY(), []);
  const rowByKey = useMemo(() => new Map(rowsInProjeto.map((r) => [r.key, r])), [rowsInProjeto]);

  const ranking = useMemo(
    () =>
      rowsInProjeto
        .slice()
        .sort((a, b) => b.total - a.total)
        .slice(0, 12),
    [rowsInProjeto],
  );

  const listaFiltrada = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const filtered = q
      ? rowsInProjeto.filter((r) => `${r.nome} ${r.ramo} ${r.projeto}`.toLowerCase().includes(q))
      : rowsInProjeto;
    return filtered.slice().sort((a, b) => {
      if (ordem === 'nome') return a.nome.localeCompare(b.nome, 'pt-BR');
      return b[ordem] - a[ordem];
    });
  }, [rowsInProjeto, busca, ordem]);

  function abrir(row: Row) {
    setSelected({ companyId: row.companyId, evaluationId: row.evaluationId });
  }

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Matriz VIC</h1>
          <p className="text-sm text-slate-500">
            Vínculo, Interesse e Capacidade — priorização de empresas pelo método de qualificação VIC
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-slate-500">
            Projeto
            <Select value={projetoFiltro} onChange={(e) => setProjetoFiltro(e.target.value)} className="w-44">
              <option value="todos">Todos os projetos</option>
              {projetos.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </label>
          <div className="flex rounded-md border border-slate-300 bg-white p-0.5">
            <button
              onClick={() => setView('matriz')}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm ${view === 'matriz' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
            >
              <Kanban size={15} /> Matriz
            </button>
            <button
              onClick={() => setView('lista')}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm ${view === 'lista' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
            >
              <List size={15} /> Lista
            </button>
          </div>
        </div>
      </div>

      {view === 'matriz' ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Projeção das empresas</h2>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-slate-500">
                  <input
                    type="checkbox"
                    checked={mostrarTodosRotulos}
                    onChange={(e) => setMostrarTodosRotulos(e.target.checked)}
                  />
                  Mostrar todos os rótulos
                </label>
                <span className="font-mono text-xs text-slate-400">{rowsInProjeto.length} avaliações · bolha = capacidade</span>
              </div>
            </div>
            <div className="relative">
              <svg viewBox="0 0 780 600" style={{ width: '100%', height: 'auto', overflow: 'visible', display: 'block' }}>
                <rect x={70} y={30} width={660} height={490} fill="#FBF9F4" stroke="#DDD8CD" />
                <rect x={400} y={30} width={330} height={245} fill="#1F5F5B" opacity={0.05} />
                <line x1={400} y1={30} x2={400} y2={520} stroke="#DDD8CD" strokeDasharray="4 4" />
                <line x1={70} y1={275} x2={730} y2={275} stroke="#DDD8CD" strokeDasharray="4 4" />
                <text x={410} y={50} fontFamily="monospace" fontSize={11} fill="#1F5F5B" letterSpacing="0.08em">
                  PRIORIDADE ALTA
                </text>
                <text x={82} y={512} fontFamily="monospace" fontSize={11} fill="#A9A49A" letterSpacing="0.08em">
                  BAIXA PRIORIDADE
                </text>
                {bubbles.map((p) => (
                  <circle
                    key={p.key}
                    cx={p.cx}
                    cy={p.cy}
                    r={p.r}
                    fill={p.fill}
                    fillOpacity={0.5}
                    stroke={p.fill}
                    strokeWidth={1.25}
                    className="cursor-pointer"
                    onClick={() => {
                      const row = rowByKey.get(p.key);
                      if (row) abrir(row);
                    }}
                  />
                ))}
                <line x1={70} y1={520} x2={730} y2={520} stroke="#191A17" />
                <line x1={70} y1={30} x2={70} y2={520} stroke="#191A17" />
                <text x={400} y={574} textAnchor="middle" fontFamily="monospace" fontSize={11} fill="#1F5F5B" letterSpacing="0.14em">
                  VÍNCULO
                </text>
                <text
                  x={20}
                  y={275}
                  textAnchor="middle"
                  transform="rotate(-90 20 275)"
                  fontFamily="monospace"
                  fontSize={11}
                  fill="#B07D2B"
                  letterSpacing="0.14em"
                >
                  INTERESSE
                </text>
              </svg>
              <div className="pointer-events-none absolute inset-0">
                {labels.map((l) => (
                  <div
                    key={l.key}
                    style={{ position: 'absolute', left: l.left, top: l.top, transform: l.transform }}
                    className="whitespace-nowrap text-xs font-medium text-slate-900"
                  >
                    {l.nome}
                  </div>
                ))}
                {ticksX.map((t) => (
                  <div
                    key={`x${t.label}`}
                    style={{ position: 'absolute', left: t.pos, top: '89.5%', transform: 'translate(-50%, -50%)' }}
                    className="font-mono text-[11px] text-slate-500"
                  >
                    {t.label}
                  </div>
                ))}
                {ticksY.map((t) => (
                  <div
                    key={`y${t.label}`}
                    style={{ position: 'absolute', left: '6.4%', top: t.pos, transform: 'translate(-100%, -50%)' }}
                    className="font-mono text-[11px] text-slate-500"
                  >
                    {t.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <aside>
            <h3 className="mb-2.5 font-mono text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Ranking por nota total
            </h3>
            <ol className="flex flex-col gap-1">
              {ranking.map((r, k) => (
                <li key={r.key}>
                  <button
                    onClick={() => abrir(r)}
                    className="grid w-full grid-cols-[22px_minmax(0,1fr)_auto] items-center gap-2.5 rounded border border-slate-200 bg-white px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    <span className="font-mono text-[11px] text-slate-400">{String(k + 1).padStart(2, '0')}</span>
                    <span className="truncate font-medium">{r.nome}</span>
                    <span className="font-mono text-xs font-semibold text-[#B4462F]">{fmtNota(r.total)}</span>
                  </button>
                </li>
              ))}
              {ranking.length === 0 && <p className="text-sm text-slate-400">Nenhuma avaliação ainda.</p>}
            </ol>
          </aside>
        </div>
      ) : (
        <div>
          <div className="mb-3 flex flex-wrap gap-3">
            <div className="relative max-w-sm flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar empresa, ramo ou projeto..." className="pl-9" />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-500">
              Ordenar por
              <Select value={ordem} onChange={(e) => setOrdem(e.target.value as typeof ordem)} className="w-40">
                <option value="total">Nota total</option>
                <option value="v">Vínculo</option>
                <option value="i">Interesse</option>
                <option value="c">Capacidade</option>
                <option value="nome">Nome</option>
              </Select>
            </label>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2.5">Nº</th>
                  <th className="px-3 py-2.5">Empresa</th>
                  <th className="px-3 py-2.5">Ramo</th>
                  <th className="px-3 py-2.5">Projeto</th>
                  <th className="px-3 py-2.5 text-right" style={{ color: '#1F5F5B' }}>Vínculo</th>
                  <th className="px-3 py-2.5 text-right" style={{ color: '#B07D2B' }}>Interesse</th>
                  <th className="px-3 py-2.5 text-right" style={{ color: '#7A4B8F' }}>Capacidade</th>
                  <th className="px-3 py-2.5 text-right" style={{ color: '#B4462F' }}>Total</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listaFiltrada.map((row, k) => (
                  <tr key={row.key} className="cursor-pointer hover:bg-slate-50" onClick={() => abrir(row)}>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-400">{String(k + 1).padStart(2, '0')}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-900">{row.nome}</td>
                    <td className="max-w-[220px] truncate px-3 py-2.5 text-slate-500">{row.ramo || '—'}</td>
                    <td className="px-3 py-2.5">
                      <span className="max-w-[168px] truncate rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                        {row.projeto}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">{fmtNota(row.v)}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{fmtNota(row.i)}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{fmtNota(row.c)}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold" style={{ color: '#B4462F' }}>
                      {fmtNota(row.total)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleting(row);
                        }}
                        className="rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {listaFiltrada.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-slate-400">
                      Nenhuma avaliação encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <CompanyDetailDrawer
          companyId={selected.companyId}
          initialTab="vic"
          initialVicEvaluationId={selected.evaluationId}
          onClose={() => setSelected(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteEvaluation(deleting.evaluationId)}
        title="Excluir avaliação VIC"
        message={`Excluir a avaliação "${deleting?.projeto}" de "${deleting?.nome}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
      />
    </div>
  );
}
