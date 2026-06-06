import { describe, test, expect } from 'bun:test';
import { validateAgainstPolicy } from '../src/policy/engine';
import { ErrorCode, Policy } from '../src/types/public';

describe('Engine type confusion DoS', () => {
  test('does not throw unhandled exception when policy is null/undefined during validation', () => {
    const result = validateAgainstPolicy('SELECT 1', null as any);
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.INVALID_POLICY);
  });

  test('does not throw unhandled exception when sql string is null/undefined during validation', () => {
    const result = validateAgainstPolicy(null as any, { allowedTables: ['users'] });
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.PARSE_ERROR);
  });
});
