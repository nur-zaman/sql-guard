/**
 * Safely converts an unknown value to a string.
 * Mitigates prototype pollution and unhandled exceptions from objects
 * lacking a prototype/toString method (e.g., Object.create(null)) or
 * malicious toString() implementations.
 *
 * @param value The value to convert
 * @returns A string representation of the value, or empty string on failure
 */
export function safeString(value: unknown): string {
  try {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (typeof value === 'object') {
      // Check if it has a safe toString method
      if (typeof (value as any).toString === 'function') {
        const result = (value as any).toString();
        return typeof result === 'string' ? result : '';
      }
    }
    return '';
  } catch {
    return '';
  }
}
