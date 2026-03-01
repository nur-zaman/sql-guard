import { ErrorCode } from '../types/public';
import type { Policy, Violation } from '../types/public';

export interface CompiledPolicy {
  allowedTables: Set<string>;
  allowedFunctionsUnqualified: Set<string>;
  allowedFunctionsQualified: Set<string>;
}

type CompilePolicyResult =
  | { success: true; compiled: CompiledPolicy }
  | { success: false; errorCode: ErrorCode.INVALID_POLICY; violation: Violation };

export function compilePolicy(policy: Policy): CompilePolicyResult {
  if (!Array.isArray(policy.allowedTables)) {
    return invalidPolicy("Policy 'allowedTables' must be an array of schema-qualified names");
  }

  const allowedTables = new Set<string>();
  for (const table of policy.allowedTables) {
    const canonical = canonicalizeQualifiedName(table);
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

export function canonicalizeQualifiedName(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const cleaned = value.trim();
  if (!cleaned) {
    return null;
  }

  const parts = cleaned.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const schema = normalizeIdentifier(parts[0]);
  const table = normalizeIdentifier(parts[1]);
  if (!schema || !table) {
    return null;
  }

  return `${schema}.${table}`.toLowerCase();
}

function normalizeIdentifier(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
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
