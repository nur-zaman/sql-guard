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
    expect(ErrorCode.PARSE_ERROR).toBe('PARSE_ERROR');
    expect(ErrorCode.UNSUPPORTED_SQL_FEATURE).toBe('UNSUPPORTED_SQL_FEATURE');
    expect(ErrorCode.TABLE_NOT_ALLOWED).toBe('TABLE_NOT_ALLOWED');
    expect(ErrorCode.STATEMENT_NOT_ALLOWED).toBe('STATEMENT_NOT_ALLOWED');
    expect(ErrorCode.FUNCTION_NOT_ALLOWED).toBe('FUNCTION_NOT_ALLOWED');
    expect(ErrorCode.MULTI_STATEMENT_DISABLED).toBe('MULTI_STATEMENT_DISABLED');
  });
});

describe('Policy interface', () => {
  test('can create a valid policy object', () => {
    const policy: Policy = {
      allowedTables: ['users', 'orders'],
      allowedStatements: ['select', 'insert'],
      allowMultiStatement: false,
      allowedFunctions: ['count', 'sum'],
      resolver: (name) => name === 'users' ? 'public.users' : null
    };
    expect(policy.allowedTables).toEqual(['users', 'orders']);
  });

  test('policy only requires allowedTables', () => {
    const policy: Policy = { allowedTables: ['users'] };
    expect(policy.allowedTables).toEqual(['users']);
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
