import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as authService from '../services/authService.js';

const AuthContext = createContext(null);

export const AUTH_STATUS = {
  loading: 'loading',
  authenticated: 'authenticated',
  guest: 'guest',
};

// The /auth/me payload shape is not finalized; these keys are assumptions to confirm
// with the backend. The account may be returned directly or wrapped under `wrapper`.
const ACCOUNT_KEYS = {
  wrapper: 'account',
  email: 'email',
  alertEmail: 'alertEmail',
  emailReportsEnabled: 'emailReportsEnabled',
};

function toAccount(data) {
  const account = data?.[ACCOUNT_KEYS.wrapper] ?? data;
  if (!account) return null;
  return {
    email: account[ACCOUNT_KEYS.email] ?? null,
    alertEmail: account[ACCOUNT_KEYS.alertEmail] ?? null,
    emailReportsEnabled: account[ACCOUNT_KEYS.emailReportsEnabled] !== false,
  };
}

// Holds who is signed in. This is UX state only: the backend enforces authorization.
export function AuthProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [status, setStatus] = useState(AUTH_STATUS.loading);

  const refresh = useCallback(async () => {
    try {
      const current = toAccount(await authService.getCurrentAccount());
      setAccount(current);
      setStatus(current ? AUTH_STATUS.authenticated : AUTH_STATUS.guest);
    } catch {
      setAccount(null);
      setStatus(AUTH_STATUS.guest);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function signIn(credentials) {
    await authService.login(credentials);
    await refresh();
  }

  async function signOut() {
    try {
      await authService.logout();
    } finally {
      setAccount(null);
      setStatus(AUTH_STATUS.guest);
    }
  }

  const value = { account, status, signIn, signOut, refresh };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
