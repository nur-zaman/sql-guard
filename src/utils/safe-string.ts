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

  // Guard against prototype pollution and unhandled exceptions from custom/malicious toString()
  try {
    const str = Object.prototype.toString.call(value);
    if (str === '[object Object]') {
      return ''; // Refuse to stringify arbitrary objects to avoid '[object Object]' or leaking internals
    }
    // Arrays will fall through here, but their stringification might be risky if elements have malicious toString
    // For our use cases, we mostly deal with simple types.
    if (Array.isArray(value)) {
      return ''; // For now, we'll avoid stringifying arrays too as it can trigger deep toStrings
    }

    return String(value);
  } catch {
    return '';
  }
}
