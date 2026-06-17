import { describe, test, expect } from 'bun:test';
import { safeString } from '../src/utils/safe-string';

describe('safeString', () => {
  test('returns literal "null" for null', () => {
    expect(safeString(null)).toBe('null');
  });

  test('returns literal "undefined" for undefined', () => {
    expect(safeString(undefined)).toBe('undefined');
  });

  test('returns string unchanged', () => {
    expect(safeString('hello')).toBe('hello');
  });

  test('converts numbers to strings', () => {
    expect(safeString(42)).toBe('42');
    expect(safeString(0)).toBe('0');
    expect(safeString(-1.5)).toBe('-1.5');
    expect(safeString(NaN)).toBe('NaN');
  });

  test('converts booleans to strings', () => {
    expect(safeString(true)).toBe('true');
    expect(safeString(false)).toBe('false');
  });

  test('converts basic objects and arrays', () => {
    expect(safeString({})).toBe('[object Object]');
    expect(safeString([1, 2, 3])).toBe('1,2,3');
  });

  test('handles object without prototype (Object.create(null)) safely', () => {
    const nullProtoObj = Object.create(null);
    expect(safeString(nullProtoObj)).toBe('[Unserializable Value]');
  });

  test('handles object with throwing toString method safely', () => {
    const maliciousObj = {
      toString: () => {
        throw new Error('Boom');
      }
    };
    expect(safeString(maliciousObj)).toBe('[Unserializable Value]');
  });
});
