export function safeString(val: unknown): string {
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return String(val);
  try {
    return String(val);
  } catch {
    return '[object Object]';
  }
}
