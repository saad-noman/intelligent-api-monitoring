import { Routes, Route } from 'react-router';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import MonitoringPage from '../pages/MonitoringPage.jsx';
import AlertsPage from '../pages/AlertsPage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';
import ProfileSettingsPage from '../pages/ProfileSettingsPage.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Guest-accessible */}
      <Route path="/" element={<MonitoringPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Account-specific; the backend enforces authorization independently */}
      <Route element={<ProtectedRoute />}>
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/settings" element={<ProfileSettingsPage />} />
      </Route>
    </Routes>
  );
}
