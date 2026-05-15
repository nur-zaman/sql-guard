/**
 * Defensively convert unknown values to strings.
 * Mitigates prototype pollution and unhandled exceptions from malicious toString() methods.
 */
export function safeString(val: unknown): string {
  try {
    if (typeof val === 'string') {
      return val;
    }
    if (val === null || val === undefined) {
      return '';
    }
    if (typeof val === 'object' || typeof val === 'function') {
      return Object.prototype.toString.call(val);
    }
    return String(val);
  } catch {
    return '[Unknown]';
  }
}
