import { describe, expect, test } from 'bun:test';
import { safeString } from '../src/utils/safe-string';

describe('safeString utility', () => {
  test('converts basic types correctly', () => {
    expect(safeString('hello')).toBe('hello');
    expect(safeString(123)).toBe('123');
    expect(safeString(true)).toBe('true');
    expect(safeString(false)).toBe('false');
    expect(safeString(null)).toBe('null');
    expect(safeString(undefined)).toBe('undefined');
  });

  test('converts normal objects and arrays', () => {
    expect(safeString({})).toBe('[object Object]');
    expect(safeString([1, 2, 3])).toBe('1,2,3');
  });

  test('handles objects without a prototype without throwing', () => {
    const noProto = Object.create(null);
    expect(() => String(noProto)).toThrow(); // Native String() throws
    expect(safeString(noProto)).toBe('[Uncoercible Value]'); // safeString catches and returns fallback
  });

  test('handles objects with malicious toString without throwing', () => {
    const malicious = {
      toString: () => {
        throw new Error('Malicious toString');
      }
    };
    expect(() => String(malicious)).toThrow('Malicious toString'); // Native String() throws
    expect(safeString(malicious)).toBe('[Uncoercible Value]'); // safeString catches and returns fallback
  });
});
