import { ErrorCode } from '../../../src/index';
import type { PolicyFixture } from './types';

export const cteFixtures: PolicyFixture[] = [
  {
    name: 'simple CTE with allowed tables',
    sql: "WITH recent_users AS (SELECT * FROM public.users WHERE created_at > NOW() - INTERVAL '7 days') SELECT * FROM recent_users",
    policy: { allowedTables: ['public.users'], allowedFunctions: ['now'] },
    expected: { ok: true },
  },
  {
    name: 'multiple CTEs',
    sql: 'WITH a AS (SELECT * FROM public.users), b AS (SELECT * FROM public.orders) SELECT * FROM a JOIN b ON a.id = b.user_id',
    policy: { allowedTables: ['public.users', 'public.orders'] },
    expected: { ok: true },
  },
  {
    name: 'CTE referencing unauthorized table',
    sql: 'WITH cte AS (SELECT * FROM public.secret_table) SELECT * FROM cte',
    policy: { allowedTables: ['public.users'] },
    expected: { ok: false, errorCode: ErrorCode.TABLE_NOT_ALLOWED },
  },
  {
    name: 'recursive CTE is unsupported',
    sql: 'WITH RECURSIVE cte(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM cte WHERE n < 3) SELECT * FROM cte',
    policy: { allowedTables: ['public.users'] },
    expected: {
      ok: false,
      errorCode: ErrorCode.UNSUPPORTED_SQL_FEATURE,
      violationMessageIncludes: 'Recursive CTE is not supported',
    },
  },
];
