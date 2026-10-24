import { apiRequest } from './apiClient.js';
import { saveToken, clearToken } from './tokenStorage.js';

export async function register(registration) {
  return apiRequest('/auth/register', { method: 'POST', body: registration });
}

export async function login(credentials) {
  const data = await apiRequest('/auth/login', { method: 'POST', body: credentials });
  saveToken(data.token);
  return data;
}

// The local token is cleared even if the server request fails.
export async function logout() {
  try {
    return await apiRequest('/auth/logout', { method: 'POST' });
  } finally {
    clearToken();
  }
}

export async function getCurrentAccount() {
  return apiRequest('/auth/me');
}
