import { NavLink, Outlet } from 'react-router-dom';
import { Building2, Kanban, HeartHandshake, LayoutDashboard, Settings, Target, Users } from 'lucide-react';
import clsx from 'clsx';
import { GlobalSearch } from './GlobalSearch';

const NAV = [
  { to: '/empresas', label: 'Empresas', icon: Building2 },
  { to: '/contatos', label: 'Contatos', icon: Users },
  { to: '/vic', label: 'Matriz VIC', icon: Target },
  { to: '/funil', label: 'Funil de Vendas', icon: Kanban },
  { to: '/doacoes', label: 'Doações', icon: HeartHandshake },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
];

export function Layout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="px-5 py-5">
          <div className="text-lg font-bold text-slate-900">CRM Doadores</div>
          <div className="text-xs text-slate-400">Captação &amp; Gestão de Empresas</div>
        </div>
        <nav className="flex flex-col gap-0.5 px-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100',
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto px-5 py-4 text-xs text-slate-400">Dados salvos localmente neste navegador</div>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center border-b border-slate-200 bg-white px-6 py-3">
          <GlobalSearch />
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
