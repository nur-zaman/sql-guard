/**
 * Safely converts an unknown value to a string, preventing unhandled exceptions
 * from objects lacking a prototype/toString method (e.g., Object.create(null))
 * or malicious toString() implementations.
 *
 * @param value - The value to convert to a string
 * @returns The stringified value, or '' if conversion fails
 */
export function safeString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  try {
    return String(value);
  } catch (err) {
    return '';
  }
}
