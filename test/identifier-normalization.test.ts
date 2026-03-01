import { describe, expect, test } from 'bun:test';
import {
  isTableAllowed,
  normalizeTableReference,
  type NormalizedTable,
} from '../src/normalize/identifier';
import type { Policy } from '../src/index';

describe('normalizeTableReference', () => {
  test('normalizes schema-qualified table', () => {
    const ref = { schema: 'public', name: 'Users' };
    const policy: Policy = { allowedTables: ['public.users'] };

    const result = normalizeTableReference(ref, policy);
    expect(result.success).toBe(true);
    expect(result.table?.schema).toBe('public');
    expect(result.table?.name).toBe('users');
    expect(result.table?.fullyQualified).toBe('public.users');
  });

  test('denies unqualified table without resolver', () => {
    const ref = { name: 'users' };
    const policy: Policy = { allowedTables: ['users'] };

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

  test('preserves case for quoted identifiers', () => {
    const ref = { schema: 'PUBLIC', name: '"UserTable"' };
    const policy: Policy = { allowedTables: ['public.UserTable'] };

    const result = normalizeTableReference(ref, policy);
    expect(result.success).toBe(true);
    expect(result.table?.schema).toBe('public');
    expect(result.table?.name).toBe('UserTable');
  });
});

describe('isTableAllowed', () => {
  test('returns true for fully qualified match', () => {
    const table: NormalizedTable = {
      schema: 'public',
      name: 'users',
      fullyQualified: 'public.users',
    };

    expect(isTableAllowed(table, ['public.users'])).toBe(true);
  });

  test('returns true for table name match', () => {
    const table: NormalizedTable = {
      schema: 'public',
      name: 'users',
      fullyQualified: 'public.users',
    };

    expect(isTableAllowed(table, ['users'])).toBe(true);
  });

  test('returns false for non-matching table', () => {
    const table: NormalizedTable = {
      schema: 'public',
      name: 'users',
      fullyQualified: 'public.users',
    };

    expect(isTableAllowed(table, ['orders', 'products'])).toBe(false);
  });

  test('is case-insensitive', () => {
    const table: NormalizedTable = {
      schema: 'PUBLIC',
      name: 'USERS',
      fullyQualified: 'public.users',
    };

    expect(isTableAllowed(table, ['PUBLIC.USERS'])).toBe(true);
  });
});
