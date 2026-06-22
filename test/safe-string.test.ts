import { describe, test, expect } from 'bun:test';
import { safeString } from '../src/utils/safe-string';

describe('safeString', () => {
  test('returns string representation for primitive values', () => {
    expect(safeString('hello')).toBe('hello');
    expect(safeString(123)).toBe('123');
    expect(safeString(true)).toBe('true');
    expect(safeString(null)).toBe('null');
    expect(safeString(undefined)).toBe('undefined');
  });

  test('returns string representation for objects with toString', () => {
    expect(safeString({})).toBe('[object Object]');
    expect(safeString([1, 2, 3])).toBe('1,2,3');
  });

  test('safely handles objects without toString (e.g., Object.create(null))', () => {
    const objWithoutToString = Object.create(null);
    expect(safeString(objWithoutToString)).toBe('[unknown]');
  });
});
