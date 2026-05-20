/**
 * Safely converts an unknown value to a string.
 *
 * Defends against:
 * 1. Object.create(null) which has no toString method
 * 2. Malicious toString overrides that throw errors
 * 3. Symbol implicit coercion errors
 *
 * @param value The value to stringify
 * @returns A safe string representation
 */
export function safeString(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  if (typeof value === 'string') return value;

  try {
    return String(value);
  } catch {
    // Fallback for objects without toString or malicious toString that throws
    return '[Unserializable Value]';
  }
}
