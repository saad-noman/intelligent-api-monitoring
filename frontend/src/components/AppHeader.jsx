import { useState } from 'react';
import { Link, NavLink } from 'react-router';
import { AUTH_STATUS, useAuth } from '../context/AuthContext.jsx';
import { NAV_LINKS, PATHS } from '../routes/paths.js';

// Sticky header: brand, pill navigation (collapses into a menu on mobile), account action.
export default function AppHeader() {
  const { status, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);
  const isAuthenticated = status === AUTH_STATUS.authenticated;
  const links = NAV_LINKS.filter((link) => !(link.guestOnly && isAuthenticated));

  return (
    <header className="app-header">
      <Link to={PATHS.monitor} className="brand" onClick={close}>
        <span className="brand-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3 12h4l3-7 4 14 3-7h4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="brand-text">
          <span className="brand-top">COTTAGE HOME CARE</span>
          <span className="brand-bottom">INTELLIGENT API MONITOR</span>
        </span>
      </Link>

      <button
        type="button"
        className="menu-toggle"
        aria-expanded={isOpen}
        aria-controls="main-nav"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? 'Close' : 'Menu'}
      </button>

      <nav id="main-nav" className={`main-nav ${isOpen ? 'open' : ''}`}>
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end} onClick={close}>
            {link.label}
          </NavLink>
        ))}
        {isAuthenticated && (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => { close(); signOut(); }}>
            Log out
          </button>
        )}
      </nav>
    </header>
  );
}
