import { describe, test, expect } from 'bun:test';
import { safeString } from '../src/utils/safe-string';

describe('safeString', () => {
  test('returns string as-is', () => {
    expect(safeString('hello')).toBe('hello');
    expect(safeString('')).toBe('');
  });

  test('returns empty string for null and undefined', () => {
    expect(safeString(null)).toBe('');
    expect(safeString(undefined)).toBe('');
  });

  test('converts numbers to strings', () => {
    expect(safeString(123)).toBe('123');
    expect(safeString(0)).toBe('0');
    expect(safeString(-1.5)).toBe('-1.5');
  });

  test('converts booleans to strings', () => {
    expect(safeString(true)).toBe('true');
    expect(safeString(false)).toBe('false');
  });

  test('converts safe objects to strings', () => {
    expect(safeString({})).toBe('[object Object]');
    expect(safeString([1, 2, 3])).toBe('1,2,3');
  });

  test('returns empty string when toString throws', () => {
    const malicious = {
      toString() {
        throw new Error('Malicious code executed!');
      }
    };
    expect(safeString(malicious)).toBe('');
  });
});
