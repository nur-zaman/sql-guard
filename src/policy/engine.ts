/**
 * Policy Validation Engine
 *
 * Core validation logic that orchestrates parsing, policy compilation,
 * and violation detection.
 *
 * @module
 */

import { parseSql } from '../parser/adapter';
import { checkFunctionsAllowedCompiled } from './function';
import { normalizeTableReference, isTableAllowed } from '../normalize/identifier';
import { checkMultiStatementPolicy, isStatementAllowed } from './statement';
import { checkUnsupportedFeatures } from './fail-closed';
import { ErrorCode } from '../types/public';
import { compilePolicy } from './compile-policy';
import type { CompiledPolicy } from './compile-policy';
import type { Policy, ValidationResult, Violation } from '../types/public';

/**
 * Internal result type used during validation.
 */
export interface EngineResult {
  ok: boolean;
  violations: Violation[];
  errorCode?: ErrorCode;
}

const METADATA_SCHEMAS = new Set(['information_schema', 'pg_catalog']);

/**
 * Validate a SQL query against a policy.
 *
 * This is the main validation function used by {@link validate}.
 * It compiles the policy, parses the SQL, and checks all constraints.
 *
 * @param sql - The SQL query to validate
 * @param policy - The policy to validate against
 * @returns ValidationResult indicating success or failure with violations
 */
export function validateAgainstPolicy(sql: string, policy: Policy): ValidationResult {
  if (typeof sql !== 'string') {
    return {
      ok: false,
      violations: [
        {
          type: 'parse',
          message: 'Input must be a SQL string',
        },
      ],
      errorCode: ErrorCode.PARSE_ERROR,
    };
  }

  const compiledPolicyResult = compilePolicy(policy);
  if (!compiledPolicyResult.success) {
    return {
      ok: false,
      violations: [compiledPolicyResult.violation],
      errorCode: compiledPolicyResult.errorCode,
    };
  }

  const compiledPolicy = compiledPolicyResult.compiled;

  if (sql.length > compiledPolicy.maxQueryLength) {
    return {
      ok: false,
      violations: [
        {
          type: 'policy',
          message: `SQL query exceeds maximum allowed length of ${compiledPolicy.maxQueryLength} characters`,
        },
      ],
      errorCode: ErrorCode.QUERY_TOO_LARGE,
    };
  }

  const parsed = parseSql(sql);
  if (!parsed.success) {
    const parseViolation: Violation = {
      type: 'parse',
      message: parsed.error?.message ?? 'Parse error',
      location: parsed.error?.location,
    };

    return {
      ok: false,
      violations: [parseViolation],
      errorCode: ErrorCode.PARSE_ERROR,
    };
  }

  const violations: Violation[] = [];
  const seenViolations = new Set<string>();
  const errorCodes: ErrorCode[] = [];

  for (const statement of parsed.statements) {
    const unsupportedCheck = checkUnsupportedFeatures(statement.raw);
    if (!unsupportedCheck.supported) {
      return {
        ok: false,
        violations: [
          {
            type: 'unsupported',
            message: unsupportedCheck.errorMessage ?? 'Unsupported SQL feature',
          },
        ],
        errorCode: unsupportedCheck.errorCode ?? ErrorCode.UNSUPPORTED_SQL_FEATURE,
      };
    }
  }

  const multiStatementCheck = checkMultiStatementPolicy(parsed.statements, policy);
  if (!multiStatementCheck.allowed) {
    pushViolation(
      violations,
      seenViolations,
      {
        type: 'statement',
        message: multiStatementCheck.errorMessage ?? 'Multiple statements not allowed',
      },
      multiStatementCheck.errorCode,
      errorCodes
    );
  }

  for (const statement of parsed.statements) {
    const statementCheck = isStatementAllowed(statement, policy);
    if (!statementCheck.allowed) {
      pushViolation(
        violations,
        seenViolations,
        {
          type: 'statement',
          message: statementCheck.errorMessage ?? `Statement type '${statement.type}' not allowed`,
        },
        statementCheck.errorCode,
        errorCodes
      );
    }

    for (const tableRef of statement.tables) {
      const normalized = normalizeTableReference(
        tableRef,
        policy,
        compiledPolicy.tableIdentifierMatching
      );
      if (!normalized.success || !normalized.table) {
        pushViolation(
          violations,
          seenViolations,
          {
            type: 'table',
            message: normalized.error ?? `Table '${tableRef.name}' is not allowed`,
            location: tableRef.location,
          },
          ErrorCode.TABLE_NOT_ALLOWED,
          errorCodes
        );
        continue;
      }

      const metadataDenied = isMetadataTableDenied(
        normalized.table.schema,
        normalized.table.fullyQualified,
        compiledPolicy
      );
      const tableAllowed = isTableAllowed(
        normalized.table,
        compiledPolicy.allowedTables,
        compiledPolicy.tableIdentifierMatching
      );

      if (metadataDenied || !tableAllowed) {
        const message = metadataDenied
          ? `Metadata table '${normalized.table.fullyQualified}' is not allowed`
          : `Table '${normalized.table.fullyQualified}' is not allowed`;

        pushViolation(
          violations,
          seenViolations,
          {
            type: 'table',
            message,
            location: tableRef.location,
          },
          ErrorCode.TABLE_NOT_ALLOWED,
          errorCodes
        );
      }
    }

    const functionCheck = checkFunctionsAllowedCompiled(statement.functions, compiledPolicy);
    if (!functionCheck.allowed) {
      for (const violation of functionCheck.violations) {
        pushViolation(
          violations,
          seenViolations,
          {
            type: 'function',
            message: violation.schema
              ? `Function '${violation.schema}.${violation.name}' is not allowed`
              : `Function '${violation.name}' is not allowed`,
          },
          functionCheck.errorCode,
          errorCodes
        );
      }
    }
  }

  if (violations.length === 0) {
    return { ok: true, violations: [] };
  }

  return {
    ok: false,
    violations,
    errorCode: pickErrorCode(errorCodes),
  };
}

