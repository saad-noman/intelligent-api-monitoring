// Session tokens: random values handed to the client once. Only their SHA-256 hash is
// stored, so a leaked database does not expose usable tokens.
import { createHash, randomBytes } from 'node:crypto';

const TOKEN_BYTES = 32;

export function generateToken() {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

// Reads the token from an "Authorization: Bearer <token>" header, or returns null.
export function getBearerToken(req) {
  const header = req.get('authorization');
  if (!header) return null;

  const [scheme, token] = header.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}
