export function safeString(val: unknown): string {
  if (typeof val === 'string') return val;
  if (val === null || val === undefined) return '';
  try {
    return String(val);
  } catch {
    return '';
  }
}
