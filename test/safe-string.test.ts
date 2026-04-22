import { describe, test, expect } from 'bun:test';
import { safeString, safeErrorMessage } from '../src/utils/safe-string';

describe('safe-string utilities', () => {
  describe('safeString', () => {
    test('handles normal strings', () => {
      expect(safeString('hello')).toBe('hello');
    });

    test('handles null and undefined', () => {
      expect(safeString(null)).toBe('null');
      expect(safeString(undefined)).toBe('undefined');
    });

    test('handles normal objects', () => {
      expect(safeString({ a: 1 })).toBe('{"a":1}');
    });

    test('handles objects with malicious toString', () => {
      const evilObj = {
        toString: () => {
          throw new Error('muahaha');
        }
      };
      expect(safeString(evilObj)).toBe('[unstringifiable object]');
    });
  });

  describe('safeErrorMessage', () => {
    test('extracts message from Error object', () => {
      expect(safeErrorMessage(new Error('test error'))).toBe('test error');
    });

    test('handles non-error objects', () => {
      expect(safeErrorMessage({ foo: 'bar' })).toBe('{"foo":"bar"}');
    });

    test('handles primitive values', () => {
      expect(safeErrorMessage('just a string')).toBe('just a string');
    });
  });
});
