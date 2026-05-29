export function safeString(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint' || typeof value === 'symbol') {
    return String(value);
  }

  // Handle objects safely, avoiding toString() which might be missing or malicious
  try {
    return Object.prototype.toString.call(value);
  } catch {
    return '[unknown object]';
  }
}
