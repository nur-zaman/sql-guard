export function safeString(value: unknown): string {
  try {
    return String(value);
  } catch (err) {
    return '[unknown]';
  }
}
