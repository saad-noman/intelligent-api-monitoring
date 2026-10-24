// Searches one Stack Exchange site (e.g. stackoverflow, serverfault) through the official
// Stack Exchange API v2.3. Only answered questions are returned, each with its accepted
// answer when it has one. The API key is optional; it raises the daily request quota.
// Implements: search(query) -> Promise<[{ title, url, snippet, details, score, accepted }]>.
import { requestJson } from '../httpClient.js';

const API_BASE_URL = 'https://api.stackexchange.com/2.3';
// Built-in API filter that adds the `body` field to questions and answers.
const BODY_FILTER = 'withbody';

function buildUrl(path, params, apiKey) {
  const url = new URL(`${API_BASE_URL}${path}`);
  const keyParam = apiKey ? { key: apiKey } : {};
  url.search = new URLSearchParams({ ...params, filter: BODY_FILTER, ...keyParam }).toString();
  return url;
}

async function searchQuestions(query, { site, apiKey, maxResults, timeoutMs }) {
  const params = { q: query, site, order: 'desc', sort: 'relevance', answers: '1', pagesize: String(maxResults) };
  const data = await requestJson(buildUrl('/search/advanced', params, apiKey), { timeoutMs });
  return data.items ?? [];
}

// Map of answer_id -> answer body for the questions' accepted answers (one request).
async function fetchAcceptedAnswers(questions, { site, apiKey, timeoutMs }) {
  const answerIds = questions.map((question) => question.accepted_answer_id).filter(Boolean);
  if (answerIds.length === 0) return new Map();

  const data = await requestJson(buildUrl(`/answers/${answerIds.join(';')}`, { site }, apiKey), { timeoutMs });
  return new Map((data.items ?? []).map((answer) => [answer.answer_id, answer.body]));
}

function toReference(question, acceptedAnswers) {
  return {
    title: question.title,
    url: question.link,
    snippet: question.body,
    details: acceptedAnswers.get(question.accepted_answer_id) ?? null,
    score: question.score,
    accepted: Boolean(question.accepted_answer_id),
  };
}

export function createStackExchangeProvider(settings) {
  return {
    name: `stackexchange:${settings.site}`,
    async search(query) {
      const questions = await searchQuestions(query, settings);
      const acceptedAnswers = await fetchAcceptedAnswers(questions, settings);
      return questions.map((question) => toReference(question, acceptedAnswers));
    },
  };
}
