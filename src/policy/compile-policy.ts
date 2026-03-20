import { ErrorCode } from '../types/public';
import { canonicalizeIdentifier, parseQualifiedName, isUnqualifiedName } from '../normalize/qualified-name';
import type { Policy, TableIdentifierMatching, Violation } from '../types/public';

export interface CompiledPolicy {
  allowedTables: Set<string>;
  allowedFunctionsUnqualified: Set<string>;
  allowedFunctionsQualified: Set<string>;
  tableIdentifierMatching: TableIdentifierMatching;
  defaultSchema?: string;  // The normalized default schema at compile time
  maxQueryLength: number;
}

type CompilePolicyResult =
  | { success: true; compiled: CompiledPolicy }
  | { success: false; errorCode: ErrorCode.INVALID_POLICY; violation: Violation };

export function compilePolicy(policy: Policy): CompilePolicyResult {
  if (!policy || typeof policy !== 'object') {
    return invalidPolicy("Policy must be an object");
  }

  if (!Array.isArray(policy.allowedTables)) {
    return invalidPolicy("Policy 'allowedTables' must be an array of schema-qualified names");
  }

  const tableIdentifierMatching = policy.tableIdentifierMatching ?? 'strict';
  if (tableIdentifierMatching !== 'strict' && tableIdentifierMatching !== 'caseInsensitive') {
    return invalidPolicy("Policy 'tableIdentifierMatching' must be either 'strict' or 'caseInsensitive'");
  }

  const METADATA_SCHEMAS = new Set(['information_schema', 'pg_catalog']);

  if (policy.defaultSchema !== undefined && typeof policy.defaultSchema !== 'string') {
    return invalidPolicy("Policy 'defaultSchema' must be a string when provided");
  }

  const defaultSchema = policy.defaultSchema?.trim();
  if (defaultSchema !== undefined) {
    if (defaultSchema.length === 0) {
      return invalidPolicy("Policy 'defaultSchema' must be a non-empty string when provided");
    }
    // Validate defaultSchema is a valid identifier (no dots, special chars, etc.)
    if (defaultSchema.includes('.') || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(defaultSchema)) {
      return invalidPolicy("Policy 'defaultSchema' must be a valid SQL identifier without dots");
    }
    // Prevent defaultSchema from being a metadata schema to maintain explicit allowlisting
    if (METADATA_SCHEMAS.has(defaultSchema.toLowerCase())) {
      return invalidPolicy("Policy 'defaultSchema' cannot be a metadata schema (information_schema, pg_catalog). Metadata tables must be explicitly allowlisted.");
    }
  }

  const maxQueryLength = policy.maxQueryLength ?? 100000;
  if (typeof maxQueryLength !== 'number' || maxQueryLength <= 0 || !Number.isInteger(maxQueryLength)) {
    return invalidPolicy("Policy 'maxQueryLength' must be a positive integer");
  }

  // Normalize defaultSchema at compile time for consistency with runtime normalization
  const normalizedDefaultSchema = defaultSchema
    ? canonicalizeIdentifier(defaultSchema, tableIdentifierMatching)
    : undefined;

  const allowedTables = new Set<string>();
  for (const table of policy.allowedTables) {
    let tableToCanonicalize = table;

    // If entry is unqualified and defaultSchema is set, auto-qualify it
    // Uses quote-aware parsing to correctly handle quoted identifiers with dots (e.g., "audit.log")
    if (normalizedDefaultSchema && isUnqualifiedName(table)) {
      tableToCanonicalize = `${normalizedDefaultSchema}.${table}`;
    }

    const canonical = canonicalizeQualifiedName(tableToCanonicalize, tableIdentifierMatching);
    if (!canonical) {
      return invalidPolicy(
        `Policy entry '${String(table)}' is invalid. allowedTables entries must be schema-qualified as 'schema.table'`
      );
    }
    allowedTables.add(canonical);
  }

  const allowedFunctionsUnqualified = new Set<string>();
  const allowedFunctionsQualified = new Set<string>();

  if (policy.allowedFunctions !== undefined && !Array.isArray(policy.allowedFunctions)) {
    return invalidPolicy("Policy 'allowedFunctions' must be an array when provided");
  }

  if (policy.allowedStatements !== undefined && !Array.isArray(policy.allowedStatements)) {
    return invalidPolicy("Policy 'allowedStatements' must be an array when provided");
  }

  if (policy.allowMultiStatement !== undefined && typeof policy.allowMultiStatement !== 'boolean') {
    return invalidPolicy("Policy 'allowMultiStatement' must be a boolean when provided");
  }

  if (policy.resolver !== undefined && typeof policy.resolver !== 'function') {
    return invalidPolicy("Policy 'resolver' must be a function when provided");
  }

  for (const fn of policy.allowedFunctions ?? []) {
    const canonicalFunction = canonicalizeFunctionEntry(fn);
    if (!canonicalFunction) {
      return invalidPolicy(
        `Policy entry '${String(fn)}' is invalid. allowedFunctions entries must be 'function' or 'schema.function'`
      );
    }

    if (canonicalFunction.kind === 'qualified') {
      allowedFunctionsQualified.add(canonicalFunction.value);
    } else {
      allowedFunctionsUnqualified.add(canonicalFunction.value);
    }
  }

  return {
    success: true,
    compiled: {
      allowedTables,
      allowedFunctionsUnqualified,
      allowedFunctionsQualified,
      tableIdentifierMatching,
      defaultSchema: normalizedDefaultSchema,
      maxQueryLength,
    },
  };
}

function canonicalizeFunctionEntry(value: unknown):
  | { kind: 'unqualified'; value: string }
  | { kind: 'qualified'; value: string }
  | null {
  if (typeof value !== 'string') {
    return null;
  }

  const cleaned = value.trim().toLowerCase();
  if (!cleaned) {
    return null;
  }

  const parts = cleaned.split('.');
  if (parts.length === 1 && parts[0].length > 0) {
    return { kind: 'unqualified', value: parts[0] };
  }

  if (parts.length === 2 && parts[0].length > 0 && parts[1].length > 0) {
    return { kind: 'qualified', value: `${parts[0]}.${parts[1]}` };
  }

  return null;
}

export function canonicalizeQualifiedName(
  value: unknown,
  mode: TableIdentifierMatching = 'strict'
): string | null {
  const parsed = parseQualifiedName(value, mode);
  return parsed?.fullyQualified ?? null;
}

function invalidPolicy(message: string): CompilePolicyResult {
  return {
    success: false,
    errorCode: ErrorCode.INVALID_POLICY,
    violation: {
      type: 'policy',
      message,
    },
  };
}
