/**
 * Statement Policy Validation
 *
 * Validates SQL statement types against policy restrictions.
 *
 * @module
 */

import { ParsedStatement } from '../parser/types';
import { ErrorCode } from '../types/public';
import type { Policy } from '../types/public';

/**
 * Result of checking if a statement type is allowed.
 */
export interface StatementCheckResult {
  /** Whether the statement type is allowed */
  allowed: boolean;
  /** Error code if not allowed */
  errorCode?: ErrorCode;
  /** Human-readable error message */
  errorMessage?: string;
}

/**
 * Supported SQL statement types.
 */
export type StatementType = 'select' | 'insert' | 'update' | 'delete';

/**
 * Check if a statement type is allowed by the policy.
 *
 * @param statement - The parsed statement to check
 * @param policy - The policy defining allowed statement types
 * @returns StatementCheckResult indicating if the statement is allowed
 */
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
    const validStatements = allowedStatements.filter((s) => typeof s === 'string');
    return {
      allowed: false,
      errorCode: ErrorCode.STATEMENT_NOT_ALLOWED,
      errorMessage: `Statement type '${type}' not allowed. Allowed: ${validStatements.join(', ')}`,
    };
  }

  return { allowed: true };
}

/**
 * Check if multiple statements are allowed by the policy.
 *
 * @param statements - Array of parsed statements
 * @param policy - The policy defining whether multiple statements are allowed
 * @returns StatementCheckResult indicating if multiple statements are allowed
 */
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
