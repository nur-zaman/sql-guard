export function safeString(val: unknown): string {
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';

  // Prevent calling malicious toString methods
  if (typeof val === 'object') {
    try {
      return Object.prototype.toString.call(val);
    } catch {
      return '[object Object]';
    }
  }

  return '';
}
