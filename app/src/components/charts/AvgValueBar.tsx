import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { COLORS } from '../../lib/colors'
import { formatBRL } from '../../lib/format'

export function AvgValueBar({ jungers, everest }: { jungers: number; everest: number }) {
  const data = [
    { name: 'Jungers', value: jungers, color: COLORS.jungers },
    { name: 'Everest', value: everest, color: COLORS.everest },
  ]
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
        <XAxis type="number" hide tickFormatter={(v: number) => formatBRL(v, { compact: true })} />
        <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 12, fill: '#334155' }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={((value?: number | string) => formatBRL(Number(value))) as never}
          contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
        />
        <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={28}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
