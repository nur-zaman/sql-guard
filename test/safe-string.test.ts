import { describe, test, expect } from 'bun:test';
import { safeString } from '../src/utils/safe-string';

describe('safeString', () => {
  test('handles strings', () => {
    expect(safeString('hello')).toBe('hello');
  });

  test('handles numbers', () => {
    expect(safeString(42)).toBe('42');
  });

  test('handles booleans', () => {
    expect(safeString(true)).toBe('true');
    expect(safeString(false)).toBe('false');
  });

  test('handles null and undefined', () => {
    expect(safeString(null)).toBe('null');
    expect(safeString(undefined)).toBe('undefined');
  });

  test('handles objects with toString', () => {
    expect(safeString({})).toBe('[object Object]');
    expect(safeString({ toString: () => 'custom' })).toBe('custom');
  });

  test('handles Object.create(null)', () => {
    const obj = Object.create(null);
    expect(safeString(obj)).toBe('[object Object]');
  });

  test('handles arrays', () => {
    expect(safeString([1, 2, 3])).toBe('1,2,3');
  });
});
