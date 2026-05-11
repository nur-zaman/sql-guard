import { describe, expect, test } from 'bun:test';
import { safeString } from '../src/utils/safe-string';
import { normalizeTableReference } from '../src/normalize/identifier';
import { ErrorCode } from '../src/types/public';
import { parseSql } from '../src/parser/adapter';
import { checkUnsupportedFeatures } from '../src/policy/fail-closed';

describe('safeString utility', () => {
  test('handles null and undefined', () => {
    expect(safeString(null)).toBe('null');
    expect(safeString(undefined)).toBe('undefined');
  });

  test('handles primitives safely', () => {
    expect(safeString('hello')).toBe('hello');
    expect(safeString(123)).toBe('123');
    expect(safeString(true)).toBe('true');
    expect(safeString(false)).toBe('false');
    expect(safeString(BigInt(9007199254740991))).toBe('9007199254740991');
    expect(safeString(Symbol('test'))).toBe('Symbol(test)');
  });

  test('defensively handles malicious objects that throw in toString', () => {
    const malicious = {
      toString: () => {
        throw new Error('Boom');
      }
    };

    // Should not throw
    expect(safeString(malicious)).toBe('[object Object]');
  });

  test('handles arrays', () => {
    expect(safeString([1, 2, 3])).toBe('[object Array]');
  });

  test('handles functions', () => {
    expect(safeString(() => {})).toBe('[object Function]');
  });

  test('handles Errors gracefully', () => {
    const err = new Error('Something went wrong');
    expect(safeString(err)).toBe('Error: Something went wrong');

    // Even if error is messed up
    const badErr = new Error();
    Object.defineProperty(badErr, 'message', { value: 123 });
    expect(safeString(badErr)).toBe('Error: Unknown error');
  });
});

describe('safeString mitigations in codebase', () => {
  test('normalizeTableReference does not crash when resolver throws an object with a bad toString', () => {
    const policy = {
      allowedTables: ['public.users'],
      resolver: () => {
        throw { toString: () => { throw new Error('Boom'); } };
      }
    };

    const ref = { schema: undefined, name: 'users', alias: undefined };
    const result = normalizeTableReference(ref, policy);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Resolver threw while resolving 'users': [object Object]");
  });

  test('parseSql does not crash when AST node type has malicious toString', () => {
    // To simulate what parseSql might receive from node-sql-parser in case of pollution
    // we would have to intercept node-sql-parser, but we can verify the utility directly inside the internal method
    // Since we can't easily mock the AST, we rely on the utility tests.
    // However, we can manually check that checkUnsupportedFeatures doesn't crash:
    const maliciousAst = {
      type: { toString: () => { throw new Error('Boom'); } }
    };

    const result = checkUnsupportedFeatures(maliciousAst);
    // Since type safely evaluates to [object Object], it won't match supported types
    expect(result.supported).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.UNSUPPORTED_SQL_FEATURE);
  });
});
