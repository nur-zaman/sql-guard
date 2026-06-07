export function safeString(val: unknown): string {
  if (typeof val === 'string') return val;
  if (val === null || val === undefined) return String(val);

  try {
    // If it has a custom toString, be careful
    if (typeof val === 'object') {
      const hasProto = Object.getPrototypeOf(val) !== null;
      if (!hasProto) {
        return '[Uncoercible Value]';
      }
      return String(val);
    }
    return String(val);
  } catch (e) {
    return '[Uncoercible Value]';
  }
}
