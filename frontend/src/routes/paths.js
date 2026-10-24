// Every route path in the app; links and redirects reference these instead of literals.
export const PATHS = {
  monitor: '/',
  alerts: '/alerts',
  settings: '/settings',
  login: '/login',
  register: '/register',
};

// Header navigation. `guestOnly` links are hidden once the user is signed in.
export const NAV_LINKS = [
  { to: PATHS.monitor, label: 'Monitor', end: true },
  { to: PATHS.alerts, label: 'Alerts' },
  { to: PATHS.settings, label: 'Settings' },
  { to: PATHS.login, label: 'Log in', guestOnly: true },
  { to: PATHS.register, label: 'Register', guestOnly: true },
];
