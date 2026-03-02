import type { TableIdentifierMatching } from "../types/public";

export interface QualifiedNameParts {
  schema: string;
  name: string;
  fullyQualified: string;
}

export function parseQualifiedName(
  value: unknown,
  mode: TableIdentifierMatching = "strict",
): QualifiedNameParts | null {
  if (typeof value !== "string") {
    return null;
  }

  const segments = splitQualifiedNameSegments(value.trim());
  if (!segments || segments.length !== 2) {
    return null;
  }

  const schemaSegment = parseIdentifierSegment(segments[0]);
  const nameSegment = parseIdentifierSegment(segments[1]);
  if (!schemaSegment || !nameSegment) {
    return null;
  }

  const schema = canonicalizeIdentifier(schemaSegment.value, mode);
  const name = canonicalizeIdentifier(nameSegment.value, mode);
  if (!schema || !name) {
    return null;
  }

  return {
    schema,
    name,
    fullyQualified: `${schema}.${name}`,
  };
}

export function canonicalizeIdentifier(
  value: string,
  mode: TableIdentifierMatching,
): string {
  const trimmed = value.trim();
  return mode === "caseInsensitive" ? trimmed.toLowerCase() : trimmed;
}

function parseIdentifierSegment(value: string): { value: string } | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const hasLeadingQuote = trimmed.startsWith('"');
  const hasTrailingQuote = trimmed.endsWith('"');
  if (hasLeadingQuote || hasTrailingQuote) {
    if (!(hasLeadingQuote && hasTrailingQuote && trimmed.length >= 2)) {
      return null;
    }

    const inner = trimmed.slice(1, -1).replace(/""/g, '"');
    if (!inner) {
      return null;
    }
    return { value: inner };
  }

  if (trimmed.includes('"')) {
    return null;
  }

  return { value: trimmed };
}

function splitQualifiedNameSegments(value: string): string[] | null {
  if (!value) {
    return null;
  }

  const parts: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < value.length; i++) {
    const ch = value[i];

    if (ch === '"') {
      current += ch;
      if (inQuotes && value[i + 1] === '"') {
        current += '"';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (ch === "." && !inQuotes) {
      parts.push(current);
      current = "";
      continue;
    }

    current += ch;
  }

  if (inQuotes) {
    return null;
  }

  parts.push(current);
  return parts;
}
