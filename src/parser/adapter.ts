import { Parser } from 'node-sql-parser';
import { ParseResult, ParsedStatement } from './types';
import { extractAllFunctions } from '../analysis/functions';
import { extractAllTables } from '../analysis/relations';

const parser = new Parser();

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
        message: error instanceof Error ? error.message : 'Parse error',
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
  const type = String(ast.type || '').toLowerCase();
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
