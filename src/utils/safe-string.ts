export function safeString(val: unknown): string {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (typeof val === 'string') return val;
  try {
    return String(val);
  } catch {
    return '[Unstringable Object]';
  }
}
