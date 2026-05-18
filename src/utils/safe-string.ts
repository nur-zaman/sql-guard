/**
 * Safely converts an unknown value to a string without invoking potentially malicious
 * or throwing .toString() methods on objects.
 *
 * @param val - The value to convert to a string
 * @returns A safe string representation of the value
 */
export function safeString(val: unknown): string {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';

  if (typeof val === 'string') return val;
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'symbol') return val.toString();
  if (typeof val === 'bigint') return val.toString();

  // For objects, arrays, and functions, avoid calling .toString() which might be overridden
  return Object.prototype.toString.call(val);
}
