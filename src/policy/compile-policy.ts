import { ErrorCode } from '../types/public';
import { parseQualifiedName } from '../normalize/qualified-name';
import type { Policy, TableIdentifierMatching, Violation } from '../types/public';

export interface CompiledPolicy {
  allowedTables: Set<string>;
  allowedFunctionsUnqualified: Set<string>;
  allowedFunctionsQualified: Set<string>;
  tableIdentifierMatching: TableIdentifierMatching;
}

type CompilePolicyResult =
  | { success: true; compiled: CompiledPolicy }
  | { success: false; errorCode: ErrorCode.INVALID_POLICY; violation: Violation };

export function compilePolicy(policy: Policy): CompilePolicyResult {
  if (!Array.isArray(policy.allowedTables)) {
    return invalidPolicy("Policy 'allowedTables' must be an array of schema-qualified names");
  }

  const tableIdentifierMatching = policy.tableIdentifierMatching ?? 'strict';
  if (tableIdentifierMatching !== 'strict' && tableIdentifierMatching !== 'caseInsensitive') {
    return invalidPolicy("Policy 'tableIdentifierMatching' must be either 'strict' or 'caseInsensitive'");
  }

  const allowedTables = new Set<string>();
  for (const table of policy.allowedTables) {
    const canonical = canonicalizeQualifiedName(table, tableIdentifierMatching);
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
