/**
 * Safely converts any value to a string, handling edge cases like
 * objects without prototypes or malicious toString methods.
 *
 * @param val The value to convert
 * @returns A safe string representation
 */
export function safeString(val: unknown): string {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';

  if (typeof val === 'string') return val;
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'boolean') return val ? 'true' : 'false';

  try {
    const str = String(val);
    // Even if String() succeeds, it might return something unexpected
    if (typeof str !== 'string') return '[unknown]';
    return str;
  } catch {
    return '[unstringable object]';
  }
}
