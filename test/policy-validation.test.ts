import { test, expect } from 'bun:test';
import { validate, ErrorCode } from '../src/index';

test('allowedTables with empty string is invalid', () => {
  const result = validate('SELECT 1', { allowedTables: [''] });
  expect(result.ok).toBe(false);
  expect(result.errorCode).toBe(ErrorCode.INVALID_POLICY);
});

test('allowedFunctions with empty string is invalid', () => {
  const result = validate('SELECT 1', { allowedTables: ['public.users'], allowedFunctions: ['   '] });
  expect(result.ok).toBe(false);
  expect(result.errorCode).toBe(ErrorCode.INVALID_POLICY);
});

test('allowedStatements with empty string is invalid', () => {
  const result = validate('SELECT 1', { allowedTables: ['public.users'], allowedStatements: [''] as any });
  expect(result.ok).toBe(false);
  expect(result.errorCode).toBe(ErrorCode.INVALID_POLICY);
});
