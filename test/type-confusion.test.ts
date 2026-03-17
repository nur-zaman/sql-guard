import { test, expect } from 'bun:test';
import { validate } from '../src/index';
import { ErrorCode } from '../src/types/public';

test('type confusion regression: rejects non-string inputs safely without throwing', () => {
  // Pass an object to try and bypass typescript and trigger runtime exceptions (e.g., .trim() or .length)
  const result = validate({} as any, { allowedTables: ['public.users'] });

  expect(result.ok).toBe(false);
  expect(result.errorCode).toBe(ErrorCode.PARSE_ERROR);
  expect(result.violations[0].message).toContain('Input must be a SQL string');
});
