import { describe, test, expect } from 'bun:test';
import { safeString } from '../src/utils/safe-string';

describe('safeString', () => {
  test('returns string for string input', () => {
    expect(safeString('hello')).toBe('hello');
    expect(safeString('')).toBe('');
  });

  test('returns string for numbers', () => {
    expect(safeString(123)).toBe('123');
    expect(safeString(0)).toBe('0');
    expect(safeString(NaN)).toBe('NaN');
  });

  test('returns string for booleans', () => {
    expect(safeString(true)).toBe('true');
    expect(safeString(false)).toBe('false');
  });

  test('returns empty string for null and undefined', () => {
    expect(safeString(null)).toBe('');
    expect(safeString(undefined)).toBe('');
  });

  test('handles objects with prototypes normally', () => {
    expect(safeString({})).toBe('[object Object]');
    expect(safeString({ a: 1 })).toBe('[object Object]');
    expect(safeString([])).toBe('');
    expect(safeString([1, 2])).toBe('1,2');
  });

  test('prevents prototype pollution/type confusion by rejecting objects without prototypes', () => {
    const obj = Object.create(null);
    expect(safeString(obj)).toBe('');
  });

  test('catches malicious toString implementations', () => {
    const obj = {
      toString: () => {
        throw new Error('malicious');
      }
    };
    expect(safeString(obj)).toBe('');
  });
});
