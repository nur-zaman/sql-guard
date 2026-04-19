export function safeString(val: unknown): string {
  if (typeof val === 'string') return val;
  try {
    return String(val);
  } catch {
    return '[Unconvertible value]';
  }
}

export function safeErrorMessage(val: unknown, defaultMessage = 'An error occurred'): string {
  if (typeof val === 'string') return val;
  try {
    if (val instanceof Error) {
      const msg = val.message;
      if (typeof msg === 'string' && msg.trim() !== '') {
        return msg;
      }
    }
    const msg = String(val);
    if (msg === '[object Object]' || msg.trim() === '') return defaultMessage;
    return msg;
  } catch {
    return defaultMessage;
  }
}
