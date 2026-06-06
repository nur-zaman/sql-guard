import { describe, test, expect } from 'bun:test';
import { validate, ErrorCode, Policy } from '../src/index';

describe('Type confusion DoS', () => {
  test('does not throw unhandled exception when table element is an object without toString', () => {
    const policy: Policy = {
      allowedTables: [Object.create(null)] as any
    };

    const result = validate('SELECT 1', policy);
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.INVALID_POLICY);
  });

  test('does not throw unhandled exception when function element is an object without toString', () => {
    const policy: Policy = {
      allowedTables: ['public.users'],
      allowedFunctions: [Object.create(null)] as any
    };

    const result = validate('SELECT 1', policy);
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.INVALID_POLICY);
  });

  test('does not throw unhandled exception when statement element is an object without toString', () => {
    const policy: Policy = {
      allowedTables: ['public.users'],
      allowedStatements: [Object.create(null)] as any
    };

    const result = validate('SELECT 1', policy);
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.INVALID_POLICY);
  });
});
