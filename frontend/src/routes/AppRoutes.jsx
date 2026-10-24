import { Routes, Route } from 'react-router';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import MonitoringPage from '../pages/MonitoringPage.jsx';
import AlertsPage from '../pages/AlertsPage.jsx';
import AlertDetailPage from '../pages/AlertDetailPage.jsx';
import HistoryPage from '../pages/HistoryPage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';
import ProfileSettingsPage from '../pages/ProfileSettingsPage.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';
import AccountSectionPage from '../pages/AccountSectionPage.jsx';
import { PATHS } from './paths.js';
import { ACCOUNT_SECTIONS } from './accountSections.js';

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
        <Route path={PATHS.profile} element={<ProfilePage />} />
        {ACCOUNT_SECTIONS.map((section) => (
          <Route key={section.path} path={section.path} element={<AccountSectionPage section={section} />} />
        ))}
      </Route>
    </Routes>
  );
}
