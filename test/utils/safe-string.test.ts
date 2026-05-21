import { describe, test, expect } from 'bun:test';
import { safeString } from '../../src/utils/safe-string';

describe('safeString', () => {
  test('converts strings', () => {
    expect(safeString('test')).toBe('test');
  });

  test('converts numbers', () => {
    expect(safeString(123)).toBe('123');
  });

  test('converts objects', () => {
    expect(safeString({})).toBe('[object Object]');
  });

  test('handles Object.create(null)', () => {
    const obj = Object.create(null);
    expect(safeString(obj)).toBe('[unserializable]');
  });

  test('handles objects with throwing toString', () => {
    const obj = {
      toString() {
        throw new Error('malicious');
      }
    };
    expect(safeString(obj)).toBe('[unserializable]');
  });
});
