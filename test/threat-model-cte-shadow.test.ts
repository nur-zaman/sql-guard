import { test, expect } from 'bun:test';
import { validate } from '../src/index';

test('prevents shadowing via CTE with quoted names', () => {
  const sql = 'WITH "SECRET_TABLE" AS (SELECT 1) SELECT * FROM secret_table';
  const policy = {
    allowedTables: ['public.dummy'],
  };
  const result = validate(sql, policy);
  expect(result.ok).toBe(false);
  expect(result.violations[0].message).toContain("secret_table");
});
