/**
 * Function Policy Validation
 *
 * Validates function calls against policy allowlists.
 *
 * @module
 */

import { FunctionCall } from '../parser/types';
import { ErrorCode } from '../types/public';
import type { CompiledPolicy } from './compile-policy';
import type { Policy } from '../types/public';

/**
 * Result of checking if functions are allowed.
 */
export interface FunctionCheckResult {
  /** Whether all functions are allowed */
  allowed: boolean;
  /** Error code if any function is not allowed */
  errorCode?: ErrorCode;
  /** Human-readable error message */
  errorMessage?: string;
  /** List of disallowed functions */
  violations: Array<{ name: string; schema?: string }>;
}

/**
 * Check if functions in a parsed statement are allowed by the policy.
 *
 * @param functions - Array of function calls from the parser
 * @param policy - The policy containing allowed functions
 * @returns FunctionCheckResult indicating if all functions are allowed
 */
export function checkFunctionsAllowed(
  functions: FunctionCall[],
  policy: Policy
): FunctionCheckResult {
  const allowlists = compileFunctionAllowlists(policy.allowedFunctions ?? []);
  return checkFunctionsAllowedWithAllowlists(functions, allowlists);
}

/**
 * Check if functions are allowed using a compiled policy.
 *
 * @param functions - Array of function calls from the parser
 * @param policy - The compiled policy containing function allowlists
 * @returns FunctionCheckResult indicating if all functions are allowed
 */
export function checkFunctionsAllowedCompiled(
  functions: FunctionCall[],
  policy: CompiledPolicy
): FunctionCheckResult {
  return checkFunctionsAllowedWithAllowlists(functions, {
    unqualified: policy.allowedFunctionsUnqualified,
    qualified: policy.allowedFunctionsQualified,
  });
}

function checkFunctionsAllowedWithAllowlists(
  functions: FunctionCall[],
  allowlists: { unqualified: Set<string>; qualified: Set<string> }
): FunctionCheckResult {
  if (functions.length === 0) {
    return { allowed: true, violations: [] };
  }

  const violations: Array<{ name: string; schema?: string }> = [];
  const seenViolations = new Set<string>();

  for (const fn of functions) {
    const normalizedName = fn.name;
    const normalizedSchema = typeof fn.schema === 'string' ? fn.schema : undefined;
    const allowed = normalizedSchema
      ? allowlists.qualified.has(`${normalizedSchema}.${normalizedName}`)
      : allowlists.unqualified.has(normalizedName);
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

function compileFunctionAllowlists(allowedFunctions: string[]): {
  unqualified: Set<string>;
  qualified: Set<string>;
} {
  const unqualified = new Set<string>();
  const qualified = new Set<string>();

  for (const rawEntry of allowedFunctions) {
    const entry = normalize(rawEntry);
    if (!entry) continue;

    const parts = entry.split('.');
    if (parts.length === 1 && parts[0].length > 0) {
      unqualified.add(parts[0]);
      continue;
    }

    if (parts.length === 2 && parts[0].length > 0 && parts[1].length > 0) {
      qualified.add(`${parts[0]}.${parts[1]}`);
    }
  }

  return { unqualified, qualified };
}

function formatViolation(violation: { name: string; schema?: string }): string {
  if (violation.schema) {
    return `${violation.schema}.${violation.name}`;
  }
  return violation.name;
}
