/**
 * Safely converts an unknown value to a string, preventing unhandled exceptions
 * from objects lacking a prototype/toString method or malicious toString() implementations.
 *
 * @param value The value to stringify
 * @returns The stringified value, or a safe fallback
 */
export function safeString(value: unknown): string {
  if (value === null || value === undefined) {
    return String(value);
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint' || typeof value === 'symbol') {
    return String(value);
  }

  try {
    return String(value);
  } catch (err) {
    return '[Unstringifiable Object]';
  }
}
