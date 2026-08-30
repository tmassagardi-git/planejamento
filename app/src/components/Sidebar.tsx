import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', label: 'Dashboard', icon: IconGrid },
  { to: '/contratos', label: 'Contratos', icon: IconFile },
  { to: '/repasses', label: 'Repasses & Planilha', icon: IconTable },
  { to: '/reembolsos', label: 'Reembolsos', icon: IconRefund },
  { to: '/configuracoes', label: 'Configurações', icon: IconGear },
]

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-ink-950 text-slate-200 min-h-screen sticky top-0">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-jungers-500 to-everest-500 font-bold text-white">
          EJ
        </div>
        <div className="leading-tight">
          <p className="font-semibold text-white">Everest & Jungers</p>
          <p className="text-xs text-slate-400">Contratos e repasses</p>
        </div>
      </div>

      <nav className="mt-2 flex flex-1 flex-col gap-1 px-3">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
              }`
            }
          >
            <Icon className="size-[18px]" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="m-3 rounded-2xl bg-gradient-to-br from-brand-600 to-ink-700 p-4 text-white">
        <p className="text-sm font-semibold">Parceria E&J</p>
        <p className="mt-1 text-xs text-slate-300">
          Balanço mensal automático de contratos, impostos e repasses entre as duas empresas.
        </p>
      </div>
    </aside>
  )
}

function IconGrid(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}
function IconFile(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M6 3h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v5h5" />
      <path d="M8 13h8M8 17h8" />
    </svg>
  )
}
function IconTable(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18M9 4v16" />
    </svg>
  )
}
function IconRefund(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M3 10a9 9 0 1 1 2.2 5.9" />
      <path d="M3 4v6h6" />
      <path d="M12 8v5l3 2" />
    </svg>
  )
}
function IconGear(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v3M12 18.5v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2.5 12h3M18.5 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </svg>
  )
}
