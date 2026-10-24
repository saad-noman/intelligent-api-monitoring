// Text helpers shared by the guardrails.

const HTML_TAG_PATTERN = /<[^>]*>/g;
const NAMED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const ENTITY_PATTERN = /&(#x[0-9a-f]+|#\d+|[a-z]+);/gi;

// Strips markdown symbols and collapses whitespace.
export function cleanText(value) {
  return String(value ?? '')
    .replace(/[*_`#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// "&lt;b&gt;" -> "<b>", "&#39;" -> "'". Unknown entities are left unchanged.
function decodeEntity(match, entity) {
  const lower = entity.toLowerCase();
  if (lower.startsWith('#x')) return String.fromCodePoint(parseInt(lower.slice(2), 16));
  if (lower.startsWith('#')) return String.fromCodePoint(Number(lower.slice(1)));
  return NAMED_ENTITIES[lower] ?? match;
}

// Converts an HTML fragment to plain text.
export function htmlToText(html) {
  return String(html ?? '')
    .replace(HTML_TAG_PATTERN, ' ')
    .replace(ENTITY_PATTERN, decodeEntity)
    .replace(/\s+/g, ' ')
    .trim();
}

// Cuts text to `maxLength` characters at a word boundary.
export function truncate(text, maxLength) {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${lastSpace > 0 ? cut.slice(0, lastSpace) : cut}...`;
}

export function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
