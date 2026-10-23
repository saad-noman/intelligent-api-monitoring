// Identifies the caller when valid credentials are present, but never rejects guests.
// Used by public endpoints (e.g. POST /monitor) whose behavior differs for guests and
// authenticated users.
//
// Contract for downstream handlers:
//   req.user === null          -> guest; results must not be persisted.
//   req.user === { id, ... }   -> authenticated; identity comes only from verified
//                                 server-side credentials, never from client-supplied IDs.
export function optionalAuth(req, res, next) {
  // TODO: Verify request credentials via authService once the authentication strategy is chosen.
  req.user = null;
  next();
}
