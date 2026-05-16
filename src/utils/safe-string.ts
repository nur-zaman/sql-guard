export function safeString(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value === null || value === undefined) {
    return '';
  }
  try {
    if (typeof value === 'object' || typeof value === 'function') {
      return Object.prototype.toString.call(value);
    }
    return String(value);
  } catch {
    return '[Uncoercible Value]';
  }
}
