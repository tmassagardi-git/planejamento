import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { COLORS } from '../../lib/colors'
import { formatBRL } from '../../lib/format'
import type { RepasseFlowPoint } from '../../lib/analytics'

export function RepasseBarChart({ data }: { data: RepasseFlowPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }} barCategoryGap={6}>
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
        <Bar dataKey="jungersToEverest" name="Jungers → Everest" fill={COLORS.jungers} radius={[4, 4, 0, 0]} />
        <Bar dataKey="everestToJungers" name="Everest → Jungers" fill={COLORS.everest} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
