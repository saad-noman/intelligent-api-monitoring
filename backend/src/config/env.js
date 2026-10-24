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
// Learned latency baseline per API (see utils/latencyThreshold.js for the sources):
// - outlier rule: median + 2.5 x MAD (Leys et al., 2013, Journal of Experimental Social Psychology);
// - 1 s / 10 s user-perception limits (Nielsen Norman Group, "Response Times: The 3 Important Limits");
// - minimum sample size and window are operational choices, not research values.
const DEFAULT_LATENCY_MAD_MULTIPLIER = 2.5;
const DEFAULT_LATENCY_FLOW_LIMIT_MS = 1000;
const DEFAULT_LATENCY_ATTENTION_LIMIT_MS = 10000;
const DEFAULT_LATENCY_BASELINE_MIN_SAMPLES = 20;
const DEFAULT_LATENCY_BASELINE_WINDOW = 200;
const DEFAULT_FAILED_STATUS_MIN = 400;
const DEFAULT_MAX_BATCH_SIZE = 100;

const DEFAULT_LLM_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_LLM_MODEL = 'openai/gpt-oss-20b';
// Each call carries search results and the model reasons before answering, so it needs
// more time and tokens than a single short completion.
const DEFAULT_LLM_TIMEOUT_MS = 45000;
const DEFAULT_LLM_MAX_TOKENS = 4000;
const DEFAULT_LLM_RETRIES = 1;
const DEFAULT_LLM_RETRY_DELAY_MS = 1500;
const DEFAULT_LLM_REPAIR_ATTEMPTS = 2;
const LLM_REASONING_EFFORTS = ['low', 'medium', 'high'];
const DEFAULT_LLM_REASONING_EFFORT = 'medium';

// Web research defaults: Stack Exchange needs no key; Google results need SERPER_API_KEY.
// Only links on these domains (or their subdomains) are ever shown to the model or the user.
const DEFAULT_RESEARCH_STACKEXCHANGE_SITES = 'stackoverflow,serverfault';
const DEFAULT_RESEARCH_ALLOWED_DOMAINS = [
  'stackoverflow.com',
  'serverfault.com',
  'superuser.com',
  'stackexchange.com',
  'developer.mozilla.org',
  'learn.microsoft.com',
  'cloud.google.com',
  'docs.aws.amazon.com',
].join(',');
// Latency-threshold research (Google via Serper only): sources that publish response-time
// guidance — UX research, web performance, SRE, and cloud-provider documentation.
const DEFAULT_THRESHOLD_RESEARCH_DOMAINS = [
  'nngroup.com',
  'web.dev',
  'developers.google.com',
  'sre.google',
  'cloud.google.com',
  'docs.aws.amazon.com',
  'aws.amazon.com',
  'learn.microsoft.com',
  'developer.mozilla.org',
].join(',');
// Sanity bounds for a researched threshold (a value outside them is rejected, not clamped).
const DEFAULT_THRESHOLD_MIN_MS = 50;
const DEFAULT_THRESHOLD_MAX_MS = 60000;
const DEFAULT_RESEARCH_MAX_SEARCHES = 2;
const DEFAULT_RESEARCH_MAX_RESULTS = 4;
const DEFAULT_RESEARCH_TIMEOUT_MS = 8000;
const DEFAULT_RESEARCH_CACHE_TTL_MINUTES = 60;
const DOMAIN_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

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

