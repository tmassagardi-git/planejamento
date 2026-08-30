import type { ReactNode } from 'react'
import type { Company } from '../lib/types'
import { COMPANY_LABEL } from '../lib/types'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200/70 bg-white shadow-sm shadow-slate-200/50 ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5">
      <div>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function KpiCard({
  label,
  value,
  delta,
  icon,
  tone = 'brand',
}: {
  label: string
  value: string
  delta?: { value: string; positive: boolean } | null
  icon: ReactNode
  tone?: 'brand' | 'jungers' | 'everest' | 'ok'
}) {
  const toneClasses: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    jungers: 'bg-sky-50 text-jungers-600',
    everest: 'bg-orange-50 text-everest-600',
    ok: 'bg-emerald-50 text-ok-500',
  }
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className={`grid size-10 place-items-center rounded-xl ${toneClasses[tone]}`}>{icon}</span>
        {delta && (
          <span className={`text-xs font-semibold ${delta.positive ? 'text-ok-500' : 'text-bad-500'}`}>
            {delta.positive ? '▲' : '▼'} {delta.value}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </Card>
  )
}

export function CompanyTag({ company }: { company: Company }) {
  const styles = company === 'JUNGERS' ? 'bg-sky-50 text-jungers-600 ring-jungers-200' : 'bg-orange-50 text-everest-600 ring-everest-200'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${styles}`}>
      <span className={`size-1.5 rounded-full ${company === 'JUNGERS' ? 'bg-jungers-500' : 'bg-everest-500'}`} />
      {COMPANY_LABEL[company]}
    </span>
  )
}

export function StatusPill({ tone, children }: { tone: 'ok' | 'warn' | 'bad' | 'muted'; children: ReactNode }) {
  const styles: Record<string, string> = {
    ok: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
    warn: 'bg-amber-50 text-amber-700 ring-amber-200',
    bad: 'bg-rose-50 text-rose-600 ring-rose-200',
    muted: 'bg-slate-100 text-slate-500 ring-slate-200',
  }
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${styles[tone]}`}>{children}</span>
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  type?: 'button' | 'submit'
  className?: string
}) {
  const styles: Record<string, string> = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700',
    secondary: 'bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50',
    ghost: 'text-slate-500 hover:bg-slate-100',
    danger: 'bg-rose-50 text-rose-600 hover:bg-rose-100',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
