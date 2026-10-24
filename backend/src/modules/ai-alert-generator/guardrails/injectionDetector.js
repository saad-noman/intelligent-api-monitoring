// Detects prompt-injection attempts: text that tries to change the model's instructions,
// impersonate a chat role, or extract the prompt or secrets. Used on submitted data, on
// text fetched from the web, and on the model's own answer (an echoed instruction means
// the model was steered by its input).

const INJECTION_PATTERNS = [
  // "ignore all previous instructions", "disregard the rules above"
  /\b(ignore|disregard|forget|override)\b.{0,40}\b(instructions?|rules?|prompts?|guidelines?)\b/i,
  // "system prompt", "developer message"
  /\b(system|developer)\s+(prompt|message|instructions?)\b/i,
  // Role-play takeovers.
  /\b(you are now|pretend to be|from now on you)\b/i,
  // Chat-template role markers such as <system>, [INST], <|im_start|>.
  /<\/?(system|assistant|user|tool)>|\[\/?(INST|SYS)\]|<\|[a-z_]+\|>/i,
  // Requests to reveal the prompt or secrets.
  /\b(reveal|print|show|repeat|leak)\b.{0,30}\b(prompt|instructions?|api[ _-]?key|secrets?|passwords?|tokens?)\b/i,
];

// Control characters other than tab, newline, and carriage return.
const CONTROL_CHAR_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

export function containsInjection(text) {
  const value = String(text ?? '');
  return CONTROL_CHAR_PATTERN.test(value) || INJECTION_PATTERNS.some((pattern) => pattern.test(value));
}
