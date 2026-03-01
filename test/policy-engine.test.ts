import { describe, expect, test } from 'bun:test';
import { ErrorCode, Policy } from '../src/index';
import { validateAgainstPolicy } from '../src/policy/engine';

describe('policy engine orchestration', () => {
  test('allows join between allowlisted relations', () => {
    const policy: Policy = {
      allowedTables: ['public.users', 'public.orders'],
      allowedFunctions: ['lower'],
    };

    const result = validateAgainstPolicy(
      'SELECT lower(u.email), o.id FROM public.users u JOIN public.orders o ON u.id = o.user_id',
      policy
    );

    expect(result).toEqual({ ok: true, violations: [] });
  });

  test('returns parse error when SQL is invalid', () => {
    const policy: Policy = { allowedTables: ['public.users'] };
    const result = validateAgainstPolicy('SELECT FROM', policy);

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.PARSE_ERROR);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].type).toBe('parse');
  });

  test('rejects multi statement queries by default', () => {
    const policy: Policy = { allowedTables: ['public.users'] };
    const result = validateAgainstPolicy('SELECT 1; SELECT 2', policy);

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.MULTI_STATEMENT_DISABLED);
    expect(result.violations[0]).toEqual({
      type: 'statement',
      message: 'Multiple statements not allowed. Found 2 statements.',
    });
  });

  test('rejects disallowed statement type', () => {
    const policy: Policy = {
      allowedTables: ['public.users'],
      allowedStatements: ['select'],
      resolver: (unqualified) => (unqualified === 'users' ? 'public.users' : null),
    };

    const result = validateAgainstPolicy('INSERT INTO users (id) VALUES (1)', policy);

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.STATEMENT_NOT_ALLOWED);
    expect(result.violations).toContainEqual({
      type: 'statement',
      message: "Statement type 'insert' not allowed. Allowed: select",
    });
  });

  test('rejects table outside allowlist', () => {
    const policy: Policy = { allowedTables: ['public.users'] };
    const result = validateAgainstPolicy('SELECT * FROM public.orders', policy);

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.TABLE_NOT_ALLOWED);
    expect(result.violations).toEqual([
      {
        type: 'table',
        message: "Table 'public.orders' is not allowed",
      },
    ]);
  });

  test('rejects information_schema access by default', () => {
    const policy: Policy = { allowedTables: ['public.users'] };
    const result = validateAgainstPolicy('SELECT * FROM information_schema.tables', policy);

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.TABLE_NOT_ALLOWED);
    expect(result.violations).toEqual([
      {
        type: 'table',
        message: "Metadata table 'information_schema.tables' is not allowed",
      },
    ]);
  });

  test('rejects metadata table enumeration', () => {
    const policy: Policy = { allowedTables: ['public.users'] };
    const result = validateAgainstPolicy('SELECT * FROM pg_catalog.pg_tables', policy);

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.TABLE_NOT_ALLOWED);
    expect(result.violations).toEqual([
      {
        type: 'table',
        message: "Metadata table 'pg_catalog.pg_tables' is not allowed",
      },
    ]);
  });

  test('allows explicitly allowlisted metadata relation', () => {
    const policy: Policy = { allowedTables: ['information_schema.tables'] };
    const result = validateAgainstPolicy('SELECT * FROM information_schema.tables', policy);

    expect(result).toEqual({ ok: true, violations: [] });
  });

  test('rejects non-allowlisted function', () => {
    const policy: Policy = {
      allowedTables: ['public.users'],
      allowedFunctions: ['lower'],
    };
    const result = validateAgainstPolicy('SELECT pg_catalog.current_database() FROM public.users', policy);

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.FUNCTION_NOT_ALLOWED);
    expect(result.violations).toEqual([
      {
        type: 'function',
        message: "Function 'pg_catalog.current_database' is not allowed",
      },
    ]);
  });

  test('collects multiple violations and applies precedence', () => {
    const policy: Policy = {
      allowedTables: ['public.users'],
      allowedStatements: ['insert'],
      allowedFunctions: ['lower'],
    };

    const result = validateAgainstPolicy(
      'SELECT pg_catalog.current_database(), md5(email) FROM public.orders',
      policy
    );

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.STATEMENT_NOT_ALLOWED);
    expect(result.violations).toEqual([
      {
        type: 'statement',
        message: "Statement type 'select' not allowed. Allowed: insert",
      },
      {
        type: 'table',
        message: "Table 'public.orders' is not allowed",
      },
      {
        type: 'function',
        message: "Function 'pg_catalog.current_database' is not allowed",
      },
      {
        type: 'function',
        message: "Function 'md5' is not allowed",
      },
    ]);
  });

  test('returns deterministic violation payload', () => {
    const policy: Policy = {
      allowedTables: ['public.users'],
      allowedStatements: ['insert'],
      allowedFunctions: ['lower'],
    };

    const sql = 'SELECT md5(email), pg_catalog.current_database() FROM public.orders';
    const first = validateAgainstPolicy(sql, policy);
    const second = validateAgainstPolicy(sql, policy);

    expect(first).toEqual(second);
    expect(first.errorCode).toBe(ErrorCode.STATEMENT_NOT_ALLOWED);
  });
});
