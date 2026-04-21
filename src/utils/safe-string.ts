/**
 * Safe string conversion utilities to prevent unhandled exceptions and DoS vulnerabilities
 * caused by malicious toString() methods or objects without prototypes.
 */

export function safeString(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  try {
    return String(value);
  } catch {
    return '[Unserializable Object]';
  }
}

export function safeErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    try {
      if (err.message) {
        return safeString(err.message);
      }
      return 'Unknown error';
    } catch {
      return '[Unserializable Error Message]';
    }
  }

  return safeString(err);
}
