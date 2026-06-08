/**
 * Safe String Utility
 *
 * @module
 */

/**
 * Safely converts an unknown value to a string without throwing an exception.
 * Used to prevent unhandled TypeErrors when converting objects without a valid toString method.
 *
 * @param value - The value to convert
 * @returns The string representation, or '[uncoercible]' if conversion throws
 */
export function safeString(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  try {
    return String(value);
  } catch (e) {
    return '[uncoercible]';
  }
}
