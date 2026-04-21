/**
 * SQL Parser Adapter
 *
 * Wraps node-sql-parser to parse PostgreSQL SQL into an AST.
 * Extracts tables and functions for policy validation.
 *
 * @module
 */

import { Parser } from 'node-sql-parser';
import { ParseResult, ParsedStatement } from './types';
import { extractAllFunctions } from '../analysis/functions';
import { extractAllTables } from '../analysis/relations';
import { safeErrorMessage, safeString } from '../utils/safe-string';

const parser = new Parser();

/**
 * Parse a SQL string into an AST.
 *
 * Parses the SQL and extracts tables, functions, and statement types.
 * Returns a structured result that can be used for policy validation.
 *
 * @param sql - The SQL query to parse
 * @param dialect - SQL dialect to use (defaults to 'postgresql')
 * @returns ParseResult with success status and parsed statements or error info
 *
 * @example
 * ```typescript
 * const result = parseSql('SELECT * FROM public.users');
 * if (result.success) {
 *   console.log('Tables:', result.statements[0].tables);
 *   console.log('Functions:', result.statements[0].functions);
 * }
 * ```
 */
export function parseSql(sql: string, dialect: 'postgresql' = 'postgresql'): ParseResult {
  try {
    const ast = parser.astify(sql, { database: dialect });
    const statements = Array.isArray(ast) ? ast : [ast];

    return {
      success: true,
      statements: statements.map((statementAst) => astToParsedStatement(statementAst)),
    };
  } catch (error: unknown) {
    return {
      success: false,
      statements: [],
      error: {
        message: safeErrorMessage(error),
        location: extractParserErrorLocation(error),
      },
    };
  }
}

function astToParsedStatement(ast: unknown): ParsedStatement {
  const typed = asRecord(ast);

  return {
    type: extractStatementType(typed),
    tables: extractAllTables(ast),
    functions: extractAllFunctions(ast),
    raw: ast,
  };
}

function extractStatementType(ast: Record<string, unknown>): ParsedStatement['type'] {
  const type = safeString(ast.type || '').toLowerCase();
  if (['select', 'insert', 'update', 'delete'].includes(type)) {
    return type as ParsedStatement['type'];
  }
  return 'unknown';
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null) {
    return value as Record<string, unknown>;
  }
  return {};
}

function extractParserErrorLocation(error: unknown): { line: number; column: number } | undefined {
  if (!error || typeof error !== 'object') return undefined;

  const loc = (error as any).location;

  // node-sql-parser: { start: { line, column }, end: ... }
  const start = loc && typeof loc === 'object' ? (loc as any).start : undefined;
  if (start && typeof start.line === 'number' && typeof start.column === 'number') {
    return { line: start.line, column: start.column };
  }

  // Fallback: some parsers use { line, column } directly
  if (loc && typeof loc === 'object' && typeof loc.line === 'number' && typeof loc.column === 'number') {
    return { line: loc.line, column: loc.column };
  }

  return undefined;
}
