import { describe, expect, test } from 'bun:test';
import { validate, ErrorCode } from '../src/index';

describe('validate parameter robustness', () => {
  test('handles null sql gracefully', () => {
    const result = validate(null as any, { allowedTables: ['public.users'] });
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.PARSE_ERROR);
    expect(result.violations[0].type).toBe('parse');
    expect(result.violations[0].message).toBe('SQL input must be a string');
  });

  test('handles undefined sql gracefully', () => {
    const result = validate(undefined as any, { allowedTables: ['public.users'] });
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.PARSE_ERROR);
    expect(result.violations[0].type).toBe('parse');
    expect(result.violations[0].message).toBe('SQL input must be a string');
  });

  test('handles non-string sql gracefully', () => {
    const result = validate(123 as any, { allowedTables: ['public.users'] });
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.PARSE_ERROR);
  });

  test('handles null policy gracefully', () => {
    const result = validate('SELECT 1', null as any);
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.INVALID_POLICY);
    expect(result.violations[0].type).toBe('policy');
    expect(result.violations[0].message).toBe('Policy must be an object');
  });

  test('handles undefined policy gracefully', () => {
    const result = validate('SELECT 1', undefined as any);
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.INVALID_POLICY);
  });

  test('handles non-object policy gracefully', () => {
    const result = validate('SELECT 1', "policy" as any);
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.INVALID_POLICY);
  });
});
