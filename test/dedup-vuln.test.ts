import { describe, test, expect } from 'bun:test';
import { validate } from '../src/index';

describe('Deduplication vulnerability', () => {
  test('hides unauthorized table due to case-insensitive deduplication', () => {
    const policy = {
      allowedTables: ['public."SECRET_TABLE"'],
      defaultSchema: 'public'
    };
    // The node-sql-parser strips double quotes from the AST when there are multiple from clauses but
    // let's try a different query shape where it preserves it or where both map to same lowercase
    // This tests our fix more directly: using different casing that maps to the same lowercase but shouldn't be deduped
    const result = validate('SELECT * FROM "SECRET_TABLE", "secret_table"', policy);
    expect(result.ok).toBe(false); // It should be rejected because "secret_table" is not in allowed list
    expect(result.violations[0].message).toContain('secret_table');
  });
});
