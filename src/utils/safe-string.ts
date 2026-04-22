export function safeString(val: unknown): string {
  if (typeof val === 'string') return val;
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';

  if (typeof val === 'object') {
    try {
      // Prevent prototype poisoning / unexpected toString behaviors by explicitly catching
      const str = String(val);
      if (str === '[object Object]') {
          // Attempt to JSON stringify for better object logging, but fallback safely
          try {
              return JSON.stringify(val);
          } catch {
              return '[object Object]';
          }
      }
      return str;
    } catch {
      return '[unstringifiable object]';
    }
  }

  try {
    return String(val);
  } catch {
    return '[unstringifiable value]';
  }
}

export function safeErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return safeString(err.message);
  }
  return safeString(err);
}
