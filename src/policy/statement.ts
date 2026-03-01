import { ParsedStatement } from '../parser/types';
import { Policy, ErrorCode } from '../index';

export interface StatementCheckResult {
  allowed: boolean;
  errorCode?: ErrorCode;
  errorMessage?: string;
}

export type StatementType = 'select' | 'insert' | 'update' | 'delete';

export function isStatementAllowed(
  statement: ParsedStatement,
  policy: Policy
): StatementCheckResult {
  const type = statement.type;

  if (type === 'unknown') {
    return {
      allowed: false,
      errorCode: ErrorCode.STATEMENT_NOT_ALLOWED,
      errorMessage: 'Unknown statement type not allowed',
    };
  }

  const allowedStatements = policy.allowedStatements ?? ['select'];

  if (!allowedStatements.includes(type)) {
    return {
      allowed: false,
      errorCode: ErrorCode.STATEMENT_NOT_ALLOWED,
      errorMessage: `Statement type '${type}' not allowed. Allowed: ${allowedStatements.join(', ')}`,
    };
  }

  return { allowed: true };
}

export function checkMultiStatementPolicy(
  statements: ParsedStatement[],
  policy: Policy
): StatementCheckResult {
  const allowMulti = policy.allowMultiStatement ?? false;

  if (!allowMulti && statements.length > 1) {
    return {
      allowed: false,
      errorCode: ErrorCode.MULTI_STATEMENT_DISABLED,
      errorMessage: `Multiple statements not allowed. Found ${statements.length} statements.`,
    };
  }

  return { allowed: true };
}
