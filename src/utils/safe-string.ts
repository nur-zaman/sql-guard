export function safeString(val: unknown): string {
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  return '';
}

export function safeErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return safeString(err.message);
  }
  return safeString(err);
}
