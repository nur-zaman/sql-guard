/**
 * Safely converts an unknown value to a string.
 * Prevents unhandled TypeErrors when attempting to stringify objects
 * lacking a toString method (e.g., Object.create(null)).
 */
export function safeString(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  try {
    return String(value ?? '');
  } catch (err) {
    return '[Uncoercible value]';
  }
}
