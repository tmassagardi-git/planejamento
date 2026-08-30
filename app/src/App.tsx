import { HashRouter, Route, Routes } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { StoreProvider } from './lib/store'
import { FiltersProvider } from './lib/filters'
import { Dashboard } from './pages/Dashboard'
import { Contratos } from './pages/Contratos'
import { Repasses } from './pages/Repasses'
import { Reembolsos } from './pages/Reembolsos'
import { Configuracoes } from './pages/Configuracoes'

export default function App() {
  return (
    <StoreProvider>
      <FiltersProvider>
        <HashRouter>
          <div className="flex min-h-screen bg-[#f4f5fb]">
            <Sidebar />
            <div className="flex min-h-screen flex-1 flex-col">
              <Topbar />
              <main className="flex-1 px-4 py-6 md:px-8">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/contratos" element={<Contratos />} />
                  <Route path="/repasses" element={<Repasses />} />
                  <Route path="/reembolsos" element={<Reembolsos />} />
                  <Route path="/configuracoes" element={<Configuracoes />} />
                </Routes>
              </main>
            </div>
          </div>
        </HashRouter>
      </FiltersProvider>
    </StoreProvider>
  )
}
