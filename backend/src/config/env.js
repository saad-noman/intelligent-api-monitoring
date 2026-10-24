// Centralized environment loading and validation. Error messages name the offending
// variable but never include its value.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// The first existing file is loaded: .env, or .env.example when no .env exists.
const ENV_FILE_NAMES = ['.env', '.env.example'];
const NODE_ENVS = ['development', 'test', 'production'];
const DEV_DEFAULT_ORIGINS = ['http://localhost:5173'];
const DEFAULT_SESSION_TTL_HOURS = 168; // 7 days

// Monitoring defaults. The assignment does not fix a latency threshold, so 3000 ms is a
// documented default; status codes at or above FAILED_STATUS_MIN count as failed requests.
const DEFAULT_HIGH_RESPONSE_TIME_MS = 3000;
const DEFAULT_FAILED_STATUS_MIN = 400;
const DEFAULT_MAX_BATCH_SIZE = 100;

const DEFAULT_LLM_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_LLM_MODEL = 'openai/gpt-oss-20b';
const DEFAULT_LLM_TIMEOUT_MS = 15000;
const DEFAULT_LLM_MAX_TOKENS = 1200;
const DEFAULT_LLM_RETRIES = 1;
const DEFAULT_LLM_RETRY_DELAY_MS = 1500;

const DEFAULT_SMTP_PORT = 587;

// Set by loadConfig() so other modules can read the validated configuration via getConfig().
let loadedConfig = null;

export class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigError';
  }
}

// Reads an optional integer variable, falling back to `defaultValue` when unset.
function parseInteger(name, value, defaultValue, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (value === undefined || value.trim() === '') return defaultValue;
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new ConfigError(`${name} must be an integer between ${min} and ${max}.`);
  }
  return number;
}

function parseOptionalString(value) {
  const text = value?.trim();
  return text ? text : null;
}

