// Extracts the JSON object from an LLM reply. Models sometimes wrap JSON in code fences
// or add a sentence around it, so the outermost { ... } is parsed.
import { GuardrailError } from '../guardrails/index.js';

export function parseAnalysis(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new GuardrailError('no_json_in_output');

  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new GuardrailError('invalid_json_in_output');
  }
}
