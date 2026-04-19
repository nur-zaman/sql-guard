import { describe, test, expect } from 'bun:test';
import {
  ErrorCode,
  Policy,
  ValidationResult,
  Violation,
  SqlValidationError,
  validate,
  assertSafeSql
} from '../src/index';

describe('ErrorCode enum', () => {
  test('has all required error codes', () => {
    expect(ErrorCode.PARSE_ERROR).toBe(ErrorCode.PARSE_ERROR);
    expect(ErrorCode.UNSUPPORTED_SQL_FEATURE).toBe(ErrorCode.UNSUPPORTED_SQL_FEATURE);
    expect(ErrorCode.TABLE_NOT_ALLOWED).toBe(ErrorCode.TABLE_NOT_ALLOWED);
    expect(ErrorCode.STATEMENT_NOT_ALLOWED).toBe(ErrorCode.STATEMENT_NOT_ALLOWED);
    expect(ErrorCode.FUNCTION_NOT_ALLOWED).toBe(ErrorCode.FUNCTION_NOT_ALLOWED);
    expect(ErrorCode.MULTI_STATEMENT_DISABLED).toBe(ErrorCode.MULTI_STATEMENT_DISABLED);
    expect(ErrorCode.INVALID_POLICY).toBe(ErrorCode.INVALID_POLICY);
  });
});

describe('Policy interface', () => {
  test('can create a valid policy object', () => {
    const policy: Policy = {
      allowedTables: ['public.users', 'public.orders'],
      allowedStatements: ['select', 'insert'],
      allowMultiStatement: false,
      allowedFunctions: ['count', 'sum'],
      resolver: (name) => name === 'users' ? 'public.users' : null
    };
    expect(policy.allowedTables).toEqual(['public.users', 'public.orders']);
  });

  test('policy only requires allowedTables', () => {
    const policy: Policy = { allowedTables: ['public.users'] };
    expect(policy.allowedTables).toEqual(['public.users']);
  });

  test('validates policy object type at runtime', () => {
    const resultNull = validate('SELECT 1', null as any);
    expect(resultNull.ok).toBe(false);
    expect(resultNull.errorCode).toBe(ErrorCode.INVALID_POLICY);

    const resultUndefined = validate('SELECT 1', undefined as any);
    expect(resultUndefined.ok).toBe(false);
    expect(resultUndefined.errorCode).toBe(ErrorCode.INVALID_POLICY);

    const resultString = validate('SELECT 1', "policy" as any);
    expect(resultString.ok).toBe(false);
    expect(resultString.errorCode).toBe(ErrorCode.INVALID_POLICY);
  });

  test('validates allowedTables array items are strings', () => {
    const result = validate('SELECT 1', {
      allowedTables: ['public.users', null, 123, Object.create(null)] as any
    });
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.INVALID_POLICY);
    expect(result.violations[0].message).toContain("entries must be strings");
  });

  test('validates allowedFunctions array items are strings', () => {
    const result = validate('SELECT 1', {
      allowedTables: ['public.users'],
      allowedFunctions: ['count', 123, Object.create(null)] as any
    });
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.INVALID_POLICY);
    expect(result.violations[0].message).toContain("entries must be strings");
  });

  test('validates allowedStatements array items are strings', () => {
    const result = validate('SELECT 1', {
      allowedTables: ['public.users'],
      allowedStatements: ['select', null, Object.create(null)] as any
    });
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.INVALID_POLICY);
    expect(result.violations[0].message).toContain("entries must be strings");
  });

  test('validates defaultSchema type at runtime', () => {
    const result = validate('SELECT 1', {
      allowedTables: ['public.users'],
      defaultSchema: 123 as any
    });
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.INVALID_POLICY);
  });

  test('validates allowMultiStatement type at runtime', () => {
    const result = validate('SELECT 1', {
      allowedTables: ['public.users'],
      allowMultiStatement: "false" as any
    });
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.INVALID_POLICY);
  });

  test('validates resolver type at runtime', () => {
    const result = validate('SELECT 1', {
      allowedTables: ['public.users'],
      resolver: "not a function" as any
    });
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.INVALID_POLICY);
  });
});

describe('ValidationResult', () => {
  test('can create a successful result', () => {
    const result: ValidationResult = { ok: true, violations: [] };
    expect(result.ok).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  test('can create a failed result with error code', () => {
    const result: ValidationResult = {
      ok: false,
      violations: [{ type: 'table', message: 'Table not allowed' }],
      errorCode: ErrorCode.TABLE_NOT_ALLOWED
    };
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.TABLE_NOT_ALLOWED);
  });
});

describe('Violation', () => {
  test('can create a violation', () => {
    const violation: Violation = {
      type: 'table',
      message: 'Table users is not in allowlist',
      location: { line: 1, column: 14 }
    };
    expect(violation.type).toBe('table');
    expect(violation.location?.line).toBe(1);
  });

  test('supports policy violation type', () => {
    const violation: Violation = {
      type: 'policy',
      message: "Policy 'allowedTables' must be schema-qualified",
    };

    expect(violation.type).toBe('policy');
  });
});

describe('SqlValidationError', () => {
  test('can create error with code and violations', () => {
    const violations: Violation[] = [{ type: 'table', message: 'Not allowed' }];
    const error = new SqlValidationError('Validation failed', ErrorCode.TABLE_NOT_ALLOWED, violations);

    expect(error.message).toBe('Validation failed');
    expect(error.code).toBe(ErrorCode.TABLE_NOT_ALLOWED);
    expect(error.violations).toEqual(violations);
    expect(error.name).toBe('SqlValidationError');
  });
});

describe('Module exports', () => {
  test('validate function is exported', () => {
    expect(typeof validate).toBe('function');
  });

  test('assertSafeSql function is exported', () => {
    expect(typeof assertSafeSql).toBe('function');
  });
});
