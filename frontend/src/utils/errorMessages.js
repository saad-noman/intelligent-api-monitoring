// Turns technical request errors into messages written for people.
// Codes match the backend's { error: { code } } responses, plus two client-side codes.
export const ERROR_CODES = {
  network: 'NETWORK_ERROR',
  configMissing: 'CONFIG_MISSING',
  validation: 'VALIDATION_ERROR',
  invalidJson: 'INVALID_JSON',
  payloadTooLarge: 'PAYLOAD_TOO_LARGE',
  invalidCredentials: 'INVALID_CREDENTIALS',
  emailTaken: 'EMAIL_TAKEN',
  authRequired: 'AUTHENTICATION_REQUIRED',
  accountNotFound: 'ACCOUNT_NOT_FOUND',
  notFound: 'NOT_FOUND',
  alertNotFound: 'ALERT_NOT_FOUND',
  activityNotFound: 'ACTIVITY_NOT_FOUND',
  notImplemented: 'NOT_IMPLEMENTED',
};

const FRIENDLY_MESSAGES = {
  [ERROR_CODES.network]: "We couldn't reach the server. Please check your connection and try again.",
  [ERROR_CODES.configMissing]: "The app isn't connected to a server yet. Please try again later.",
  [ERROR_CODES.invalidCredentials]: 'The email or password is incorrect.',
  [ERROR_CODES.emailTaken]: 'An account with this email already exists. Try logging in instead.',
  [ERROR_CODES.authRequired]: 'Please log in to continue.',
  [ERROR_CODES.accountNotFound]: "We couldn't find your account. Please log in again.",
  [ERROR_CODES.notFound]: "We couldn't find what you were looking for.",
  [ERROR_CODES.activityNotFound]: 'This history entry no longer exists. Refresh the page to see the current history.',
  [ERROR_CODES.alertNotFound]: 'No saved alert was found with this ID. Guest results are not saved.',
  [ERROR_CODES.notImplemented]: "This feature isn't available yet. Please check back later.",
};

const SERVER_ERROR_MESSAGE = 'Something went wrong on our side. Please try again in a moment.';
const DEFAULT_MESSAGE = 'Something went wrong. Please try again.';

// Codes whose backend message is already written for people (e.g. "Email is required.").
const PASS_THROUGH_CODES = [ERROR_CODES.validation, ERROR_CODES.invalidJson, ERROR_CODES.payloadTooLarge];

// Codes that, on a read request, only mean there is nothing to show yet.
const NO_DATA_CODES = [ERROR_CODES.notFound, ERROR_CODES.notImplemented];

export function toFriendlyMessage(error) {
  const code = error?.code;
  if (PASS_THROUGH_CODES.includes(code) && error.message) return error.message;
  if (FRIENDLY_MESSAGES[code]) return FRIENDLY_MESSAGES[code];
  if (error?.status >= 500) return SERVER_ERROR_MESSAGE;
  return DEFAULT_MESSAGE;
}

export function isNoDataError(error) {
  return NO_DATA_CODES.includes(error?.code);
}
