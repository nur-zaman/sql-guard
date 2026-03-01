import { describe, test, expect } from 'bun:test';
import { parseSql } from '../src/parser/adapter';
import { extractAllTables } from '../src/analysis/relations';

describe('extractAllTables', () => {
  test('extracts table from simple SELECT', () => {
    const result = parseSql('SELECT * FROM users');
    const tables = extractAllTables(result.statements[0].raw);
    expect(tables).toHaveLength(1);
    expect(tables[0].name).toBe('users');
  });

  test('extracts tables from JOIN', () => {
    const result = parseSql('SELECT * FROM users JOIN orders ON users.id = orders.user_id');
    const tables = extractAllTables(result.statements[0].raw);
    expect(tables.map((table) => table.name).sort()).toEqual(['orders', 'users']);
  });

  test('extracts tables from CTE without counting CTE name', () => {
    const result = parseSql('WITH user_orders AS (SELECT * FROM orders) SELECT * FROM user_orders');
    const tables = extractAllTables(result.statements[0].raw);
    expect(tables.map((table) => table.name)).toEqual(['orders']);
  });

  test('extracts tables from subquery in FROM', () => {
    const result = parseSql('SELECT * FROM (SELECT * FROM users) AS u');
    const tables = extractAllTables(result.statements[0].raw);
    expect(tables.map((table) => table.name)).toContain('users');
  });

  test('extracts tables from INSERT', () => {
    const result = parseSql("INSERT INTO users (name) VALUES ('John')");
    const tables = extractAllTables(result.statements[0].raw);
    expect(tables.map((table) => table.name)).toContain('users');
  });

  test('extracts source and target tables from INSERT ... SELECT', () => {
    const result = parseSql('INSERT INTO users (name) SELECT name FROM staging_users');
    const tables = extractAllTables(result.statements[0].raw);
    expect(tables.map((table) => table.name).sort()).toEqual(['staging_users', 'users']);
  });

  test('extracts tables from UPDATE ... FROM', () => {
    const result = parseSql("UPDATE users SET name = 'Jane' FROM accounts a WHERE users.id = a.user_id");
    const tables = extractAllTables(result.statements[0].raw);
    expect(tables.map((table) => table.name).sort()).toEqual(['accounts', 'users']);
  });

  test('extracts tables from DELETE', () => {
    const result = parseSql('DELETE FROM users');
    const tables = extractAllTables(result.statements[0].raw);
    expect(tables.map((table) => table.name)).toContain('users');
  });
});
