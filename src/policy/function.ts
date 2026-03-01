import { FunctionCall } from '../parser/types';
import { ErrorCode, Policy } from '../index';

export interface FunctionCheckResult {
  allowed: boolean;
  errorCode?: ErrorCode;
  errorMessage?: string;
  violations: Array<{ name: string; schema?: string }>;
}

export function checkFunctionsAllowed(
  functions: FunctionCall[],
  policy: Policy
): FunctionCheckResult {
  if (functions.length === 0) {
    return { allowed: true, violations: [] };
  }

  const allowlist = new Set((policy.allowedFunctions ?? []).map(normalize));
  const violations: Array<{ name: string; schema?: string }> = [];
  const seenViolations = new Set<string>();

  for (const fn of functions) {
    const normalizedName = fn.name.toLowerCase();
    const normalizedSchema = typeof fn.schema === 'string' ? fn.schema.toLowerCase() : undefined;
    const qualified = normalizedSchema ? `${normalizedSchema}.${normalizedName}` : normalizedName;

    const allowed = allowlist.has(normalizedName) || allowlist.has(qualified);
    if (allowed) continue;

    const key = `${normalizedSchema ?? ''}.${normalizedName}`;
    if (seenViolations.has(key)) continue;
    seenViolations.add(key);

    violations.push({
      name: normalizedName,
      schema: normalizedSchema,
    });
  }

  if (violations.length === 0) {
    return { allowed: true, violations: [] };
  }

  return {
    allowed: false,
    errorCode: ErrorCode.FUNCTION_NOT_ALLOWED,
    errorMessage: `Functions not allowed: ${violations.map(formatViolation).join(', ')}`,
    violations,
  };
}

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

function formatViolation(violation: { name: string; schema?: string }): string {
  if (violation.schema) {
    return `${violation.schema}.${violation.name}`;
  }
  return violation.name;
}
