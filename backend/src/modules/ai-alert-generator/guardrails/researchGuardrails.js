// Checks around web research: what the model may search for, and which fetched text may
// be shown to the model. Search queries leave the system, so they must be generic: the
// internal API name and personal or secret-looking data are never sent to a search engine.
// Fetched pages are untrusted, so their text is stripped, shortened, and dropped when it
// contains an injection attempt.
import { GuardrailError } from './guardrailError.js';
import { containsInjection } from './injectionDetector.js';
import { cleanText, escapeRegExp, htmlToText, truncate } from './textCleaner.js';

export const QUERY_LIMITS = { minLength: 3, maxLength: 150 };

const SENSITIVE_PATTERNS = [
  /\bhttps?:\/\/\S+/i, // URLs
  /\b[\w.+-]+@[\w-]+\.[\w.]+\b/, // email addresses
  /\b\d{1,3}(?:\.\d{1,3}){3}\b/, // IPv4 addresses
  /\b[A-Za-z0-9_-]{32,}\b/, // long tokens or keys
];

// Returns a cleaned, generic search query, or throws GuardrailError.
export function sanitizeSearchQuery(query, context) {
  if (typeof query !== 'string') throw new GuardrailError('query_not_text');
  const withoutApiName = query.replace(new RegExp(escapeRegExp(context.api_name), 'gi'), ' ');
  const cleaned = cleanText(withoutApiName);

  if (cleaned.length < QUERY_LIMITS.minLength) throw new GuardrailError('query_too_short');
  if (cleaned.length > QUERY_LIMITS.maxLength) throw new GuardrailError('query_too_long');
  if (containsInjection(cleaned)) throw new GuardrailError('query_injection');
  if (SENSITIVE_PATTERNS.some((pattern) => pattern.test(cleaned))) throw new GuardrailError('query_sensitive_data');
  return cleaned;
}

// Plain, shortened text of an HTML or text fragment; null when it is empty or carries
// an injection attempt (the caller then drops the source).
export function sanitizeSourceText(html, maxLength) {
  const text = htmlToText(html);
  if (text === '' || containsInjection(text)) return null;
  return truncate(text, maxLength);
}

// True when the URL uses HTTPS and its host is an allowed domain or a subdomain of one.
export function isAllowedUrl(url, allowedDomains) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;
  return allowedDomains.some((domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`));
}
