import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CompaniesPage } from './pages/CompaniesPage';
import { VicPage } from './pages/VicPage';
import { FunnelPage } from './pages/FunnelPage';
import { DonationsPage } from './pages/DonationsPage';
import { DashboardPage } from './pages/DashboardPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/empresas" element={<CompaniesPage />} />
          <Route path="/vic" element={<VicPage />} />
          <Route path="/funil" element={<FunnelPage />} />
          <Route path="/doacoes" element={<DonationsPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/configuracoes" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
