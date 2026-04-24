import { describe, test, expect } from 'bun:test';
import { isStatementAllowed, checkMultiStatementPolicy } from '../src/policy/statement';
import { ParsedStatement } from '../src/parser/types';
import { Policy, ErrorCode } from '../src/index';

describe('isStatementAllowed', () => {
  test('allows SELECT by default', () => {
    const stmt: ParsedStatement = { type: 'select', tables: [], functions: [], raw: {} };
    const policy: Policy = { allowedTables: ['public.users'] };

    const result = isStatementAllowed(stmt, policy);
    expect(result.allowed).toBe(true);
  });

  test('denies INSERT by default', () => {
    const stmt: ParsedStatement = { type: 'insert', tables: [], functions: [], raw: {} };
    const policy: Policy = { allowedTables: ['public.users'] };

    const result = isStatementAllowed(stmt, policy);
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.STATEMENT_NOT_ALLOWED);
  });

  test('allows configured statement types', () => {
    const stmt: ParsedStatement = { type: 'insert', tables: [], functions: [], raw: {} };
    const policy: Policy = {
      allowedTables: ['public.users'],
      allowedStatements: ['select', 'insert'],
    };

    const result = isStatementAllowed(stmt, policy);
    expect(result.allowed).toBe(true);
  });

  test('denies unknown statement type', () => {
    const stmt: ParsedStatement = { type: 'unknown', tables: [], functions: [], raw: {} };
    const policy: Policy = { allowedTables: ['public.users'] };

    const result = isStatementAllowed(stmt, policy);
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.STATEMENT_NOT_ALLOWED);
  });
});

describe('checkMultiStatementPolicy', () => {
  test('allows single statement by default', () => {
    const stmts: ParsedStatement[] = [{ type: 'select', tables: [], functions: [], raw: {} }];
    const policy: Policy = { allowedTables: ['public.users'] };

    const result = checkMultiStatementPolicy(stmts, policy);
    expect(result.allowed).toBe(true);
  });

  test('denies multiple statements by default', () => {
    const stmts: ParsedStatement[] = [
      { type: 'select', tables: [], functions: [], raw: {} },
      { type: 'select', tables: [], functions: [], raw: {} },
    ];
    const policy: Policy = { allowedTables: ['public.users'] };

    const result = checkMultiStatementPolicy(stmts, policy);
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.MULTI_STATEMENT_DISABLED);
  });

  test('allows multiple statements when enabled', () => {
    const stmts: ParsedStatement[] = [
      { type: 'select', tables: [], functions: [], raw: {} },
      { type: 'select', tables: [], functions: [], raw: {} },
    ];
    const policy: Policy = {
      allowedTables: ['public.users'],
      allowMultiStatement: true,
    };

    const result = checkMultiStatementPolicy(stmts, policy);
    expect(result.allowed).toBe(true);
  });

  test('handles arrays containing non-string objects without crashing', () => {
    const policy: Policy = {
      allowedTables: ['public.users'],
      allowedStatements: [
        Object.create(null) as any,
        'select',
      ],
    };

    const statement: ParsedStatement = {
      type: 'insert',
      tables: [],
      functions: [],
      raw: {},
    };

    // The non-string object should be ignored in the error message generation without throwing
    const result = isStatementAllowed(statement, policy);
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.STATEMENT_NOT_ALLOWED);
    expect(result.errorMessage).toBe("Statement type 'insert' not allowed. Allowed: select");
  });
});
