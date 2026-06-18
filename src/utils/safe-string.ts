export function safeString(val: unknown): string {
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';

  if (typeof val === 'object') {
    try {
      const result = String(val);
      // Catch bad [object Object] overrides if needed, but String() usually works
      // unless object is Object.create(null).
      // If it's Object.create(null), String() throws "TypeError: Cannot convert object to primitive value"
      return result;
    } catch {
      return '[object Object]';
    }
  }

  return String(val);
}
