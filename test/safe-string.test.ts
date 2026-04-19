import { describe, test, expect } from 'bun:test';
import { safeString, safeErrorMessage } from '../src/utils/safe-string';

describe('safeString', () => {
  test('handles object without toString', () => {
    const obj = Object.create(null);
    expect(safeString(obj)).toBe('[Unconvertible value]');
  });
});

describe('safeErrorMessage', () => {
  test('handles object without toString', () => {
    const obj = Object.create(null);
    expect(safeErrorMessage(obj)).toBe('An error occurred');
  });

  test('handles Error instance', () => {
    expect(safeErrorMessage(new Error('test error'))).toBe('test error');
  });
});
