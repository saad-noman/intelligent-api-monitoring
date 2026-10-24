// CORS policy: only the explicitly configured frontend origins are allowed, with no
// wildcard fallback. Authentication uses bearer tokens in the Authorization header,
// so cookies (and `credentials: true`) are not needed.
export function createCorsOptions({ frontendOrigins }) {
  return {
    origin: [...frontendOrigins],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
}