// "a, b,,c" -> ["a", "b", "c"]
function parseCommaList(value) {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

// Optional comma-separated DNS servers for Node's resolver (e.g. when the system's
// default DNS cannot resolve the SRV records used by mongodb+srv:// URIs).
function parseDnsServers(value) {
  return parseCommaList(value);
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

// Optional JSON file mapping api_name -> { "requiredFields": ["..."] }. Used only when an
// observation also supplies a response_body; without a schema, bodies are not validated.
function parseResponseSchemas(filePath) {
  if (!filePath) return {};
  try {
    const schemas = JSON.parse(readFileSync(filePath, 'utf8'));
    if (typeof schemas !== 'object' || schemas === null || Array.isArray(schemas)) throw new Error();
    return schemas;
  } catch {
    throw new ConfigError('RESPONSE_SCHEMAS_FILE must point to a readable JSON object file.');
  }
}

function loadMonitoringConfig(env) {
  return Object.freeze({
    highResponseTimeMs: parseInteger('HIGH_RESPONSE_TIME_MS', env.HIGH_RESPONSE_TIME_MS, DEFAULT_HIGH_RESPONSE_TIME_MS),
    failedStatusMin: parseInteger('FAILED_STATUS_MIN', env.FAILED_STATUS_MIN, DEFAULT_FAILED_STATUS_MIN, {
      min: 100,
      max: 599,
    }),
    maxBatchSize: parseInteger('MAX_BATCH_SIZE', env.MAX_BATCH_SIZE, DEFAULT_MAX_BATCH_SIZE),
    responseSchemas: Object.freeze(parseResponseSchemas(parseOptionalString(env.RESPONSE_SCHEMAS_FILE))),
  });
}

// Primary model first, then the optional comma-separated fallback models, without duplicates.
function parseModelList(primary, fallbacks) {
  const models = [parseOptionalString(primary) ?? DEFAULT_LLM_MODEL, ...parseCommaList(fallbacks)];
  return [...new Set(models)];
}

// A missing API key is allowed: alerts then use the deterministic fallback template.
function loadLlmConfig(env) {
  return Object.freeze({
    apiKey: parseOptionalString(env.OPENROUTER_API_KEY),
    baseUrl: (parseOptionalString(env.OPENROUTER_BASE_URL) ?? DEFAULT_LLM_BASE_URL).replace(/\/+$/, ''),
    // Tried in order until one returns a valid analysis.
    models: Object.freeze(parseModelList(env.OPENROUTER_MODEL, env.OPENROUTER_FALLBACK_MODELS)),
    timeoutMs: parseInteger('LLM_TIMEOUT_MS', env.LLM_TIMEOUT_MS, DEFAULT_LLM_TIMEOUT_MS),
    maxTokens: parseInteger('LLM_MAX_TOKENS', env.LLM_MAX_TOKENS, DEFAULT_LLM_MAX_TOKENS),
    // Extra attempts per model after a temporary error (rate limit, timeout, provider 5xx).
    retries: parseInteger('LLM_RETRIES', env.LLM_RETRIES, DEFAULT_LLM_RETRIES, { min: 0, max: 5 }),
    retryDelayMs: parseInteger('LLM_RETRY_DELAY_MS', env.LLM_RETRY_DELAY_MS, DEFAULT_LLM_RETRY_DELAY_MS, { min: 0 }),
  });
}

// Missing SMTP settings are allowed: anomaly emails are then skipped, never faked.
function loadEmailConfig(env) {
  return Object.freeze({
    host: parseOptionalString(env.SMTP_HOST),
    port: parseInteger('SMTP_PORT', env.SMTP_PORT, DEFAULT_SMTP_PORT, { max: 65535 }),
    secure: env.SMTP_SECURE?.trim() === 'true',
    user: parseOptionalString(env.SMTP_USER),
    pass: parseOptionalString(env.SMTP_PASS),
    from: parseOptionalString(env.SMTP_FROM),
  });
}

// A local env file is optional; hosted environments (e.g. Render) inject variables directly.
function findEnvFile() {
  for (const name of ENV_FILE_NAMES) {
    const path = fileURLToPath(new URL(`../../${name}`, import.meta.url));
    if (existsSync(path)) return { name, path };
  }
  return null;
}

export function loadConfig() {
  const envFile = findEnvFile();
  if (envFile) process.loadEnvFile(envFile.path);

  // Defaults to production so that a missing NODE_ENV never enables development behavior.
  const nodeEnv = process.env.NODE_ENV || 'production';
  if (!NODE_ENVS.includes(nodeEnv)) {
    throw new ConfigError(`NODE_ENV must be one of: ${NODE_ENVS.join(', ')}.`);
  }
  const isProduction = nodeEnv === 'production';

  const mongodbUri = process.env.MONGODB_URI?.trim();
  if (!mongodbUri) throw new ConfigError('MONGODB_URI is required.');

  loadedConfig = Object.freeze({
    nodeEnv,
    isProduction,
    // Name only (e.g. ".env.example"), for the startup log; null when variables are injected.
    envFileName: envFile?.name ?? null,
    port: parseInteger('PORT', process.env.PORT, 5000, { max: 65535 }),
    mongodbUri,
    frontendOrigins: Object.freeze(parseOrigins(process.env.FRONTEND_ORIGINS, isProduction)),
    sessionTtlHours: parseInteger('SESSION_TTL_HOURS', process.env.SESSION_TTL_HOURS, DEFAULT_SESSION_TTL_HOURS),
    dnsServers: Object.freeze(parseDnsServers(process.env.DNS_SERVERS)),
    monitoring: loadMonitoringConfig(process.env),
    llm: loadLlmConfig(process.env),
    email: loadEmailConfig(process.env),
  });
  return loadedConfig;
}

export function getConfig() {
  if (!loadedConfig) throw new ConfigError('Configuration has not been loaded yet.');
  return loadedConfig;
}
