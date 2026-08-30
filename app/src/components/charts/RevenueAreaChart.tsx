import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { COLORS } from '../../lib/colors'
import { formatBRL } from '../../lib/format'
import type { MonthPoint } from '../../lib/analytics'

export function RevenueAreaChart({ data }: { data: MonthPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="fillJungers" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.jungers} stopOpacity={0.35} />
            <stop offset="95%" stopColor={COLORS.jungers} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="fillEverest" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.everest} stopOpacity={0.35} />
            <stop offset="95%" stopColor={COLORS.everest} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: COLORS.axis }} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis
          tick={{ fontSize: 11, fill: COLORS.axis }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => formatBRL(v, { compact: true })}
          width={64}
        />
        <Tooltip
          formatter={((value?: number | string, name?: string) => [formatBRL(Number(value)), name]) as never}
          contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="jungers" name="Jungers" stroke={COLORS.jungers} fill="url(#fillJungers)" strokeWidth={2} />
        <Area type="monotone" dataKey="everest" name="Everest" stroke={COLORS.everest} fill="url(#fillEverest)" strokeWidth={2} />
        <Area type="monotone" dataKey="total" name="Total (E+J)" stroke={COLORS.brand} fill="none" strokeWidth={2.25} strokeDasharray="5 3" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
