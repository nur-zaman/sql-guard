import { describe, test, expect } from 'bun:test';
import { safeString } from '../src/utils/safe-string';

describe('safeString DoS prevention', () => {
  test('returns [Unserializable] when converting Object.create(null)', () => {
    expect(safeString(Object.create(null))).toBe('[Unserializable]');
  });

  test('successfully converts normal strings and numbers', () => {
    expect(safeString('hello')).toBe('hello');
    expect(safeString(123)).toBe('123');
  });
});
