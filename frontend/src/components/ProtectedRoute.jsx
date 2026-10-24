import { Navigate, Outlet, useLocation } from 'react-router';
import { AUTH_STATUS, useAuth } from '../context/AuthContext.jsx';
import { PATHS } from '../routes/paths.js';
import StatusMessage from './StatusMessage.jsx';

// Boundary for authenticated-only pages. This is a UX convenience only: the
// backend independently rejects unauthenticated access to private data.
export default function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === AUTH_STATUS.loading) return <StatusMessage variant="loading" title="Checking your account…" />;
  if (status === AUTH_STATUS.guest) return <Navigate to={PATHS.login} replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
