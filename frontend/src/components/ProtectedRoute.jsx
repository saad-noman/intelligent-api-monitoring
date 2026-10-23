import { Outlet } from 'react-router';

// Future boundary for authenticated-only pages. This is a UX convenience only: the
// backend independently rejects unauthenticated access to private data.
export default function ProtectedRoute() {
  // TODO: Redirect unauthenticated visitors to /login once authentication state exists.
  return <Outlet />;
}
