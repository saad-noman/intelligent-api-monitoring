// Centralized backend API configuration. All service modules build requests from here.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');

// Error carrying the HTTP status so callers can react to e.g. 401 (not signed in).
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Shared request setup for JSON endpoints.
// TODO: Add credential handling (cookies or bearer token) once the auth strategy is chosen.
export async function apiRequest(path, { method = 'GET', body } = {}) {
  if (!API_BASE_URL) throw new Error('VITE_API_BASE_URL is not configured.');

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(data?.error?.message ?? `Request failed with status ${response.status}.`, response.status);
  }
  return data;
}
