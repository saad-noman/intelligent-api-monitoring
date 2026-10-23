// CORS policy: only the explicitly configured frontend origins are allowed, with no
// wildcard fallback. Credential handling (cookies vs. bearer tokens) is intentionally
// left undecided until the authentication strategy is chosen.
export function createCorsOptions({ frontendOrigins }) {
  return {
    origin: [...frontendOrigins],
    methods: ['GET', 'POST', 'PATCH'],
    // TODO: Set `credentials: true` only if cookie-based authentication is adopted.
  };
}
