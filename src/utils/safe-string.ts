/**
 * Safely converts an unknown value to a string.
 *
 * This utility protects against malicious objects that define throwing
 * getters or `toString()` methods, which can bypass validation or cause
 * unhandled exceptions leading to denial of service.
 *
 * @param val - The value to convert to a string
 * @param fallback - The string to return if conversion fails (defaults to '')
 * @returns The converted string or the fallback
 */
export function safeString(val: unknown, fallback: string = ''): string {
  if (val === null || val === undefined) {
    return fallback;
  }

  if (typeof val === 'string') {
    return val;
  }

  try {
    const str = String(val);
    return str;
  } catch (err) {
    return fallback;
  }
}

/**
 * Safely extracts the error message from an unknown error object.
 *
 * @param err - The error object
 * @returns The safely extracted error message or a fallback string
 */
export function safeErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    try {
      // Accessing err.message might trigger a malicious getter
      return safeString(err.message, 'Unknown error');
    } catch {
      return 'Unknown error';
    }
  }
  return safeString(err, 'Unknown error');
}
