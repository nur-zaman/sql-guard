export enum ErrorCode {
  PARSE_ERROR = 'PARSE_ERROR',
  UNSUPPORTED_SQL_FEATURE = 'UNSUPPORTED_SQL_FEATURE',
  TABLE_NOT_ALLOWED = 'TABLE_NOT_ALLOWED',
  STATEMENT_NOT_ALLOWED = 'STATEMENT_NOT_ALLOWED',
  FUNCTION_NOT_ALLOWED = 'FUNCTION_NOT_ALLOWED',
  MULTI_STATEMENT_DISABLED = 'MULTI_STATEMENT_DISABLED',
  INVALID_POLICY = 'INVALID_POLICY',
}

export interface Policy {
  allowedTables: string[];
  allowedStatements?: ('select' | 'insert' | 'update' | 'delete')[];
  allowMultiStatement?: boolean;
  allowedFunctions?: string[];
  resolver?: (unqualified: string) => string | null;
}

export interface ValidationResult {
  ok: boolean;
  violations: Violation[];
  errorCode?: ErrorCode;
}

export interface Violation {
  type: 'table' | 'statement' | 'function' | 'parse' | 'unsupported' | 'policy';
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
