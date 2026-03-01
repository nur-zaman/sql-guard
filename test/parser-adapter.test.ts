import { describe, test, expect } from 'bun:test';
import { parseSql } from '../src/parser/adapter';

describe('parseSql', () => {
  test('parses simple SELECT', () => {
    const result = parseSql('SELECT * FROM users');
    expect(result.success).toBe(true);
    expect(result.statements).toHaveLength(1);
    expect(result.statements[0].type).toBe('select');
    expect(result.statements[0].tables).toHaveLength(1);
    expect(result.statements[0].tables[0].name).toBe('users');
  });

  test('parses SELECT with schema', () => {
    const result = parseSql('SELECT * FROM public.users');
    expect(result.success).toBe(true);
    expect(result.statements[0].tables[0].schema).toBe('public');
    expect(result.statements[0].tables[0].name).toBe('users');
  });

  test('returns error for invalid SQL', () => {
    const result = parseSql('SELECT * FROM');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.statements).toHaveLength(0);
  });

  test('parses INSERT statement', () => {
    const result = parseSql("INSERT INTO users (name) VALUES ('John')");
    expect(result.success).toBe(true);
    expect(result.statements[0].type).toBe('insert');
  });

  test('parses UPDATE statement', () => {
    const result = parseSql("UPDATE users SET name = 'Jane' WHERE id = 1");
    expect(result.success).toBe(true);
    expect(result.statements[0].type).toBe('update');
  });

  test('parses DELETE statement', () => {
    const result = parseSql('DELETE FROM users WHERE id = 1');
    expect(result.success).toBe(true);
    expect(result.statements[0].type).toBe('delete');
  });
});
