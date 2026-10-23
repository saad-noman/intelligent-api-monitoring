// Minimal console logger. Callers must never pass passwords, tokens, authorization
// headers, request bodies, or other sensitive user data.

const CREDENTIALS_IN_URI = /(mongodb(?:\+srv)?:\/\/)[^@\s/]+@/gi;

// Strips credentials from any MongoDB connection string embedded in a message.
export function redact(message) {
  return String(message).replace(CREDENTIALS_IN_URI, '$1***@');
}

function write(level, message) {
  const line = `${new Date().toISOString()} ${level.toUpperCase()} ${redact(message)}`;
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (message) => write('info', message),
  warn: (message) => write('warn', message),
  error: (message) => write('error', message),
};
