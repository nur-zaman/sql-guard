/**
 * Safely converts an unknown value to a string, preventing unhandled exceptions
 * from objects lacking a `toString` method (e.g., `Object.create(null)`).
 */
export function safeString(value: unknown): string {
  try {
    return String(value);
  } catch (error) {
    return '[Unserializable]';
  }
}
