/**
 * Identifier Normalization
 *
 * Utilities for normalizing table references and checking them against allowlists.
 * Handles schema qualification, quoted identifiers, and resolver callbacks.
 *
 * @module
 */

import { canonicalizeIdentifier, parseQualifiedName } from './qualified-name';
import type { Policy, TableIdentifierMatching } from '../types/public';
import type { TableReference } from '../parser/types';

/**
 * A normalized, schema-qualified table reference.
 */
export interface NormalizedTable {
  /** Schema name (e.g., 'public') */
  schema: string;
  /** Table name */
  name: string;
  /** Fully qualified name in format 'schema.name' */
  fullyQualified: string;
}

/**
 * Result of normalizing a table reference.
 */
export interface NormalizationResult {
  /** Whether normalization succeeded */
  success: boolean;
  /** The normalized table (only present if success is true) */
  table?: NormalizedTable;
  /** Error message (only present if success is false) */
  error?: string;
}

/**
 * Normalize a table reference using the policy's resolver if needed.
 *
 * For schema-qualified references (e.g., `public.users`), extracts the schema
 * and name directly. For unqualified references (e.g., `users`), uses the
 * policy's resolver function to map to a fully qualified name.
 *
 * @param ref - The table reference from the parser
 * @param policy - The policy containing the resolver
 * @returns NormalizationResult with the normalized table or an error
 */
export function normalizeTableReference(
  ref: TableReference,
  policy: Policy,
  mode: TableIdentifierMatching = policy.tableIdentifierMatching ?? 'strict'
): NormalizationResult {
  if (ref.schema) {
    const schema = normalizeIdentifier(ref.schema, mode);
    const name = normalizeIdentifier(ref.name, mode);

    return {
      success: true,
      table: {
        schema,
        name,
        fullyQualified: `${schema}.${name}`,
      },
    };
  }

  if (policy.resolver) {
    let resolved: string | null;
    try {
      resolved = policy.resolver(ref.name);
    } catch (err) {
      let msg = 'Unknown error';
      if (err instanceof Error) {
        msg = err.message;
      } else {
        try {
          msg = String(err);
        } catch {
          msg = 'Error converting thrown value to string';
        }
      }
      return {
        success: false,
        error: `Resolver threw while resolving '${ref.name}': ${msg}`,
      };
    }

    if (typeof resolved === 'string' && resolved.trim().length > 0) {
      const parsed = parseQualifiedName(resolved, mode);
      if (!parsed) {
        return {
          success: false,
          error: `Resolver returned invalid table '${resolved}'. Expected 'schema.table'`,
        };
      }

      return {
        success: true,
        table: {
          schema: parsed.schema,
          name: parsed.name,
          fullyQualified: `${parsed.schema}.${parsed.name}`,
        },
      };
    }
  }

  // Fallback to defaultSchema if no resolver or resolver returned null/empty
  if (policy.defaultSchema) {
    const schema = normalizeIdentifier(policy.defaultSchema, mode);
    const name = normalizeIdentifier(ref.name, mode);
    return {
      success: true,
      table: {
        schema,
        name,
        fullyQualified: `${schema}.${name}`,
      },
    };
  }

  return {
    success: false,
    error: `Unqualified table reference '${ref.name}' not allowed. Provide 'defaultSchema' or 'resolver' in policy.`,
  };
}

function normalizeIdentifier(
  ident: string,
  mode: TableIdentifierMatching
): string {
  const trimmed = ident.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
    return canonicalizeIdentifier(trimmed.slice(1, -1).replace(/""/g, '"'), mode);
  }

  return canonicalizeIdentifier(trimmed, mode);
}

/**
 * Check if a normalized table is in the allowlist.
 *
 * Performs case-insensitive comparison against the allowed tables.
 *
 * @param normalized - The normalized table to check
 * @param allowedTables - Iterable of allowed table names (schema-qualified)
 * @returns True if the table is allowed
 */
export function isTableAllowed(
  normalized: NormalizedTable,
  allowedTables: Iterable<string>,
  mode: TableIdentifierMatching = 'strict'
): boolean {
  const wanted = `${canonicalizeIdentifier(normalized.schema, mode)}.${canonicalizeIdentifier(normalized.name, mode)}`;
  if (allowedTables instanceof Set) {
    return allowedTables.has(wanted);
  }

  for (const table of allowedTables) {
    const parsed = parseQualifiedName(table, mode);
    if (parsed && parsed.fullyQualified === wanted) {
      return true;
    }
  }

  return false;
}
