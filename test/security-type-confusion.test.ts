import { describe, test, expect } from 'bun:test';
import { validate } from '../src/index';

describe('Security: Type Confusion', () => {
  test('does not throw on malicious toString in allowedTables', () => {
    const malicious = {
      toString: () => { throw new Error('malicious toString'); }
    };

    expect(() => {
      validate('SELECT * FROM public.users', {
        allowedTables: [malicious as any]
      });
    }).not.toThrow();
  });
});

  test('handles non-string elements in allowedTables gracefully', () => {
    const result = validate('SELECT * FROM public.users', {
      allowedTables: [123, null, undefined, {}, []] as any
    });
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe('INVALID_POLICY');
  });
