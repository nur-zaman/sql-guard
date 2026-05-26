import { describe, test, expect } from 'bun:test';
import { safeString } from '../src/utils/safe-string';

describe('safeString', () => {
  test('returns string for normal values', () => {
    expect(safeString(1)).toBe('1');
    expect(safeString('test')).toBe('test');
    expect(safeString(true)).toBe('true');
    expect(safeString(null)).toBe('null');
    expect(safeString(undefined)).toBe('undefined');
  });

  test('returns fallback for object without prototype', () => {
    const obj = Object.create(null);
    expect(safeString(obj)).toBe('[Unserializable Object]');
  });
});
