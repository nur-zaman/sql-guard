import { describe, test, expect } from 'bun:test';
import { validate, assertSafeSql, Policy, ValidationResult } from '../src/index';

describe('validate', () => {
  test('returns ValidationResult with ok true for valid query', () => {
    const result = validate('SELECT * FROM public.users', { allowedTables: ['public.users'] });
    expect(result.ok).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  test('returns ValidationResult structure', () => {
    const policy: Policy = { allowedTables: ['public.users'] };
    const result: ValidationResult = validate('SELECT 1', policy);
    expect(typeof result.ok).toBe('boolean');
    expect(Array.isArray(result.violations)).toBe(true);
  });

  test('returns parse error when sql input is not a string', () => {
    const policy: Policy = { allowedTables: ['public.users'] };
    const result = validate(null as any, policy);
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe('PARSE_ERROR');
    expect(result.violations[0].message).toBe('SQL input must be a string');

    const result2 = validate({} as any, policy);
    expect(result2.ok).toBe(false);
    expect(result2.errorCode).toBe('PARSE_ERROR');
  });
});

describe('assertSafeSql', () => {
  test('does not throw for query when validate returns ok', () => {
    expect(() => assertSafeSql('SELECT * FROM public.users', { allowedTables: ['public.users'] })).not.toThrow();
  });
});
