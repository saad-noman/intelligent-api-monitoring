// Password hashing with Node's built-in scrypt. Stored format: "<salt>:<derivedKey>" (hex).
// Plain-text passwords are never stored or logged.
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

const SALT_BYTES = 16;
const KEY_LENGTH = 64;
const SEPARATOR = ':';

export async function hashPassword(password) {
  const salt = randomBytes(SALT_BYTES).toString('hex');
  const derivedKey = await scryptAsync(password, salt, KEY_LENGTH);
  return [salt, derivedKey.toString('hex')].join(SEPARATOR);
}

export async function verifyPassword(password, storedHash) {
  const [salt, storedKeyHex] = String(storedHash).split(SEPARATOR);
  if (!salt || !storedKeyHex) return false;

  const storedKey = Buffer.from(storedKeyHex, 'hex');
  const derivedKey = await scryptAsync(password, salt, storedKey.length);

  // Constant-time comparison avoids leaking how many bytes matched.
  return timingSafeEqual(storedKey, derivedKey);
}
