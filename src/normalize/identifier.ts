import type { Policy } from '../types/public';
import type { TableReference } from '../parser/types';

export interface NormalizedTable {
  schema: string;
  name: string;
  fullyQualified: string;
}

export interface NormalizationResult {
  success: boolean;
  table?: NormalizedTable;
  error?: string;
}

export function normalizeTableReference(
  ref: TableReference,
  policy: Policy
): NormalizationResult {
  if (ref.schema) {
    const schema = normalizeIdentifier(ref.schema);
    const name = normalizeIdentifier(ref.name);

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
    const resolved = policy.resolver(ref.name);

    if (typeof resolved === 'string' && resolved.trim().length > 0) {
      const parsed = parseQualifiedName(resolved);
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

  return {
    success: false,
    error: `Unqualified table reference '${ref.name}' not allowed without resolver`,
  };
}

function normalizeIdentifier(ident: string): string {
  if (ident.startsWith('"') && ident.endsWith('"')) {
    return ident.slice(1, -1);
  }

  return ident.toLowerCase();
}

export function isTableAllowed(
  normalized: NormalizedTable,
  allowedTables: Iterable<string>
): boolean {
  const wanted = normalized.fullyQualified.toLowerCase();
  if (allowedTables instanceof Set) {
    return allowedTables.has(wanted);
  }

  for (const table of allowedTables) {
    if (table.toLowerCase().trim() === wanted) {
      return true;
    }
  }

  return false;
}

function parseQualifiedName(value: string): { schema: string; name: string } | null {
  const parts = value.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const schema = normalizeIdentifier(parts[0]);
  const name = normalizeIdentifier(parts[1]);
  if (!schema || !name) {
    return null;
  }

  return { schema, name };
}
