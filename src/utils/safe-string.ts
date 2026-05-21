export function safeString(val: unknown): string {
  try {
    return String(val);
  } catch {
    return '[unserializable]';
  }
}
