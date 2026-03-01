import { describe, test, expect } from 'bun:test';
import { validate, assertSafeSql, Policy, ValidationResult } from '../src/index';

describe('validate', () => {
  test('returns ValidationResult with ok true for valid query', () => {
    const result = validate('SELECT * FROM public.users', { allowedTables: ['public.users'] });
    expect(result.ok).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  test('returns ValidationResult structure', () => {
    const policy: Policy = { allowedTables: ['users'] };
    const result: ValidationResult = validate('SELECT 1', policy);
    expect(typeof result.ok).toBe('boolean');
    expect(Array.isArray(result.violations)).toBe(true);
  });
});

describe('assertSafeSql', () => {
  test('does not throw for query when validate returns ok', () => {
    expect(() => assertSafeSql('SELECT * FROM public.users', { allowedTables: ['public.users'] })).not.toThrow();
  });
});
