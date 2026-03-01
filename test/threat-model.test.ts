import { describe, expect, test } from 'bun:test';
import { ErrorCode, Policy } from '../src/index';
import { validateAgainstPolicy } from '../src/policy/engine';

describe('threat model regression', () => {
  const basePolicy: Policy = {
    allowedTables: ['public.users', 'public.orders'],
    allowedFunctions: ['lower', 'count'],
  };

  test('comment_obfuscation: comments are stripped but query still validated', () => {
    const result = validateAgainstPolicy(
      'SELECT/**/name/**/FROM/**/public.users',
      basePolicy
    );
    expect(result.ok).toBe(true);
  });

  test('union_bypass: UNION-based data exfiltration is blocked', () => {
    const result = validateAgainstPolicy(
      'SELECT name FROM public.users UNION SELECT password FROM public.secret_table',
      basePolicy
    );
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.TABLE_NOT_ALLOWED);
  });

  test('cte_exfiltration: CTE accessing unauthorized table is blocked', () => {
    const result = validateAgainstPolicy(
      'WITH leaked AS (SELECT * FROM public.secret_table) SELECT * FROM public.users',
      basePolicy
    );
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.TABLE_NOT_ALLOWED);
  });

  test('metadata_table_access: information_schema access is blocked', () => {
    const result = validateAgainstPolicy(
      'SELECT * FROM information_schema.tables',
      basePolicy
    );
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.TABLE_NOT_ALLOWED);
  });

  test('dangerous_function_call: pg_read_file is blocked', () => {
    const result = validateAgainstPolicy(
      "SELECT pg_catalog.pg_read_file('/etc/passwd')",
      basePolicy
    );
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.FUNCTION_NOT_ALLOWED);
  });

  test('stacked_statements: multiple statements are blocked', () => {
    const result = validateAgainstPolicy(
      'SELECT 1; SELECT 2',
      basePolicy
    );
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.MULTI_STATEMENT_DISABLED);
  });
});
