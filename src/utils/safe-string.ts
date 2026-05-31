/**
 * Safely converts an unknown value to a string.
 * This mitigates prototype pollution and unhandled exceptions from malicious `toString()` methods.
 *
 * @param value The value to convert to a string.
 * @returns The stringified value, or a safe fallback if conversion fails.
 */
export function safeString(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint' || typeof value === 'symbol') {
    return String(value);
  }

  // At this point, value is an object or function
  try {
    // Attempt standard string conversion, but wrap in try-catch
    // because objects like Object.create(null) throw an error
    // when String() is called on them.
    return String(value);
  } catch (err) {
    return '[Uncoercible value]';
  }
}
