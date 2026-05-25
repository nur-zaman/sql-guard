import { describe, test, expect } from 'bun:test';
import { parseSql } from '../src/parser/adapter';
import { checkUnsupportedFeatures } from '../src/policy/fail-closed';
import { normalizeTableReference } from '../src/normalize/identifier';
import { Policy } from '../src/types/public';

describe('String() prototype poison DoS', () => {
  test('adapter handles object without toString', () => {
    const malicious = Object.create(null);
    expect(() => parseSql(malicious)).not.toThrow();
  });

  test('fail-closed handles object without toString', () => {
    const malicious = Object.create(null);
    expect(() => checkUnsupportedFeatures({ type: malicious })).not.toThrow();
  });

  test('normalizeTableReference handles object without toString in resolver error', () => {
    const malicious = Object.create(null);
    const policy: Policy = {
      allowedTables: [],
      resolver: () => { throw malicious; }
    };
    expect(() => normalizeTableReference({ name: 'foo' }, policy)).not.toThrow();
  });
});
