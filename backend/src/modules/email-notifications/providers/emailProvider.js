// Boundary for a future email-delivery service. No provider or credentials have been selected.
// A concrete provider will implement: send({ to, subject, text }) -> Promise<void>.
import { NotImplementedError } from '../../../utils/errors.js';

export function createEmailProvider() {
  throw new NotImplementedError('email-notifications provider');
}
