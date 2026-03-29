import { describe, test, expect } from 'bun:test';
import { parseSql } from '../src/parser/adapter';
import { checkFunctionsAllowed } from '../src/policy/function';
import { ErrorCode, Policy } from '../src/index';

describe('function extraction and policy', () => {
  test('allows configured function', () => {
    const parsed = parseSql('SELECT lower(name) FROM public.users');
    expect(parsed.success).toBe(true);

    const policy: Policy = {
      allowedTables: ['public.users'],
      allowedFunctions: ['lower'],
    };

    const result = checkFunctionsAllowed(parsed.statements[0].functions, policy);
    expect(result.allowed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  test('allows explicitly listed function', () => {
    const parsed = parseSql('SELECT pg_catalog.current_database() FROM public.users');
    expect(parsed.success).toBe(true);

    const policy: Policy = {
      allowedTables: ['public.users'],
      allowedFunctions: ['pg_catalog.current_database'],
    };

    const result = checkFunctionsAllowed(parsed.statements[0].functions, policy);
    expect(result.allowed).toBe(true);
  });

  test('rejects dangerous function by default', () => {
    const parsed = parseSql('SELECT pg_catalog.pg_read_file() FROM public.users');
    expect(parsed.success).toBe(true);

    const policy: Policy = {
      allowedTables: ['public.users'],
    };

    const result = checkFunctionsAllowed(parsed.statements[0].functions, policy);
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.FUNCTION_NOT_ALLOWED);
    expect(result.violations).toEqual([{ schema: 'pg_catalog', name: 'pg_read_file' }]);
  });

  test('rejects pg_read_file', () => {
    const parsed = parseSql('SELECT pg_catalog.pg_read_file() FROM public.users');
    expect(parsed.success).toBe(true);

    const policy: Policy = {
      allowedTables: ['public.users'],
      allowedFunctions: ['lower'],
    };

    const result = checkFunctionsAllowed(parsed.statements[0].functions, policy);
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.FUNCTION_NOT_ALLOWED);
    expect(result.violations).toEqual([{ schema: 'pg_catalog', name: 'pg_read_file' }]);
  });

  test('extracts functions across select, where, join, group by, having, order by, cte, and subquery', () => {
    const sql =
      'WITH recent AS (SELECT max(total) AS max_total FROM orders) ' +
      'SELECT lower(u.name), count(*) FROM public.users u ' +
      'JOIN accounts a ON lower(u.email) = lower(a.email) ' +
      'WHERE length(u.email) > (SELECT avg(o.total) FROM orders o) ' +
      'GROUP BY lower(u.name) ' +
      'HAVING count(*) > 1 ' +
      'ORDER BY lower(u.name)';

    const parsed = parseSql(sql);
    expect(parsed.success).toBe(true);

    const calls = parsed.statements[0].functions
      .map((fn) => `${fn.schema ? `${fn.schema}.` : ''}${fn.name}`)
      .sort();

    expect(calls).toEqual(['avg', 'count', 'length', 'lower', 'max']);
  });

  test('rejects multiple unlisted functions in one query', () => {
    const parsed = parseSql(
      'SELECT lower(name), md5(email), pg_catalog.current_database() FROM public.users WHERE length(email) > 5'
    );
    expect(parsed.success).toBe(true);

    const policy: Policy = {
      allowedTables: ['public.users'],
      allowedFunctions: ['lower'],
    };

    const result = checkFunctionsAllowed(parsed.statements[0].functions, policy);
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.FUNCTION_NOT_ALLOWED);
    expect(result.violations).toEqual([
      { name: 'md5' },
      { schema: 'pg_catalog', name: 'current_database' },
      { name: 'length' },
    ]);
  });

  test('matches allowlist case-insensitively', () => {
    const parsed = parseSql('SELECT LOWER(name), Pg_Catalog.CURRENT_DATABASE() FROM public.users');
    expect(parsed.success).toBe(true);

    const policy: Policy = {
      allowedTables: ['public.users'],
      allowedFunctions: ['lower', 'PG_CATALOG.current_database'],
    };

    const result = checkFunctionsAllowed(parsed.statements[0].functions, policy);
    expect(result.allowed).toBe(true);
  });

  test('rejects schema-qualified call when only unqualified name is allowlisted', () => {
    const parsed = parseSql('SELECT pg_catalog.current_database() FROM public.users');
    expect(parsed.success).toBe(true);

    const policy: Policy = {
      allowedTables: ['public.users'],
      allowedFunctions: ['current_database'],
    };

    const result = checkFunctionsAllowed(parsed.statements[0].functions, policy);
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.FUNCTION_NOT_ALLOWED);
    expect(result.violations).toEqual([{ schema: 'pg_catalog', name: 'current_database' }]);
  });

  test('prevents deduplication shadowing of unquoted and quoted functions', () => {
    const parsed = parseSql('SELECT "SECRET_FUNCTION"(), secret_function()');
    expect(parsed.success).toBe(true);

    expect(parsed.statements[0].functions).toHaveLength(2);
    expect(parsed.statements[0].functions.map(f => f.name).sort()).toEqual(['SECRET_FUNCTION', 'secret_function']);
  });
});
