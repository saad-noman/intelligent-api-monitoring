// Persists the session token returned by POST /auth/login. Storage access can throw
// (e.g. private mode or blocked site data), so every call is guarded.
const TOKEN_KEY = 'authToken';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Without storage the session lasts only until the page reloads.
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing stored to clear.
  }
}
