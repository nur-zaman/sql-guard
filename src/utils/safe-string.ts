/**
 * Safely converts an unknown value to a string without risking type confusion
 * or unhandled exceptions from objects lacking a prototype/toString method
 * (e.g., Object.create(null)) or malicious toString() implementations.
 */
export function safeString(val: unknown): string {
  if (val === null || val === undefined) {
    return '';
  }

  if (typeof val === 'string') {
    return val;
  }

  if (typeof val === 'number' || typeof val === 'boolean') {
    return String(val);
  }

  // Prevent unhandled exceptions from Object.create(null) or malicious toString
  try {
    return String(val);
  } catch {
    return '[object Object]';
  }
}
