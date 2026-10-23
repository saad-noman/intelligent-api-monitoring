import { notImplemented } from './apiClient.js';

export async function register(registration) {
  throw notImplemented('POST /auth/register');
}

export async function login(credentials) {
  throw notImplemented('POST /auth/login');
}

export async function logout() {
  throw notImplemented('POST /auth/logout');
}

export async function getCurrentAccount() {
  throw notImplemented('GET /auth/me');
}
