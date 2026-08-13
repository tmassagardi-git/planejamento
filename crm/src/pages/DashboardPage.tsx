import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { db } from '../lib/db';
import { Select } from '../components/ui/Primitives';
import { formatCurrency } from '../lib/format';
import {
  getCategoryBreakdown,
  getFunnelCounts,
  getMonthlyPrevistoRealizado,
  getNewDonorsByMonth,
  getSummary,
} from '../services/dashboard';

const COLORS = {
  previsto: '#2a78d6',
  realizado: '#eb6834',
  single: '#2a78d6',
  ink: '#0b0b0b',
  secondary: '#52514e',
  muted: '#898781',
  grid: '#e1e0d9',
};

function StatTile({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-bold" style={{ color: accent ?? COLORS.ink }}>
        {value}
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-800">{title}</h3>
      {children}
    </div>
  );
}

export function DashboardPage() {
  const donations = useLiveQuery(() => db.donations.toArray(), []);
  const installments = useLiveQuery(() => db.installments.toArray(), []);
  const opportunities = useLiveQuery(() => db.opportunities.toArray(), []);
  const stages = useLiveQuery(() => db.stages.toArray(), []);

  const years = useMemo(() => {
    const set = new Set<number>();
    for (const inst of installments ?? []) set.add(Number(inst.dueDate.slice(0, 4)));
    set.add(new Date().getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [installments]);

  const [year, setYear] = useState(new Date().getFullYear());

  const monthly = useMemo(
    () => getMonthlyPrevistoRealizado(installments ?? [], year),
    [installments, year],
  );
  const newDonors = useMemo(() => getNewDonorsByMonth(donations ?? [], year), [donations, year]);
  const categoryBreakdown = useMemo(() => getCategoryBreakdown(donations ?? []), [donations]);
  const funnelCounts = useMemo(
    () => getFunnelCounts(opportunities ?? [], stages ?? []),
    [opportunities, stages],
  );
  const summary = useMemo(
    () => getSummary(donations ?? [], installments ?? [], opportunities ?? [], year),
    [donations, installments, opportunities, year],
  );

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Visão geral de captação e arrecadação</p>
        </div>
        <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-28">
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
      </div>

      <div className="mb-6 grid grid-cols-5 gap-4">
        <StatTile label="Arrecadado no ano" value={formatCurrency(summary.totalArrecadadoAno)} accent="#0ca30c" />
        <StatTile label="Previsto no ano" value={formatCurrency(summary.totalPrevistoAno)} />
        <StatTile label="Doadores ativos" value={String(summary.doadoresAtivos)} />
        <StatTile label="Oportunidades abertas" value={String(summary.oportunidadesAbertas)} />
        <StatTile label="Taxa de conversão" value={`${Math.round(summary.taxaConversao * 100)}%`} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ChartCard title={`Previsto vs. Realizado por mês (${year})`}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthly} margin={{ left: 0, right: 8 }}>
              <CartesianGrid vertical={false} stroke={COLORS.grid} />
              <XAxis dataKey="month" tick={{ fill: COLORS.muted, fontSize: 12 }} axisLine={{ stroke: COLORS.grid }} tickLine={false} />
              <YAxis
                tick={{ fill: COLORS.muted, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Legend wrapperStyle={{ fontSize: 12, color: COLORS.secondary }} />
              <Bar dataKey="previsto" name="Previsto" fill={COLORS.previsto} radius={[3, 3, 0, 0]} maxBarSize={22} />
              <Bar dataKey="realizado" name="Realizado" fill={COLORS.realizado} radius={[3, 3, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={`Novos doadores por mês (${year})`}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={newDonors} margin={{ left: 0, right: 8 }}>
              <CartesianGrid vertical={false} stroke={COLORS.grid} />
              <XAxis dataKey="month" tick={{ fill: COLORS.muted, fontSize: 12 }} axisLine={{ stroke: COLORS.grid }} tickLine={false} />
              <YAxis tick={{ fill: COLORS.muted, fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="Novos doadores" fill={COLORS.single} radius={[3, 3, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Distribuição por categoria / cota">
          {categoryBreakdown.length === 0 ? (
            <p className="flex h-48 items-center justify-center text-sm text-slate-400">
              Nenhuma doação registrada ainda.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(200, categoryBreakdown.length * 40)}>
              <BarChart data={categoryBreakdown} layout="vertical" margin={{ left: 24, right: 40 }}>
                <CartesianGrid horizontal={false} stroke={COLORS.grid} />
                <XAxis type="number" tick={{ fill: COLORS.muted, fontSize: 12 }} axisLine={false} tickLine={false} hide />
                <YAxis
                  type="category"
                  dataKey="category"
                  tick={{ fill: COLORS.secondary, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={110}
                />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="total" name="Total" fill={COLORS.single} radius={[0, 3, 3, 0]} maxBarSize={20}>
                  {categoryBreakdown.map((entry) => (
                    <Cell key={entry.category} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Funil de conversão (oportunidades abertas)">
          <ResponsiveContainer width="100%" height={Math.max(200, funnelCounts.length * 40)}>
            <BarChart data={funnelCounts} layout="vertical" margin={{ left: 24, right: 40 }}>
              <CartesianGrid horizontal={false} stroke={COLORS.grid} />
              <XAxis type="number" tick={{ fill: COLORS.muted, fontSize: 12 }} axisLine={false} tickLine={false} hide allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="stageName"
                tick={{ fill: COLORS.secondary, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={140}
              />
              <Tooltip formatter={(v, name) => (name === 'count' ? Number(v) : formatCurrency(Number(v)))} />
              <Bar dataKey="count" name="Oportunidades" fill={COLORS.single} radius={[0, 3, 3, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
