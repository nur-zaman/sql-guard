/**
 * llm-sql-guard
 * Validate AI-generated PostgreSQL queries against explicit table allowlists
 */

// Error codes enum
export enum ErrorCode {
  PARSE_ERROR = 'PARSE_ERROR',
  UNSUPPORTED_SQL_FEATURE = 'UNSUPPORTED_SQL_FEATURE',
  TABLE_NOT_ALLOWED = 'TABLE_NOT_ALLOWED',
  STATEMENT_NOT_ALLOWED = 'STATEMENT_NOT_ALLOWED',
  FUNCTION_NOT_ALLOWED = 'FUNCTION_NOT_ALLOWED',
  MULTI_STATEMENT_DISABLED = 'MULTI_STATEMENT_DISABLED',
}

// Policy types
export interface Policy {
  allowedTables: string[];
  allowedStatements?: ('select' | 'insert' | 'update' | 'delete')[];
  allowMultiStatement?: boolean;
  allowedFunctions?: string[];
  resolver?: (unqualified: string) => string | null;
}

// Result types
export interface ValidationResult {
  ok: boolean;
  violations: Violation[];
  errorCode?: ErrorCode;
}

export interface Violation {
  type: 'table' | 'statement' | 'function' | 'parse' | 'unsupported';
  message: string;
  location?: { line?: number; column?: number };
}

export class SqlValidationError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly violations: Violation[]
  ) {
    super(message);
    this.name = 'SqlValidationError';
  }
}

/**
 * Validates SQL against a policy
 * @param sql - The SQL query to validate
 * @param policy - The policy defining allowed tables, statements, etc.
 * @returns ValidationResult with ok status and any violations
 */
export function validate(sql: string, policy: Policy): ValidationResult {
  // Stub - returns ok: true for now (Task 9 will implement)
  return { ok: true, violations: [] };
}

/**
 * Validates SQL and throws SqlValidationError if invalid
 * @param sql - The SQL query to validate
 * @param policy - The policy defining allowed tables, statements, etc.
 * @throws SqlValidationError if validation fails
 */
export function assertSafeSql(sql: string, policy: Policy): void {
  const result = validate(sql, policy);
  if (!result.ok) {
    throw new SqlValidationError(
      `SQL validation failed: ${result.errorCode}`,
      result.errorCode || ErrorCode.UNSUPPORTED_SQL_FEATURE,
      result.violations
    );
  }
}
