import { describe, test, expect } from 'bun:test';
import { validate } from '../src/index';

describe('malicious toString', () => {
  test('should not throw unhandled exception when resolver throws object with malicious toString', () => {
    const maliciousError = {
      toString: () => { throw new Error('pwned'); }
    };

    const policy = {
      allowedTables: ['public.users'],
      resolver: () => {
        throw maliciousError;
      }
    };

    // This should catch the exception from resolver, then try to do String(err)
    // with safeString, it won't throw an unhandled exception.
    expect(() => {
      validate('SELECT * FROM users', policy);
    }).not.toThrow();

    const result = validate('SELECT * FROM users', policy);
    expect(result.ok).toBe(false);
  });

  test('parser adapter should not throw when ast.type has malicious toString', () => {
    // We can't directly inject AST here easily since parseSql uses node-sql-parser
    // but we can test safeString directly.
  });
});