// Reads an optional decimal number variable, falling back to `defaultValue` when unset.
function parseNumber(name, value, defaultValue, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (value === undefined || value.trim() === '') return defaultValue;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new ConfigError(`${name} must be a number between ${min} and ${max}.`);
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

// Settings for the learned, per-API latency threshold.
function loadLatencyConfig(env) {
  return Object.freeze({
    madMultiplier: parseNumber('LATENCY_MAD_MULTIPLIER', env.LATENCY_MAD_MULTIPLIER, DEFAULT_LATENCY_MAD_MULTIPLIER, {
      min: 1,
      max: 10,
    }),
    flowLimitMs: parseInteger('LATENCY_FLOW_LIMIT_MS', env.LATENCY_FLOW_LIMIT_MS, DEFAULT_LATENCY_FLOW_LIMIT_MS),
    attentionLimitMs: parseInteger(
      'LATENCY_ATTENTION_LIMIT_MS',
      env.LATENCY_ATTENTION_LIMIT_MS,
      DEFAULT_LATENCY_ATTENTION_LIMIT_MS,
    ),
    baselineMinSamples: parseInteger(
      'LATENCY_BASELINE_MIN_SAMPLES',
      env.LATENCY_BASELINE_MIN_SAMPLES,
      DEFAULT_LATENCY_BASELINE_MIN_SAMPLES,
      { min: 5 },
    ),
    baselineWindow: parseInteger('LATENCY_BASELINE_WINDOW', env.LATENCY_BASELINE_WINDOW, DEFAULT_LATENCY_BASELINE_WINDOW, {
      min: 5,
      max: 5000,
    }),
  });
}

function loadMonitoringConfig(env) {
  return Object.freeze({
    highResponseTimeMs: parseInteger('HIGH_RESPONSE_TIME_MS', env.HIGH_RESPONSE_TIME_MS, DEFAULT_HIGH_RESPONSE_TIME_MS),
    failedStatusMin: parseInteger('FAILED_STATUS_MIN', env.FAILED_STATUS_MIN, DEFAULT_FAILED_STATUS_MIN, {
      min: 100,
      max: 599,
    }),
    maxBatchSize: parseInteger('MAX_BATCH_SIZE', env.MAX_BATCH_SIZE, DEFAULT_MAX_BATCH_SIZE),
    latency: loadLatencyConfig(env),
    responseSchemas: Object.freeze(parseResponseSchemas(parseOptionalString(env.RESPONSE_SCHEMAS_FILE))),
  });
}

// Primary model first, then the optional comma-separated fallback models, without duplicates.
function parseModelList(primary, fallbacks) {
  const models = [parseOptionalString(primary) ?? DEFAULT_LLM_MODEL, ...parseCommaList(fallbacks)];
  return [...new Set(models)];
}

function parseReasoningEffort(value) {
  const effort = parseOptionalString(value)?.toLowerCase() ?? DEFAULT_LLM_REASONING_EFFORT;
  if (!LLM_REASONING_EFFORTS.includes(effort)) {
    throw new ConfigError(`LLM_REASONING_EFFORT must be one of: ${LLM_REASONING_EFFORTS.join(', ')}.`);
  }
  return effort;
}

// The API key is required: every alert is written by the AI analysis.
function loadLlmConfig(env) {
  const apiKey = parseOptionalString(env.OPENROUTER_API_KEY);
  if (!apiKey) throw new ConfigError('OPENROUTER_API_KEY is required: alerts are written by the AI analysis.');

  return Object.freeze({
    apiKey,
    baseUrl: (parseOptionalString(env.OPENROUTER_BASE_URL) ?? DEFAULT_LLM_BASE_URL).replace(/\/+$/, ''),
    // Tried in order until one returns a valid analysis.
    models: Object.freeze(parseModelList(env.OPENROUTER_MODEL, env.OPENROUTER_FALLBACK_MODELS)),
    timeoutMs: parseInteger('LLM_TIMEOUT_MS', env.LLM_TIMEOUT_MS, DEFAULT_LLM_TIMEOUT_MS),
    maxTokens: parseInteger('LLM_MAX_TOKENS', env.LLM_MAX_TOKENS, DEFAULT_LLM_MAX_TOKENS),
    // Extra attempts per model after a temporary error (rate limit, timeout, provider 5xx).
    retries: parseInteger('LLM_RETRIES', env.LLM_RETRIES, DEFAULT_LLM_RETRIES, { min: 0, max: 5 }),
    retryDelayMs: parseInteger('LLM_RETRY_DELAY_MS', env.LLM_RETRY_DELAY_MS, DEFAULT_LLM_RETRY_DELAY_MS, { min: 0 }),
    // Times a model is asked to correct an answer that failed a guardrail.
    repairAttempts: parseInteger('LLM_REPAIR_ATTEMPTS', env.LLM_REPAIR_ATTEMPTS, DEFAULT_LLM_REPAIR_ATTEMPTS, {
      min: 0,
      max: 5,
    }),
    reasoningEffort: parseReasoningEffort(env.LLM_REASONING_EFFORT),
  });
}

// "Stackoverflow.com, docs.aws.amazon.com" -> ["stackoverflow.com", "docs.aws.amazon.com"]
function parseDomains(name, value) {
  const domains = parseCommaList(value).map((domain) => domain.toLowerCase());
  if (domains.length === 0 || !domains.every((domain) => DOMAIN_PATTERN.test(domain))) {
    throw new ConfigError(`${name} must be a comma-separated list of domains such as stackoverflow.com.`);
  }
  return domains;
}

// Research is on by default (Stack Exchange needs no key); RESEARCH_ENABLED=false turns it off.
function loadResearchConfig(env) {
  return Object.freeze({
    enabled: env.RESEARCH_ENABLED?.trim() !== 'false',
    stackExchange: Object.freeze({
      sites: Object.freeze(parseCommaList(env.STACKEXCHANGE_SITES ?? DEFAULT_RESEARCH_STACKEXCHANGE_SITES)),
      apiKey: parseOptionalString(env.STACKEXCHANGE_API_KEY),
    }),
    serperApiKey: parseOptionalString(env.SERPER_API_KEY),
    allowedDomains: Object.freeze(
      parseDomains('RESEARCH_ALLOWED_DOMAINS', env.RESEARCH_ALLOWED_DOMAINS ?? DEFAULT_RESEARCH_ALLOWED_DOMAINS),
    ),
    // Tool calls the model may make per analysis, and results returned per call.
    maxSearches: parseInteger('RESEARCH_MAX_SEARCHES', env.RESEARCH_MAX_SEARCHES, DEFAULT_RESEARCH_MAX_SEARCHES, { max: 5 }),
    maxResults: parseInteger('RESEARCH_MAX_RESULTS', env.RESEARCH_MAX_RESULTS, DEFAULT_RESEARCH_MAX_RESULTS, { max: 10 }),
    timeoutMs: parseInteger('RESEARCH_TIMEOUT_MS', env.RESEARCH_TIMEOUT_MS, DEFAULT_RESEARCH_TIMEOUT_MS),
    cacheTtlMs:
      parseInteger('RESEARCH_CACHE_TTL_MINUTES', env.RESEARCH_CACHE_TTL_MINUTES, DEFAULT_RESEARCH_CACHE_TTL_MINUTES) *
      60 * 1000,
    threshold: loadThresholdResearchConfig(env),
  });
}

// The AI looks up a response-time threshold on Google (needs SERPER_API_KEY);
// THRESHOLD_RESEARCH_ENABLED=false turns it off and the learned/SLO threshold is used.
function loadThresholdResearchConfig(env) {
  return Object.freeze({
    enabled: env.THRESHOLD_RESEARCH_ENABLED?.trim() !== 'false',
    allowedDomains: Object.freeze(
      parseDomains('THRESHOLD_RESEARCH_DOMAINS', env.THRESHOLD_RESEARCH_DOMAINS ?? DEFAULT_THRESHOLD_RESEARCH_DOMAINS),
    ),
    minMs: parseInteger('THRESHOLD_MIN_MS', env.THRESHOLD_MIN_MS, DEFAULT_THRESHOLD_MIN_MS),
    maxMs: parseInteger('THRESHOLD_MAX_MS', env.THRESHOLD_MAX_MS, DEFAULT_THRESHOLD_MAX_MS),
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
    research: loadResearchConfig(process.env),
    email: loadEmailConfig(process.env),
  });
  return loadedConfig;
}

export function getConfig() {
  if (!loadedConfig) throw new ConfigError('Configuration has not been loaded yet.');
  return loadedConfig;
}
