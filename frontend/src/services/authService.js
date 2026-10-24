import { apiRequest } from './apiClient.js';

export async function register(registration) {
  return apiRequest('/auth/register', { method: 'POST', body: registration });
}

export async function login(credentials) {
  return apiRequest('/auth/login', { method: 'POST', body: credentials });
}

export async function logout() {
  return apiRequest('/auth/logout', { method: 'POST' });
}

export async function getCurrentAccount() {
  return apiRequest('/auth/me');
}
