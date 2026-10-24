// Every route path in the app; links and redirects reference these instead of literals.
export const PATHS = {
  monitor: '/',
  alerts: '/alerts',
  alertDetail: '/alerts/:alertId',
  history: '/history',
  settings: '/settings',
  login: '/login',
  register: '/register',
};

// Builds the detail page link for one alert, e.g. /alerts/ALR-20261024-9F2C41AB.
export function alertDetailPath(alertId) {
  return PATHS.alertDetail.replace(':alertId', encodeURIComponent(alertId));
}

// Header navigation. `guestOnly` links are hidden once the user is signed in.
export const NAV_LINKS = [
  { to: PATHS.monitor, label: 'Monitor', end: true },
  { to: PATHS.alerts, label: 'Alerts' },
  { to: PATHS.history, label: 'History' },
  { to: PATHS.settings, label: 'Settings' },
  { to: PATHS.login, label: 'Log in', guestOnly: true },
  { to: PATHS.register, label: 'Register', guestOnly: true },
];
