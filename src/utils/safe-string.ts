/**
 * Safely converts an unknown value to a string.
 * Mitigates unhandled exceptions from malicious or improperly implemented
 * toString() methods, preventing Denial of Service (DoS) crashes.
 *
 * @param value - The unknown value to convert to a string
 * @returns The string representation, or a fallback if conversion fails
 */
export function safeString(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return 'undefined';
  }
  try {
    return String(value);
  } catch (error) {
    return '[Uncoercible Value]';
  }
}
