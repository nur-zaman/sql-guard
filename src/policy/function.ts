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
    // Determine the actual name to check against policy.
    // The policy is compiled to lowercase.
    // If the function is extracted with quotes (e.g. '"LOWER"'), it means it was explicitly double-quoted.
    // In PostgreSQL, unquoted identifiers match case-insensitively (handled by comparing lowercased versions).
    // Quoted identifiers are case-sensitive. The policy expects exact match if the user provided quotes? No, the policy only accepts unquoted lowercase strings for allowedFunctions.
    // So if the AST name has double quotes, it should match the policy ONLY if the policy explicitly allowed it, or more simply, we strip quotes for checking if it matches the policy exactly?
    // Actually, if the AST name starts with a double quote, we can just use the literal name to check against the allowlist?
    // Wait, the allowlist compilation uses normalize(), which does `.toLowerCase()`. So `"LOWER"` in policy becomes `"lower"`.
    // Wait, no, policy entries shouldn't have quotes usually. If they do, they are lowercased.
    // So an attacker could bypass if we just use `.toLowerCase()`.
    // We should NOT use `.toLowerCase()` if it's quoted.
    // If it's quoted: `"LOWER"`. The policy has `lower`. `"LOWER"` !== `lower`. So it will be correctly denied!
    // Let's implement this logic:

    let normalizedName = fn.name;
    if (normalizedName.startsWith('"') && normalizedName.endsWith('"') && normalizedName.length >= 2) {
      // It is quoted. PostgreSQL treats it case-sensitively. We should NOT lowercase it.
      // But we should strip the quotes to compare with the allowlist (which might contain the exact case-sensitive name if the user put it there? Actually policy is always lowercased.
      // Wait, if policy is always lowercased, a case-sensitive function with uppercase letters can NEVER be allowed!
      // That is probably acceptable and secure by default.
      normalizedName = normalizedName.slice(1, -1).replace(/""/g, '"');
    } else {
      normalizedName = normalizedName.toLowerCase();
    }

    let normalizedSchema = fn.schema;
    if (typeof normalizedSchema === 'string') {
      if (normalizedSchema.startsWith('"') && normalizedSchema.endsWith('"') && normalizedSchema.length >= 2) {
        normalizedSchema = normalizedSchema.slice(1, -1).replace(/""/g, '"');
      } else {
        normalizedSchema = normalizedSchema.toLowerCase();
      }
    }

    const allowed = normalizedSchema
      ? allowlists.qualified.has(`${normalizedSchema}.${normalizedName}`)
      : allowlists.unqualified.has(normalizedName);
    if (allowed) continue;

    const key = `${normalizedSchema ?? ''}.${normalizedName}`;
    if (seenViolations.has(key)) continue;
    seenViolations.add(key);

    violations.push({
      // Re-add quotes for the error message so the user knows exactly what was blocked
      name: fn.name,
      schema: fn.schema,
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
