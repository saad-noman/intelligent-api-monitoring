// Small in-memory cache whose entries expire after `ttlMs`. When full, the oldest entry
// is removed. Used so repeated searches (common in one batch) are not sent again.
export function createTtlCache({ ttlMs, maxEntries }) {
  const entries = new Map();

  return {
    get(key) {
      const entry = entries.get(key);
      if (!entry) return undefined;
      if (entry.expiresAt <= Date.now()) {
        entries.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key, value) {
      if (entries.size >= maxEntries) entries.delete(entries.keys().next().value);
      entries.set(key, { value, expiresAt: Date.now() + ttlMs });
    },
  };
}
