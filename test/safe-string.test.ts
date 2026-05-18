import { describe, expect, test } from 'bun:test';
import { safeString } from '../src/utils/safe-string';

describe('safeString', () => {
  test('handles null and undefined', () => {
    expect(safeString(null)).toBe('null');
    expect(safeString(undefined)).toBe('undefined');
  });

  test('handles primitive types', () => {
    expect(safeString('hello')).toBe('hello');
    expect(safeString(123)).toBe('123');
    expect(safeString(true)).toBe('true');
    expect(safeString(false)).toBe('false');
    expect(safeString(Symbol('test'))).toBe('Symbol(test)');
    expect(safeString(BigInt(9007199254740991))).toBe('9007199254740991');
  });

  test('prevents execution of malicious toString on objects', () => {
    let executed = false;
    const maliciousObj = {
      toString: () => {
        executed = true;
        return 'hacked';
      }
    };

    const result = safeString(maliciousObj);
    expect(executed).toBe(false);
    expect(result).toBe('[object Object]');
  });

  test('prevents execution of throwing toString on objects', () => {
    const throwingObj = {
      toString: () => {
        throw new Error('Boom');
      }
    };

    expect(() => safeString(throwingObj)).not.toThrow();
    expect(safeString(throwingObj)).toBe('[object Object]');
  });

  test('handles arrays', () => {
    expect(safeString([1, 2, 3])).toBe('[object Array]');
  });

  test('handles functions', () => {
    const fn = () => {};
    expect(safeString(fn)).toBe('[object Function]');
  });
});
