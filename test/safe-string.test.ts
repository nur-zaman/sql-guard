import { describe, expect, test } from 'bun:test';
import { safeString } from '../src/utils/safe-string';

describe('safeString utility', () => {
  test('returns strings unmodified', () => {
    expect(safeString('hello')).toBe('hello');
    expect(safeString('')).toBe('');
  });

  test('converts numbers to strings', () => {
    expect(safeString(123)).toBe('123');
    expect(safeString(0)).toBe('0');
  });

  test('converts booleans to strings', () => {
    expect(safeString(true)).toBe('true');
    expect(safeString(false)).toBe('false');
  });

  test('handles null and undefined', () => {
    expect(safeString(null)).toBe('null');
    expect(safeString(undefined)).toBe('undefined');
  });

  test('handles normal objects and arrays', () => {
    expect(safeString({})).toBe('[object Object]');
    expect(safeString([1, 2, 3])).toBe('1,2,3');
  });

  test('safely handles objects without toString (Object.create(null))', () => {
    const nullPrototypeObj = Object.create(null);
    expect(safeString(nullPrototypeObj)).toBe('[uncoercible]');
  });

  test('safely handles objects with throwing toString', () => {
    const throwingObj = {
      toString() {
        throw new Error('Evil toString');
      }
    };
    expect(safeString(throwingObj)).toBe('[uncoercible]');
  });
});
