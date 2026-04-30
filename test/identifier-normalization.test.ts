import { describe, expect, test } from 'bun:test';
import {
  isTableAllowed,
  normalizeTableReference,
  type NormalizedTable,
} from '../src/normalize/identifier';
import type { Policy } from '../src/index';

describe('normalizeTableReference', () => {
  test('uses strict matching by default and preserves case distinctions', () => {
    const ref = { schema: 'public', name: 'Users' };
    const policy: Policy = { allowedTables: ['public.users'] };

    const result = normalizeTableReference(ref, policy);
    expect(result.success).toBe(true);
    expect(result.table?.schema).toBe('public');
    expect(result.table?.name).toBe('Users');
    expect(result.table?.fullyQualified).toBe('public.Users');
  });

  test('caseInsensitive matching normalizes case-insensitively', () => {
    const ref = { schema: 'public', name: 'Users' };
    const policy: Policy = {
      allowedTables: ['public.users'],
      tableIdentifierMatching: 'caseInsensitive',
    };

    const result = normalizeTableReference(ref, policy);
    expect(result.success).toBe(true);
    expect(result.table?.schema).toBe('public');
    expect(result.table?.name).toBe('users');
    expect(result.table?.fullyQualified).toBe('public.users');
  });

  test('denies unqualified table without resolver', () => {
    const ref = { name: 'users' };
    const policy: Policy = { allowedTables: ['public.users'] };

    const result = normalizeTableReference(ref, policy);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unqualified table reference');
  });

  test('allows unqualified table with resolver', () => {
    const ref = { name: 'users' };
    const policy: Policy = {
      allowedTables: ['public.users'],
      resolver: (name) => (name === 'users' ? 'public.users' : null),
    };

    const result = normalizeTableReference(ref, policy);
    expect(result.success).toBe(true);
    expect(result.table?.fullyQualified).toBe('public.users');
  });

  test('handles malicious thrown errors in resolver safely', () => {
    const ref = { name: 'users' };
    const policy: Policy = {
      allowedTables: [],
      resolver: () => {
        throw Object.create(null);
      }
    };

    const result = normalizeTableReference(ref, policy);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Resolver threw while resolving 'users': Unknown error");
  });

  test('preserves case for quoted identifiers', () => {
    const ref = { schema: 'PUBLIC', name: '"UserTable"' };
    const policy: Policy = {
      allowedTables: ['PUBLIC.UserTable'],
      tableIdentifierMatching: 'strict',
    };

    const result = normalizeTableReference(ref, policy);
    expect(result.success).toBe(true);
    expect(result.table?.schema).toBe('PUBLIC');
    expect(result.table?.name).toBe('UserTable');
  });
});

describe('isTableAllowed', () => {
  test('returns true for fully qualified match in strict mode', () => {
    const table: NormalizedTable = {
      schema: 'public',
      name: 'users',
      fullyQualified: 'public.users',
    };

    expect(isTableAllowed(table, ['public.users'])).toBe(true);
  });

  test('returns false for unqualified table-name allowlist entry', () => {
    const table: NormalizedTable = {
      schema: 'public',
      name: 'users',
      fullyQualified: 'public.users',
    };

    expect(isTableAllowed(table, ['users'])).toBe(false);
  });

  test('returns false for non-matching table', () => {
    const table: NormalizedTable = {
      schema: 'public',
      name: 'users',
      fullyQualified: 'public.users',
    };

    expect(isTableAllowed(table, ['orders', 'products'])).toBe(false);
  });

  test('strict mode is case-sensitive', () => {
    const table: NormalizedTable = {
      schema: 'public',
      name: 'users',
      fullyQualified: 'public.users',
    };

    expect(isTableAllowed(table, ['PUBLIC.USERS'])).toBe(false);
  });

  test('caseInsensitive mode is case-insensitive', () => {
    const table: NormalizedTable = {
      schema: 'PUBLIC',
      name: 'USERS',
      fullyQualified: 'public.users',
    };

    expect(isTableAllowed(table, ['PUBLIC.USERS'], 'caseInsensitive')).toBe(true);
  });
});
