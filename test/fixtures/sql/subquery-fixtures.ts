import { ErrorCode } from '../../../src/index';
import type { PolicyFixture } from './types';

export const subqueryFixtures: PolicyFixture[] = [
  {
    name: 'scalar subquery in SELECT',
    sql: 'SELECT name, (SELECT COUNT(*) FROM public.orders WHERE user_id = public.users.id) as order_count FROM public.users',
    policy: {
      allowedTables: ['public.users', 'public.orders'],
      allowedFunctions: ['count'],
      resolver: (name) => (name === 'users' ? 'public.users' : null),
    },
    expected: { ok: true },
  },
  {
    name: 'IN subquery',
    sql: 'SELECT * FROM public.users WHERE id IN (SELECT user_id FROM public.orders)',
    policy: { allowedTables: ['public.users', 'public.orders'] },
    expected: { ok: true },
  },
  {
    name: 'EXISTS subquery',
    sql: 'SELECT * FROM public.users WHERE EXISTS (SELECT 1 FROM public.orders WHERE user_id = public.users.id)',
    policy: {
      allowedTables: ['public.users', 'public.orders'],
      allowedFunctions: ['exists'],
      resolver: (name) => (name === 'users' ? 'public.users' : null),
    },
    expected: { ok: true },
  },
  {
    name: 'correlated scalar subquery',
    sql: 'SELECT * FROM public.users u WHERE (SELECT COUNT(*) FROM public.orders o WHERE o.user_id = u.id) > 0',
    policy: { allowedTables: ['public.users', 'public.orders'], allowedFunctions: ['count'] },
    expected: { ok: true },
  },
  {
    name: 'IN subquery with unauthorized table',
    sql: 'SELECT * FROM public.users WHERE id IN (SELECT user_id FROM public.secret_table)',
    policy: { allowedTables: ['public.users'] },
    expected: { ok: false, errorCode: ErrorCode.TABLE_NOT_ALLOWED },
  },
];
