/**
 * Error codes returned by the validator when SQL queries fail validation.
 * Used to identify the specific reason a query was rejected.
 *
 * @example
 * ```typescript
 * import { validate, ErrorCode } from 'llm-sql-guard';
 *
 * const result = validate('SELECT * FROM secret_table', { allowedTables: ['public.users'] });
 * if (result.errorCode === ErrorCode.TABLE_NOT_ALLOWED) {
 *   console.log('Query tried to access unauthorized table');
 * }
 * ```
 */
export enum ErrorCode {
  /** SQL could not be parsed into an AST */
  PARSE_ERROR = "PARSE_ERROR",
  /** Parsed SQL contains features outside the supported subset (fail closed) */
  UNSUPPORTED_SQL_FEATURE = "UNSUPPORTED_SQL_FEATURE",
  /** A referenced table is not in the policy allowlist */
  TABLE_NOT_ALLOWED = "TABLE_NOT_ALLOWED",
  /** Statement type (e.g., INSERT, UPDATE) is not allowed by the policy */
  STATEMENT_NOT_ALLOWED = "STATEMENT_NOT_ALLOWED",
  /** A function call is not in the policy allowlist */
  FUNCTION_NOT_ALLOWED = "FUNCTION_NOT_ALLOWED",
  /** Query contains multiple statements while allowMultiStatement is disabled */
  MULTI_STATEMENT_DISABLED = "MULTI_STATEMENT_DISABLED",
  /** Policy configuration is invalid */
  INVALID_POLICY = "INVALID_POLICY",
}

/**
 * Controls how table identifiers are matched against policy allowlists.
 *
 * - `strict`: exact case-sensitive matching (security-first default).
 * - `caseInsensitive`: case-insensitive matching.
 */
export type TableIdentifierMatching = "strict" | "caseInsensitive";

/**
 * Policy configuration that defines what SQL is allowed.
 * Used with {@link validate} and {@link assertSafeSql} to enforce query restrictions.
 *
 * @example
 * ```typescript
 * const policy: Policy = {
 *   allowedTables: ['public.users', 'public.orders'],
 *   allowedStatements: ['select'],
 *   allowedFunctions: ['count', 'lower'],
 *   allowMultiStatement: false,
 *   resolver: (name) => name === 'users' ? 'public.users' : null
 * };
 * ```
 */
export interface Policy {
  /**
   * List of allowed tables in schema-qualified format (e.g., 'public.users').
   * All tables referenced in SQL must be in this list.
   * @remarks Required field
   */
  allowedTables: string[];

  /**
   * List of allowed SQL statement types.
   * Defaults to `['select']` if not specified.
   * @default ['select']
   */
  allowedStatements?: ("select" | "insert" | "update" | "delete")[];

  /**
   * Whether to allow multiple statements in a single query (e.g., `SELECT 1; SELECT 2`).
   * Defaults to `false` for security.
   * @default false
   */
  allowMultiStatement?: boolean;

  /**
   * List of allowed functions. Functions not in this list will be rejected.
   * Use unqualified names (e.g., 'lower') to match unqualified calls.
   * Use qualified names (e.g., 'pg_catalog.current_database') to match qualified calls.
   * @default []
   */
  allowedFunctions?: string[];

  /**
   * Table identifier matching mode used for allowlist checks.
   * `strict` is the secure default and preserves case distinctions.
   * `caseInsensitive` enables case-insensitive behavior.
   * @default 'strict'
   */
  tableIdentifierMatching?: TableIdentifierMatching;

  /**
   * Optional resolver function to map unqualified table names to schema-qualified names.
   * Return the fully qualified table name (e.g., 'public.users') or null to deny.
   *
   * @example
   * ```typescript
   * resolver: (name) => {
   *   if (name === 'users') return 'public.users';
   *   if (name === 'orders') return 'public.orders';
   *   return null; // Deny unknown tables
   * }
   * ```
   */
  resolver?: (unqualified: string) => string | null;
}

/**
 * Result of validating a SQL query against a policy.
 * Returned by {@link validate}.
 *
 * @example
 * ```typescript
 * const result = validate('SELECT * FROM public.users', policy);
 * if (result.ok) {
 *   console.log('Query is safe');
 * } else {
 *   console.log('Violations:', result.violations);
 *   console.log('Error code:', result.errorCode);
 * }
 * ```
 */
export interface ValidationResult {
  /** Whether the SQL passed all policy checks */
  ok: boolean;
  /** List of violations found during validation (empty if ok is true) */
  violations: Violation[];
  /** Error code categorizing why validation failed (undefined if ok is true) */
  errorCode?: ErrorCode;
}

/**
 * A single violation found during SQL validation.
 * Part of the {@link ValidationResult.violations} array.
 */
export interface Violation {
  /** Type of violation */
  type: "table" | "statement" | "function" | "parse" | "unsupported" | "policy";
  /** Human-readable description of the violation */
  message: string;
  /**
   * Source location where the violation occurred, if available.
   * Line and column numbers are 1-indexed.
   */
  location?: { line?: number; column?: number };
}

/**
 * Error thrown by {@link assertSafeSql} when validation fails.
 * Extends the standard Error class with additional context.
 *
 * @example
 * ```typescript
 * try {
 *   assertSafeSql('SELECT * FROM secret_table', policy);
 * } catch (err) {
 *   if (err instanceof SqlValidationError) {
 *     console.log('Error code:', err.code);
 *     console.log('Violations:', err.violations);
 *   }
 * }
 * ```
 */
export class SqlValidationError extends Error {
  /**
   * Creates a new SqlValidationError.
   * @param message - Error message
   * @param code - Error code categorizing the failure
   * @param violations - Array of specific violations found
   */
  constructor(
    message: string,
    /** Error code indicating the type of validation failure */
    public readonly code: ErrorCode,
    /** Detailed violations that caused the failure */
    public readonly violations: Violation[],
  ) {
    super(message);
    this.name = "SqlValidationError";
  }
}
