import type { Policy } from '../index';
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

    if (resolved) {
      const parts = resolved.split('.');

      if (parts.length === 2) {
        const schema = normalizeIdentifier(parts[0]);
        const name = normalizeIdentifier(parts[1]);

        return {
          success: true,
          table: {
            schema,
            name,
            fullyQualified: `${schema}.${name}`,
          },
        };
      }
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
  allowedTables: string[]
): boolean {
  const normalizedAllowed = allowedTables.map((table) => table.toLowerCase());

  if (normalizedAllowed.includes(normalized.fullyQualified.toLowerCase())) {
    return true;
  }

  if (normalizedAllowed.includes(normalized.name.toLowerCase())) {
    return true;
  }

  return false;
}
