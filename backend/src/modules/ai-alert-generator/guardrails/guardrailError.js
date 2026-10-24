// Raised when a guardrail check fails. `reason` is a short label used for logging;
// `detail` explains the problem in plain words, so the model can be asked to fix it.
export class GuardrailError extends Error {
  constructor(reason, detail = reason) {
    super(reason);
    this.name = 'GuardrailError';
    this.reason = reason;
    this.detail = detail;
  }
}
