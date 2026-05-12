export function safeString(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return 'undefined';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return value.toString();
  }
  if (typeof value === 'symbol') {
    return value.toString();
  }

  // Prevent prototype pollution or malicious toString crashes
  try {
    return Object.prototype.toString.call(value);
  } catch (err) {
    return '[object Object]';
  }
}
