/**
 * Safe string conversion utilities to prevent unhandled exceptions and DoS vulnerabilities
 * caused by objects with malicious or missing `toString()` methods or getters.
 */

export function safeString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  try {
    return String(value);
  } catch (err) {
    return '[Unserializable Value]';
  }
}

export function safeErrorMessage(error: unknown, defaultMessage = 'Unknown error'): string {
  if (error == null) {
    return defaultMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  try {
    const msg = String(error);
    if (msg === '[object Object]') {
      return defaultMessage;
    }
    return msg;
  } catch (err) {
    return defaultMessage;
  }
}
