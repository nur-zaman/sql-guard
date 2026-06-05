/**
 * Safe Stringification Utility
 *
 * @module
 */

/**
 * Safely converts an unknown value to a string without throwing exceptions.
 * Mitigates prototype pollution and unhandled exceptions from objects lacking
 * a prototype (e.g., `Object.create(null)`) or malicious `toString()` implementations.
 *
 * @param value - The value to stringify
 * @returns The string representation of the value, or a fallback string if stringification fails
 */
export function safeString(value: unknown): string {
  try {
    return String(value);
  } catch (error) {
    return '[Uncoercible Value]';
  }
}
