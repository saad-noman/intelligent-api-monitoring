// Google web results through Serper (https://serper.dev), a Google Search API. Google's
// own Custom Search JSON API is closed to new projects and shuts down on 2027-01-01.
// The query is limited to the allowed domains with Google's site: operator so results
// come from reliable sources (the reference search also filters every URL afterwards).
// Implements: search(query) -> Promise<[{ title, url, snippet, details, score, accepted }]>.
import { requestJson } from '../httpClient.js';

const SEARCH_URL = 'https://google.serper.dev/search';

// "timeout" -> "timeout (site:a.com OR site:b.com)"
function restrictToDomains(query, domains) {
  return `${query} (${domains.map((domain) => `site:${domain}`).join(' OR ')})`;
}

function toReference(result) {
  return { title: result.title, url: result.link, snippet: result.snippet, details: null, score: null, accepted: null };
}

export function createSerperProvider({ apiKey, allowedDomains, maxResults, timeoutMs }) {
  return {
    name: 'google',
    async search(query) {
      const data = await requestJson(SEARCH_URL, {
        method: 'POST',
        headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: restrictToDomains(query, allowedDomains), num: maxResults }),
        timeoutMs,
      });
      return (data.organic ?? []).map(toReference);
    },
  };
}
