import { Routes, Route } from 'react-router';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import MonitoringPage from '../pages/MonitoringPage.jsx';
import AlertsPage from '../pages/AlertsPage.jsx';
import AlertDetailPage from '../pages/AlertDetailPage.jsx';
import HistoryPage from '../pages/HistoryPage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';
import ProfileSettingsPage from '../pages/ProfileSettingsPage.jsx';
import { PATHS } from './paths.js';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Guest-accessible */}
      <Route path={PATHS.monitor} element={<MonitoringPage />} />
      <Route path={PATHS.login} element={<LoginPage />} />
      <Route path={PATHS.register} element={<RegisterPage />} />

      {/* Account-specific; the backend enforces authorization independently */}
      <Route element={<ProtectedRoute />}>
        <Route path={PATHS.alerts} element={<AlertsPage />} />
        <Route path={PATHS.alertDetail} element={<AlertDetailPage />} />
        <Route path={PATHS.history} element={<HistoryPage />} />
        <Route path={PATHS.settings} element={<ProfileSettingsPage />} />
      </Route>
    </Routes>
  );
}
