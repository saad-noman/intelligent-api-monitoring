// Centralized environment loading and validation. Error messages name the offending
// variable but never include its value.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ENV_FILE = fileURLToPath(new URL('../../.env', import.meta.url));
const NODE_ENVS = ['development', 'test', 'production'];
const DEV_DEFAULT_ORIGINS = ['http://localhost:5173'];

export class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigError';
  }
}

function parsePort(value) {
  const port = Number(value ?? 5000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new ConfigError('PORT must be an integer between 1 and 65535.');
  }
  return port;
}

// Origins must be exact (scheme://host[:port]); wildcards are rejected in every environment.
function parseOrigins(value, isProduction) {
  const origins = (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    if (isProduction) throw new ConfigError('FRONTEND_ORIGINS is required in production.');
    return DEV_DEFAULT_ORIGINS;
  }

  for (const origin of origins) {
    let parsed = null;
    try {
      parsed = new URL(origin);
    } catch {
      // Handled below.
    }
    if (!parsed || parsed.origin !== origin) {
      throw new ConfigError(
        'FRONTEND_ORIGINS must list exact origins such as https://app.example.com (no wildcards, paths, or trailing slashes).',
      );
    }
  }
  return origins;
}

export function loadConfig() {
  // A local .env file is optional; hosted environments (e.g. Render) inject variables directly.
  if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);

  // Defaults to production so that a missing NODE_ENV never enables development behavior.
  const nodeEnv = process.env.NODE_ENV || 'production';
  if (!NODE_ENVS.includes(nodeEnv)) {
    throw new ConfigError(`NODE_ENV must be one of: ${NODE_ENVS.join(', ')}.`);
  }
  const isProduction = nodeEnv === 'production';

  const mongodbUri = process.env.MONGODB_URI?.trim();
  if (!mongodbUri) throw new ConfigError('MONGODB_URI is required.');

  return Object.freeze({
    nodeEnv,
    isProduction,
    port: parsePort(process.env.PORT),
    mongodbUri,
    frontendOrigins: Object.freeze(parseOrigins(process.env.FRONTEND_ORIGINS, isProduction)),
  });
}
