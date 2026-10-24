// Centralized backend API configuration. All service modules build requests from here.
import { getToken } from './tokenStorage.js';
import { ERROR_CODES } from '../utils/errorMessages.js';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');

// Error carrying the HTTP status and backend error code so callers can react to them.
// `message` stays technical for debugging; the UI shows utils/errorMessages.js instead.
export class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    // Optional item-level problems, e.g. POST /monitor validation errors.
    this.details = details;
  }
}

// fetch() only rejects when the server cannot be reached at all.
async function send(url, options) {
  try {
    return await fetch(url, options);
  } catch (err) {
    throw new ApiError(err.message, 0, ERROR_CODES.network);
  }
}

function buildHeaders(hasBody) {
  const headers = {};
  if (hasBody) headers['Content-Type'] = 'application/json';

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// Shared request setup for JSON endpoints. Sends the saved session token, if any.
export async function apiRequest(path, { method = 'GET', body } = {}) {
  if (!API_BASE_URL) {
    throw new ApiError('VITE_API_BASE_URL is not configured.', 0, ERROR_CODES.configMissing);
  }

  const hasBody = body !== undefined;
  const response = await send(`${API_BASE_URL}${path}`, {
    method,
    headers: buildHeaders(hasBody),
    body: hasBody ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.error?.message ?? `Request failed with status ${response.status}.`;
    throw new ApiError(message, response.status, data?.error?.code, data?.error?.details);
  }
  return data;
}
