/**
 * Safely converts an unknown value to a string.
 *
 * This utility defensively converts unknown values (such as those thrown
 * by an external resolver) to strings. It catches unhandled exceptions that
 * would occur if a pure JS consumer provided an object without a valid toString
 * method (like Object.create(null)).
 *
 * @param value - The unknown value to convert
 * @returns A safe string representation
 */
export function safeString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  try {
    return String(value);
  } catch (err) {
    return '[Uncoercible Value]';
  }
}
