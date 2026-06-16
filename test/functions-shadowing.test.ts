import { describe, test, expect } from 'bun:test';
import { parseSql } from '../src/parser/adapter';
import { extractAllFunctions } from '../src/analysis/functions';

describe('extractAllFunctions', () => {
  test('prevents deduplication shadowing of unquoted and quoted functions', () => {
    const result = parseSql('SELECT "LOWER"(name), lower(name) FROM users');
    const functions = extractAllFunctions(result.statements[0].raw);
    expect(functions).toHaveLength(2);
    expect(functions.map((fn) => fn.name).sort()).toEqual(['"LOWER"', 'lower']);
  });
});