function isMetadataTableDenied(schema: string, fullyQualified: string, policy: CompiledPolicy): boolean {
  if (!METADATA_SCHEMAS.has(schema.toLowerCase())) {
    return false;
  }

  return !policy.allowedTables.has(fullyQualified);
}

function pushViolation(
  violations: Violation[],
  seenViolations: Set<string>,
  violation: Violation,
  errorCode: ErrorCode | undefined,
  errorCodes: ErrorCode[]
): void {
  const key = `${violation.type}:${violation.message}:${violation.location?.line ?? ''}:${violation.location?.column ?? ''}`;
  if (seenViolations.has(key)) {
    return;
  }

  seenViolations.add(key);
  violations.push(violation);

  if (errorCode) {
    errorCodes.push(errorCode);
  }
}

function pickErrorCode(errorCodes: ErrorCode[]): ErrorCode | undefined {
  if (errorCodes.length === 0) {
    return undefined;
  }

  return [...errorCodes].sort((left, right) => precedenceOf(left) - precedenceOf(right))[0];
}

function precedenceOf(errorCode: ErrorCode): number {
  switch (errorCode) {
    case ErrorCode.PARSE_ERROR:
      return 0;
    case ErrorCode.QUERY_TOO_LARGE:
      return 1;
    case ErrorCode.INVALID_POLICY:
      return 2;
    case ErrorCode.STATEMENT_NOT_ALLOWED:
      return 3;
    case ErrorCode.TABLE_NOT_ALLOWED:
      return 4;
    case ErrorCode.FUNCTION_NOT_ALLOWED:
      return 5;
    case ErrorCode.MULTI_STATEMENT_DISABLED:
      return 6;
    case ErrorCode.UNSUPPORTED_SQL_FEATURE:
    default:
      return 7;
  }
}
