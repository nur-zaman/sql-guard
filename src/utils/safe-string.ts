/**
 * Safely converts an unknown value to a string.
 *
 * Mitigates risks associated with malicious `toString()` methods or
 * unexpected types (like objects with `null` prototype) causing
 * unhandled exceptions or prototype pollution.
 *
 * @param value The value to safely convert to a string.
 * @returns The safely stringified value.
 */
export function safeString(value: unknown): string {
  if (value == null) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }

  // For objects, arrays, etc. we avoid calling their potentially overridden toString
  // and instead use Object.prototype.toString or JSON.stringify if needed.
  try {
    return Object.prototype.toString.call(value);
  } catch (err) {
    return '[object Object]';
  }
}
