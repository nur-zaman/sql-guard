/**
 * Defensively convert an unknown value to a string.
 *
 * This utility prevents prototype pollution and unhandled exception vulnerabilities
 * caused by malicious input objects overriding the `toString()` method to throw
 * errors or execute arbitrary code. It only converts safe primitives and uses
 * a fallback mechanism for complex objects.
 *
 * @param value - The unknown value to stringify
 * @returns A safely stringified version of the value
 */
export function safeString(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  const type = typeof value;
  if (type === 'string') return value as string;
  if (type === 'number' || type === 'boolean' || type === 'bigint') {
    // These primitives have safe built-in string representations
    return (value as any).toString();
  }

  if (type === 'symbol') {
    return (value as symbol).toString();
  }

  // Prevent calling potentially malicious toString() on objects or functions.
  // Instead, return a safe generic representation.
  if (type === 'function') return '[object Function]';

  if (Array.isArray(value)) {
    return '[object Array]';
  }

  if (value instanceof Error) {
    // Errors might have been thrown by malicious code, but the Error constructor
    // itself sets the message property. We read it safely.
    return `Error: ${typeof value.message === 'string' ? value.message : 'Unknown error'}`;
  }

  return '[object Object]';
}
