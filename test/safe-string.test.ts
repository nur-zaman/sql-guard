import { describe, test, expect } from 'bun:test';
import { safeString } from '../src/utils/safe-string';

describe('safeString', () => {
  test('returns strings exactly as they are', () => {
    expect(safeString('hello')).toBe('hello');
    expect(safeString('')).toBe('');
  });

  test('handles null and undefined', () => {
    expect(safeString(null)).toBe('');
    expect(safeString(undefined)).toBe('');
  });

  test('converts numbers and booleans', () => {
    expect(safeString(123)).toBe('123');
    expect(safeString(0)).toBe('0');
    expect(safeString(true)).toBe('true');
    expect(safeString(false)).toBe('false');
  });

  test('handles objects with toString', () => {
    expect(safeString({})).toBe('[object Object]');
    expect(safeString([1, 2, 3])).toBe('1,2,3');
  });

  test('gracefully handles objects without a prototype', () => {
    const nullProto = Object.create(null);
    expect(safeString(nullProto)).toBe('[Unserializable Object]');
  });

  test('gracefully handles objects with malicious toString', () => {
    const maliciousObj = {
      toString: () => {
        throw new Error('Exploit');
      }
    };
    expect(safeString(maliciousObj)).toBe('[Unserializable Object]');
  });
});
