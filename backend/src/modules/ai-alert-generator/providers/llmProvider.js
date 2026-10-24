// OpenRouter chat-completions provider (OpenAI-compatible API).
// Implements: chat({ model, messages, tools, toolChoice }) -> Promise<{ content, toolCalls }>.
// The model is chosen per call so the agent can move to a fallback model. `tools` is
// optional; models without tool support are rejected by OpenRouter and the agent moves on.
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

function buildRequestBody({ model, messages, tools, toolChoice, maxTokens, reasoningEffort }) {
  const toolFields = tools ? { tools, tool_choice: toolChoice } : {};
  return {
    model,
    messages,
    ...toolFields,
    max_tokens: maxTokens,
    temperature: TEMPERATURE,
    // How much reasoning models (such as gpt-oss) think before answering (LLM_REASONING_EFFORT).
    reasoning: { effort: reasoningEffort },
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

// Returns the reply text (null when the model only called tools) and its tool calls.
async function readMessage(response) {
  if (response.status === HTTP_TOO_MANY_REQUESTS) throw new LlmProviderError('rate_limited', response.status);
  if (!response.ok) throw new LlmProviderError('http_error', response.status);

  const data = await response.json().catch(() => null);
  const message = data?.choices?.[0]?.message;
  const content = typeof message?.content === 'string' && message.content.trim() !== '' ? message.content : null;
  const toolCalls = Array.isArray(message?.tool_calls) ? message.tool_calls : [];
  if (content === null && toolCalls.length === 0) throw new LlmProviderError('empty_response');
  return { content, toolCalls };
}

const TEMPORARY_REASONS = ['timeout', 'network_error'];
const SERVER_ERROR_MIN = 500;

// True for errors worth retrying on the same model: rate limits, timeouts, provider outages.
export function isTemporaryError(error) {
  if (!(error instanceof LlmProviderError)) return false;
  if (error.status === HTTP_TOO_MANY_REQUESTS || error.status >= SERVER_ERROR_MIN) return true;
  return TEMPORARY_REASONS.includes(error.reason);
}

export function createLlmProvider({ apiKey, baseUrl, timeoutMs, maxTokens, reasoningEffort }) {
  return {
    async chat({ model, messages, tools, toolChoice }) {
      const response = await postWithTimeout(
        `${baseUrl}/chat/completions`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(buildRequestBody({ model, messages, tools, toolChoice, maxTokens, reasoningEffort })),
        },
        timeoutMs,
      );
      return readMessage(response);
    },
  };
}
