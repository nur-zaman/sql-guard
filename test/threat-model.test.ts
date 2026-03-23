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

  test('cte_shadowing_bypass: Case-sensitive CTE names do not shadow different-cased unauthorized tables', () => {
    // If AST deduplication uses .toLowerCase() on raw string values blindly,
    // the uppercase CTE name "SECRET_TABLE" would be lowercased to 'secret_table',
    // preventing the actual lowercase `secret_table` from being reported as a violation.
    const result = validateAgainstPolicy(
      'WITH "SECRET_TABLE" AS (SELECT * FROM public.users) SELECT * FROM public.secret_table',
      basePolicy
    );
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.TABLE_NOT_ALLOWED);
  });

  test('alias_collision_bypass: alias names do not suppress unauthorized tables', () => {
    const result = validateAgainstPolicy(
      'SELECT * FROM public.users secret_table JOIN public.secret_table s ON secret_table.id = s.user_id',
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

  test('cte_name_collision_bypass: CTE name does not hide unauthorized base relation', () => {
    const result = validateAgainstPolicy(
      'WITH secret_table AS (SELECT * FROM public.users) SELECT * FROM public.secret_table',
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

  test('query_too_large: extremely large query is rejected before parsing to prevent DoS', () => {
    // Generate a query larger than the default 100,000 characters
    const largeQuery = "SELECT '" + "A".repeat(100001) + "' FROM allowed_table";

    const result = validateAgainstPolicy(largeQuery, {
      allowedTables: ['public.allowed_table']
    });

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.QUERY_TOO_LARGE);
    expect(result.violations[0].type).toBe('policy');
    expect(result.violations[0].message).toContain('exceeds maximum allowed length');
  });

  test('query_too_large: maxQueryLength can be configured', () => {
    const query = "SELECT * FROM allowed_table WHERE id = 1"; // Length ~ 40

    const result = validateAgainstPolicy(query, {
      allowedTables: ['public.allowed_table'],
      maxQueryLength: 20
    });

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.QUERY_TOO_LARGE);
    expect(result.violations[0].type).toBe('policy');
  });
});
