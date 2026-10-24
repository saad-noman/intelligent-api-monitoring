// OpenRouter chat-completions provider (OpenAI-compatible API).
// Implements: generate({ model, system, prompt }) -> Promise<string>.
// The model is chosen per call so the agent can move to a fallback model.
// The API key is only placed in the Authorization header; it is never logged or returned.

const TEMPERATURE = 0.2;
const HTTP_TOO_MANY_REQUESTS = 429;

// `reason` is a short, secret-free label used for logging and retry decisions.
export class LlmProviderError extends Error {
  constructor(reason, status) {
    super(`LLM provider error: ${reason}${status ? ` (HTTP ${status})` : ''}`);
    this.name = 'LlmProviderError';
    this.reason = status ? `${reason}_${status}` : reason;
    this.status = status;
  }
}

function buildRequestBody({ model, system, prompt, maxTokens }) {
  return {
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ],
    max_tokens: maxTokens,
    temperature: TEMPERATURE,
    // Keeps reasoning models (such as gpt-oss) from spending the token budget on reasoning.
    reasoning: { effort: 'low' },
  };
}

async function postWithTimeout(url, options, timeoutMs) {
  try {
    return await fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
  } catch (error) {
    const isTimeout = error.name === 'TimeoutError' || error.name === 'AbortError';
    throw new LlmProviderError(isTimeout ? 'timeout' : 'network_error');
  }
}

async function readContent(response) {
  if (response.status === HTTP_TOO_MANY_REQUESTS) throw new LlmProviderError('rate_limited', response.status);
  if (!response.ok) throw new LlmProviderError('http_error', response.status);

  const data = await response.json().catch(() => null);
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || content.trim() === '') throw new LlmProviderError('empty_response');
  return content;
}

const TEMPORARY_REASONS = ['timeout', 'network_error'];
const SERVER_ERROR_MIN = 500;

// True for errors worth retrying on the same model: rate limits, timeouts, provider outages.
export function isTemporaryError(error) {
  if (!(error instanceof LlmProviderError)) return false;
  if (error.status === HTTP_TOO_MANY_REQUESTS || error.status >= SERVER_ERROR_MIN) return true;
  return TEMPORARY_REASONS.includes(error.reason);
}

// Returns null when no API key is configured.
export function createLlmProvider({ apiKey, baseUrl, timeoutMs, maxTokens }) {
  if (!apiKey) return null;

  return {
    async generate({ model, system, prompt }) {
      const response = await postWithTimeout(
        `${baseUrl}/chat/completions`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(buildRequestBody({ model, system, prompt, maxTokens })),
        },
        timeoutMs,
      );
      return readContent(response);
    },
  };
}
