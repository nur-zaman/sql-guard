/**
 * sql-guard
 *
 * Validate AI-generated PostgreSQL queries against explicit table allowlists.
 * This package parses SQL into an AST and denies anything outside your policy.
 *
 * @example
 * ```typescript
 * import { validate, assertSafeSql, ErrorCode } from 'sql-guard';
 *
 * const policy = {
 *   allowedTables: ['public.users', 'public.orders'],
 *   allowedFunctions: ['count', 'lower'],
 * };
 *
 * // Non-throwing validation
 * const result = validate('SELECT * FROM public.users', policy);
 * if (!result.ok) {
 *   console.log('Denied:', result.errorCode);
 *   console.log('Violations:', result.violations);
 * }
 *
 * // Throwing validation
 * assertSafeSql('SELECT lower(u.email) FROM public.users u', policy);
 * ```
 *
 * @packageDocumentation
 */

import { validateAgainstPolicy } from './policy/engine';
import { ErrorCode, SqlValidationError } from './types/public';
import type { Policy, ValidationResult } from './types/public';

/**
 * Validates SQL against a policy.
 *
 * Parses the SQL and checks it against the policy rules. Returns a result object
 * indicating whether the SQL is allowed and any violations found.
 *
 * This function never throws. All errors are captured in the returned ValidationResult.
 *
 * @param sql - The SQL query to validate
 * @param policy - The policy defining allowed tables, statements, etc.
 * @returns ValidationResult with ok status and any violations
 *
 * @example
 * ```typescript
 * const result = validate('SELECT * FROM public.users', {
 *   allowedTables: ['public.users'],
 *   allowedFunctions: ['count']
 * });
 *
 * if (result.ok) {
 *   console.log('Query is safe');
 * } else {
 *   console.log('Blocked:', result.errorCode);
 *   console.log('Reason:', result.violations[0]?.message);
 * }
 * ```
 */
export function validate(sql: string, policy: Policy): ValidationResult {
  return validateAgainstPolicy(sql, policy);
}

/**
 * Validates SQL and throws SqlValidationError if invalid.
 *
 * Same as {@link validate} but throws an exception on validation failure
 * instead of returning a result object. Useful for fail-fast scenarios.
 *
 * @param sql - The SQL query to validate
 * @param policy - The policy defining allowed tables, statements, etc.
 * @throws SqlValidationError if validation fails
 *
 * @example
 * ```typescript
 * try {
 *   assertSafeSql('SELECT * FROM public.users', policy);
 *   // Query is safe, proceed with execution
 * } catch (err) {
 *   if (err instanceof SqlValidationError) {
 *     console.error('Query blocked:', err.code);
 *   }
 * }
 * ```
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

// Re-export types and functions for advanced use cases
export { ErrorCode, SqlValidationError };
export type { Policy, ValidationResult, TableIdentifierMatching } from './types/public';
export type { Violation } from './types/public';
export { parseSql } from './parser/adapter';
export type { ParseResult, ParsedStatement, TableReference, FunctionCall } from './parser/types';
export { normalizeTableReference, isTableAllowed } from './normalize/identifier';
export type { NormalizedTable, NormalizationResult } from './normalize/identifier';
export { isStatementAllowed, checkMultiStatementPolicy } from './policy/statement';
export type { StatementCheckResult, StatementType } from './policy/statement';
export { extractAllTables } from './analysis/relations';
export { extractAllFunctions } from './analysis/functions';
export { checkFunctionsAllowed } from './policy/function';
export type { FunctionCheckResult } from './policy/function';
export { validateAgainstPolicy } from './policy/engine';
export type { EngineResult } from './policy/engine';
