import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const PUBLIC_ENV_PREFIX = 'VITE_';
const envFilePath = (name) => fileURLToPath(new URL(name, import.meta.url));

// Vite reads .env files itself, but never .env.example. When there is no .env, the
// public VITE_* values of .env.example are used instead. Variables set in the real
// environment (e.g. on Vercel) always win.
function loadExampleEnv() {
  if (existsSync(envFilePath('.env')) || !existsSync(envFilePath('.env.example'))) return {};
  const values = parseEnv(readFileSync(envFilePath('.env.example'), 'utf8'));
  const publicEntries = Object.entries(values).filter(
    ([name]) => name.startsWith(PUBLIC_ENV_PREFIX) && process.env[name] === undefined,
  );
  return Object.fromEntries(publicEntries);
}

// { VITE_API_BASE_URL: "x" } -> { "import.meta.env.VITE_API_BASE_URL": "\"x\"" }
function toDefines(values) {
  return Object.fromEntries(
    Object.entries(values).map(([name, value]) => [`import.meta.env.${name}`, JSON.stringify(value)]),
  );
}

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  define: toDefines(loadExampleEnv()),
});
