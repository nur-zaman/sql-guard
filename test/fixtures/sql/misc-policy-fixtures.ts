import { ErrorCode } from '../../../src/index';
import type { PolicyFixture } from './types';

export const miscPolicyFixtures: PolicyFixture[] = [
  {
    name: 'quoted identifiers',
    sql: 'SELECT * FROM "public"."Users"',
    policy: { allowedTables: ['public.Users'] },
    expected: { ok: true },
  },
  {
    name: 'schema-qualified relation',
    sql: 'SELECT * FROM analytics.events',
    policy: { allowedTables: ['analytics.events'] },
    expected: { ok: true },
  },
  {
    name: 'resolver allows unqualified relation',
    sql: 'SELECT * FROM users',
    policy: {
      allowedTables: ['public.users'],
      resolver: (unqualified) => (unqualified === 'users' ? 'public.users' : null),
    },
    expected: { ok: true },
  },
  {
    name: 'resolver denies unknown unqualified relation',
    sql: 'SELECT * FROM users',
    policy: {
      allowedTables: ['public.users'],
      resolver: () => null,
    },
    expected: { ok: false, errorCode: ErrorCode.TABLE_NOT_ALLOWED },
  },
  {
    name: 'SELECT allowed by statement policy',
    sql: 'SELECT * FROM public.users',
    policy: {
      allowedTables: ['public.users'],
      allowedStatements: ['select'],
    },
    expected: { ok: true },
  },
  {
    name: 'INSERT denied by statement policy',
    sql: 'INSERT INTO public.users (id) VALUES (1)',
    policy: {
      allowedTables: ['public.users'],
      allowedStatements: ['select'],
    },
    expected: { ok: false, errorCode: ErrorCode.STATEMENT_NOT_ALLOWED },
  },
  {
    name: 'UPDATE denied by statement policy',
    sql: 'UPDATE public.users SET id = 2 WHERE id = 1',
    policy: {
      allowedTables: ['public.users'],
      allowedStatements: ['select'],
    },
    expected: { ok: false, errorCode: ErrorCode.STATEMENT_NOT_ALLOWED },
  },
  {
    name: 'DELETE denied by statement policy',
    sql: 'DELETE FROM public.users WHERE id = 1',
    policy: {
      allowedTables: ['public.users'],
      allowedStatements: ['select'],
    },
    expected: { ok: false, errorCode: ErrorCode.STATEMENT_NOT_ALLOWED },
  },
];
