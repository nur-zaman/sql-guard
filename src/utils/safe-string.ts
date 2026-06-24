/**
 * Safely converts an unknown value to a string.
 *
 * Prevents unhandled TypeErrors from objects lacking a toString method
 * (e.g., Object.create(null)) which could otherwise crash the process.
 */
export function safeString(value: unknown): string {
  try {
    return String(value);
  } catch {
    return '[Unstringable object]';
  }
}
