import { useMemo } from 'react'
import { useStore } from '../lib/store'
import { useFilters } from '../lib/filters'
import {
  activeCountByCompany,
  averageGrossByCompany,
  grossByMonth,
  latestPeriod,
  reimbursementsByMonth,
  repasseFlowByMonth,
  sumLastNMonths,
  upcomingExpirations,
} from '../lib/analytics'
import { formatBRL, formatDate } from '../lib/format'
import { Card, CardHeader, CompanyTag, KpiCard, StatusPill } from '../components/ui'
import { RevenueAreaChart } from '../components/charts/RevenueAreaChart'
import { RepasseBarChart } from '../components/charts/RepasseBarChart'
import { ActiveContractsDonut } from '../components/charts/ActiveContractsDonut'
import { AvgValueBar } from '../components/charts/AvgValueBar'
import { SaldoLineChart } from '../components/charts/SaldoLineChart'

export function Dashboard() {
  const { data } = useStore()
  const { yearFrom, yearTo } = useFilters()
  const today = useMemo(() => new Date(), [])

  const revenuePoints = useMemo(
    () => grossByMonth(data).filter((p) => p.year >= yearFrom && p.year <= yearTo),
    [data, yearFrom, yearTo]
  )
  const repassePoints = useMemo(
    () => repasseFlowByMonth(data).filter((p) => p.year >= yearFrom && p.year <= yearTo),
    [data, yearFrom, yearTo]
  )
  const reimbPoints = useMemo(
    () => reimbursementsByMonth(data).filter((p) => p.year >= yearFrom && p.year <= yearTo),
    [data, yearFrom, yearTo]
  )
  const saldoPoints = useMemo(
    () =>
      data.settlements
        .filter((s) => s.year >= yearFrom && s.year <= yearTo && s.saldoEverest !== null)
        .sort((a, b) => a.year - b.year || a.month - b.month)
        .map((s) => ({
          label: `${['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][s.month - 1]}/${String(s.year).slice(2)}`,
          saldo: s.saldoEverest ?? 0,
        })),
    [data, yearFrom, yearTo]
  )

  const activeCounts = useMemo(() => activeCountByCompany(data, today), [data, today])
  const period = useMemo(() => latestPeriod(data, today), [data, today])
  const avgJungers = period ? averageGrossByCompany(data, 'JUNGERS', period.year, period.month) : 0
  const avgEverest = period ? averageGrossByCompany(data, 'EVEREST', period.year, period.month) : 0

  const last12Revenue = sumLastNMonths(revenuePoints, 12)
  const totalGross12 = last12Revenue.reduce((s, p) => s + p.total, 0)
  const last12Repasse = sumLastNMonths(repassePoints, 12)
  const totalRepasse12 = last12Repasse.reduce((s, p) => s + p.jungersToEverest + p.everestToJungers, 0)
  const last12Reimb = sumLastNMonths(reimbPoints, 12)
  const totalReimb12 = last12Reimb.reduce((s, p) => s + p.total, 0)

  const expirations = useMemo(() => upcomingExpirations(data, today, 120).slice(0, 6), [data, today])

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Faturamento bruto (12 meses)"
          value={formatBRL(totalGross12, { compact: true })}
          icon={<IconCash />}
          tone="brand"
        />
        <KpiCard
          label="Repasses trocados (12 meses)"
          value={formatBRL(totalRepasse12, { compact: true })}
          icon={<IconSwap />}
          tone="jungers"
        />
        <KpiCard
          label="Contratos ativos"
          value={String(activeCounts.JUNGERS + activeCounts.EVEREST)}
          icon={<IconFile />}
          tone="everest"
        />
        <KpiCard
          label="Reembolsos (12 meses)"
          value={formatBRL(totalReimb12, { compact: true })}
          icon={<IconRefund />}
          tone="ok"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardHeader
            title="Valor de contrato recebido por empresa"
            subtitle="Faturamento bruto mensal, líquido de reembolsos — Jungers, Everest e soma das duas"
          />
          <div className="px-2 pb-4 pt-2 sm:px-4">
            <RevenueAreaChart data={revenuePoints} />
          </div>
        </Card>

        <Card className="xl:col-span-4">
          <CardHeader title="Contratos ativos por empresa" subtitle={`Referência: ${formatDate(today.toISOString())}`} />
          <div className="px-4 pb-5 pt-2">
            <ActiveContractsDonut jungers={activeCounts.JUNGERS} everest={activeCounts.EVEREST} />
            <div className="mt-2 flex justify-center gap-6 text-sm">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="size-2.5 rounded-full bg-jungers-500" /> Jungers · {activeCounts.JUNGERS}
              </span>
              <span className="flex items-center gap-2 text-slate-600">
                <span className="size-2.5 rounded-full bg-everest-500" /> Everest · {activeCounts.EVEREST}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-7">
          <CardHeader title="Repasses trocados entre as empresas" subtitle="Valor mensal transferido de uma empresa para a outra" />
          <div className="px-2 pb-4 pt-2 sm:px-4">
            <RepasseBarChart data={repassePoints} />
          </div>
        </Card>

        <Card className="xl:col-span-5">
          <CardHeader title="Saldo em aberto" subtitle="Saldo de repasse pendente (Everest ⇄ Jungers)" />
          <div className="px-2 pb-4 pt-2 sm:px-4">
            {saldoPoints.length > 0 ? (
              <SaldoLineChart data={saldoPoints} />
            ) : (
              <p className="py-10 text-center text-sm text-slate-400">Sem lançamentos de saldo no período selecionado.</p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-4">
          <CardHeader title="Ticket médio por contrato" subtitle={period ? `Mês de referência: ${['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][period.month-1]}/${period.year}` : ''} />
          <div className="px-4 pb-5 pt-2">
            <AvgValueBar jungers={avgJungers} everest={avgEverest} />
          </div>
        </Card>

        <Card className="xl:col-span-8">
          <CardHeader title="Próximos vencimentos" subtitle="Contratos a vencer nos próximos 120 dias (ou já vencidos)" />
          <div className="overflow-x-auto px-2 pb-2 pt-2 sm:px-4">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-2 font-medium">Contrato</th>
                  <th className="px-3 py-2 font-medium">Empresa</th>
                  <th className="px-3 py-2 font-medium">Vencimento</th>
                  <th className="px-3 py-2 font-medium">Situação</th>
                </tr>
              </thead>
              <tbody>
                {expirations.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                      Nenhum contrato com data de vencimento cadastrada nesta janela.
                    </td>
                  </tr>
                )}
                {expirations.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="px-3 py-2.5 font-medium text-slate-700">{c.name}</td>
                    <td className="px-3 py-2.5">
                      <CompanyTag company={c.company} />
                    </td>
                    <td className="px-3 py-2.5 text-slate-500">{formatDate(c.endDate)}</td>
                    <td className="px-3 py-2.5">
                      {c.daysLeft < 0 ? (
                        <StatusPill tone="bad">Vencido há {Math.abs(c.daysLeft)}d</StatusPill>
                      ) : c.daysLeft <= 30 ? (
                        <StatusPill tone="bad">Vence em {c.daysLeft}d</StatusPill>
                      ) : c.daysLeft <= 60 ? (
                        <StatusPill tone="warn">Vence em {c.daysLeft}d</StatusPill>
                      ) : (
                        <StatusPill tone="ok">Vence em {c.daysLeft}d</StatusPill>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}

function IconCash() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M6 10v.01M18 14v.01" />
    </svg>
  )
}
function IconSwap() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h13l-3-3M20 17H7l3 3" />
    </svg>
  )
}
function IconFile() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 3h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v5h5" />
    </svg>
  )
}
function IconRefund() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 10a9 9 0 1 1 2.2 5.9" />
      <path d="M3 4v6h6" />
    </svg>
  )
}
