import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { COLORS } from '../../lib/colors'
import { formatBRL } from '../../lib/format'

export interface SaldoPoint {
  label: string
  saldo: number
}

export function SaldoLineChart({ data }: { data: SaldoPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: COLORS.axis }} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis tick={{ fontSize: 11, fill: COLORS.axis }} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatBRL(v, { compact: true })} width={64} />
        <ReferenceLine y={0} stroke={COLORS.axis} />
        <Tooltip
          formatter={((value?: number | string) => [formatBRL(Number(value)), 'Saldo (Everest deve a Jungers)']) as never}
          contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
        />
        <Line type="monotone" dataKey="saldo" stroke={COLORS.brand} strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
