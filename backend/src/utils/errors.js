// Errors carrying an HTTP status and a client-safe message. The centralized error
// handler exposes the message (and optional `details`) of these errors; all other
// errors stay generic.
export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Used by placeholders so that no endpoint pretends to succeed before it is implemented.
export class NotImplementedError extends AppError {
  constructor(feature) {
    super(501, 'NOT_IMPLEMENTED', `${feature} is not implemented yet.`);
    this.name = 'NotImplementedError';
  }
}
