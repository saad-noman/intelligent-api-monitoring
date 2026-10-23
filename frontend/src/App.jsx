import { NavLink } from 'react-router';
import AppRoutes from './routes/AppRoutes.jsx';

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <strong>API Monitoring &amp; Alerts</strong>
        <nav>
          <NavLink to="/">Monitor</NavLink>
          <NavLink to="/alerts">Alerts</NavLink>
          <NavLink to="/settings">Settings</NavLink>
          <NavLink to="/login">Log in</NavLink>
          <NavLink to="/register">Register</NavLink>
        </nav>
      </header>
      <main>
        <AppRoutes />
      </main>
    </div>
  );
}
