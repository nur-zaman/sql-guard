/**
 * Utility to defensively convert unknown values to strings.
 * Mitigates prototype pollution and unhandled exceptions from objects
 * lacking a prototype/toString method (e.g., `Object.create(null)`)
 * or malicious `toString()` implementations.
 */
export function safeString(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return 'undefined';
  }

  if (typeof value === 'string') {
    return value;
  }

  try {
    return String(value);
  } catch (err) {
    return '[Unserializable Value]';
  }
}
