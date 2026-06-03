import { describe, test, expect } from 'bun:test';
import { safeString } from '../src/utils/safe-string';

describe('safeString', () => {
  test('handles strings correctly', () => {
    expect(safeString('hello')).toBe('hello');
    expect(safeString('')).toBe('');
  });

  test('handles numbers correctly', () => {
    expect(safeString(123)).toBe('123');
    expect(safeString(0)).toBe('0');
    expect(safeString(NaN)).toBe('NaN');
  });

  test('handles booleans correctly', () => {
    expect(safeString(true)).toBe('true');
    expect(safeString(false)).toBe('false');
  });

  test('handles null and undefined correctly', () => {
    expect(safeString(null)).toBe('null');
    expect(safeString(undefined)).toBe('undefined');
  });

  test('handles objects with toString correctly', () => {
    expect(safeString({ toString: () => 'my-object' })).toBe('my-object');
  });

  test('handles Object.create(null) without throwing', () => {
    const obj = Object.create(null);
    expect(safeString(obj)).toBe('[object Object]');
  });

  test('handles malicious toString without throwing unhandled exceptions', () => {
    const maliciousObj = {
      toString: () => {
        throw new Error('boom');
      }
    };
    expect(safeString(maliciousObj)).toBe('[object Object]');
  });
});
