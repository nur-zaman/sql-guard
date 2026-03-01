import { ErrorCode } from '../../../src/index';
import type { PolicyFixture } from './types';

export const joinFixtures: PolicyFixture[] = [
  {
    name: 'INNER JOIN',
    sql: 'SELECT * FROM public.users u INNER JOIN public.orders o ON u.id = o.user_id',
    policy: { allowedTables: ['public.users', 'public.orders'] },
    expected: { ok: true },
  },
  {
    name: 'LEFT JOIN',
    sql: 'SELECT * FROM public.users u LEFT JOIN public.orders o ON u.id = o.user_id',
    policy: { allowedTables: ['public.users', 'public.orders'] },
    expected: { ok: true },
  },
  {
    name: 'RIGHT JOIN',
    sql: 'SELECT * FROM public.users u RIGHT JOIN public.orders o ON u.id = o.user_id',
    policy: { allowedTables: ['public.users', 'public.orders'] },
    expected: { ok: true },
  },
  {
    name: 'FULL JOIN',
    sql: 'SELECT * FROM public.users u FULL JOIN public.orders o ON u.id = o.user_id',
    policy: { allowedTables: ['public.users', 'public.orders'] },
    expected: { ok: true },
  },
  {
    name: 'CROSS JOIN',
    sql: 'SELECT * FROM public.users u CROSS JOIN public.orders o',
    policy: { allowedTables: ['public.users', 'public.orders'] },
    expected: { ok: true },
  },
  {
    name: 'self join',
    sql: 'SELECT * FROM public.users u JOIN public.users manager ON manager.id = u.manager_id',
    policy: { allowedTables: ['public.users'] },
    expected: { ok: true },
  },
  {
    name: 'JOIN with unauthorized table',
    sql: 'SELECT * FROM public.users u JOIN public.secret_table s ON u.id = s.user_id',
    policy: { allowedTables: ['public.users'] },
    expected: { ok: false, errorCode: ErrorCode.TABLE_NOT_ALLOWED },
  },
];
