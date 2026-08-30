import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { COLORS } from '../../lib/colors'

export function ActiveContractsDonut({ jungers, everest }: { jungers: number; everest: number }) {
  const total = jungers + everest
  const data = [
    { name: 'Jungers', value: jungers, color: COLORS.jungers },
    { name: 'Everest', value: everest, color: COLORS.everest },
  ]
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={3} startAngle={90} endAngle={-270}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} stroke="white" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            formatter={((value?: number | string, name?: string) => [`${value} contratos`, name]) as never}
            contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 top-0 flex flex-col items-center justify-center" style={{ height: 220 }}>
        <span className="text-2xl font-semibold text-slate-900">{total}</span>
        <span className="text-xs text-slate-400">ativos</span>
      </div>
    </div>
  )
}
