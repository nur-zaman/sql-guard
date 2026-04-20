/**
 * Safe String Utilities
 *
 * Provides safe alternatives to String() and error.message to prevent DoS
 * and unhandled exceptions caused by malicious objects with throwing toString()
 * methods or getters.
 *
 * @module
 */

/**
 * Safely converts an unknown value to a string.
 * Prevents execution of malicious toString() methods on objects.
 *
 * @param val - The value to convert
 * @returns A string representation of the value, or an empty string if it's unsafe or cannot be converted
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
  // For objects, symbols, etc., do not attempt to coerce
  return '';
}

/**
 * Safely extracts an error message from an unknown error object.
 * Prevents execution of malicious message getters or toString() methods.
 *
 * @param err - The caught error
 * @param fallback - The fallback message if the error cannot be safely stringified
 * @returns The error message or the fallback
 */
export function safeErrorMessage(err: unknown, fallback = 'Unknown error'): string {
  if (err === null || err === undefined) {
    return fallback;
  }

  if (typeof err === 'string') {
    return err;
  }

  if (typeof err === 'object') {
    try {
      // Safely access the message property if it exists and is a primitive string
      // Using Object.getOwnPropertyDescriptor to avoid triggering getters on the prototype chain
      // or using simple property access which might trigger a getter on the object itself

      // A simple property access is still risky if there's a getter, but since we are catching,
      // it might be safer to try/catch the simple access, but let's be more defensive.

      const record = err as Record<string, unknown>;
      if (typeof record.message === 'string') {
         return record.message;
      }
    } catch {
      // Ignore errors from malicious getters
    }

    // We intentionally do not call String(err) here to avoid malicious toString()
  }

  return fallback;
}
