export function safeString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'object') {
    try {
      // Prevent prototype pollution or malicious toString bypasses
      if (Object.getPrototypeOf(value) === null) {
        return '';
      }
      return String(value);
    } catch {
      return '';
    }
  }
  return '';
}
