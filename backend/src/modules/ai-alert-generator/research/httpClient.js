// JSON-over-HTTP helper shared by the research providers. API keys stay in headers or
// query strings and are never logged or included in errors.

// `reason` is a short, secret-free label used for logging.
export class ResearchError extends Error {
  constructor(reason, status) {
    super(`Research error: ${reason}${status ? ` (HTTP ${status})` : ''}`);
    this.name = 'ResearchError';
    this.reason = status ? `${reason}_${status}` : reason;
  }
}

async function send(url, { method, headers, body, timeoutMs }) {
  try {
    return await fetch(url, { method, headers, body, signal: AbortSignal.timeout(timeoutMs) });
  } catch (error) {
    const isTimeout = error.name === 'TimeoutError' || error.name === 'AbortError';
    throw new ResearchError(isTimeout ? 'timeout' : 'network_error');
  }
}

export async function requestJson(url, { method = 'GET', headers = {}, body, timeoutMs }) {
  const response = await send(url, { method, headers, body, timeoutMs });
  if (!response.ok) throw new ResearchError('http_error', response.status);

  const data = await response.json().catch(() => null);
  if (data === null) throw new ResearchError('invalid_json');
  return data;
}
