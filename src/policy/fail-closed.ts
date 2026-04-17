import { ErrorCode } from '../types/public';
import { safeString } from '../utils/safe-string';

export interface UnsupportedCheckResult {
  supported: boolean;
  errorCode?: ErrorCode.UNSUPPORTED_SQL_FEATURE;
  errorMessage?: string;
}

const SUPPORTED_TYPES = new Set(['select', 'insert', 'update', 'delete']);
const WRITE_STATEMENT_TYPES = new Set(['insert', 'update', 'delete']);
const UNSUPPORTED_TYPES = new Set([
  'proc',
  'trigger',
  'drop',
  'create',
  'alter',
  'grant',
  'revoke',
  'truncate',
  'merge',
  'lock',
  'unlock',
  'declare',
  'set',
  'show',
  'analyze',
  'explain',
  'copy',
]);

const UNCERTAINTY_KEYS = new Set([
  'partial',
  'ispartial',
  'incomplete',
  'uncertain',
  'isuncertain',
  'ambiguous',
  'hasambiguity',
  'parseruncertain',
  'parser_uncertain',
]);

export function checkUnsupportedFeatures(ast: unknown): UnsupportedCheckResult {
  const type = extractStatementType(ast);

  if (UNSUPPORTED_TYPES.has(type)) {
    return {
      supported: false,
      errorCode: ErrorCode.UNSUPPORTED_SQL_FEATURE,
      errorMessage: `Statement type '${type}' is not supported`,
    };
  }

  if (!SUPPORTED_TYPES.has(type)) {
    return {
      supported: false,
      errorCode: ErrorCode.UNSUPPORTED_SQL_FEATURE,
      errorMessage: `Unknown statement type '${type}' is not supported`,
    };
  }

  if (hasRecursiveCte(ast)) {
    return {
      supported: false,
      errorCode: ErrorCode.UNSUPPORTED_SQL_FEATURE,
      errorMessage: 'Recursive CTE is not supported',
    };
  }

  if (hasSelectInto(ast, type)) {
    return {
      supported: false,
      errorCode: ErrorCode.UNSUPPORTED_SQL_FEATURE,
      errorMessage: 'SELECT INTO is not supported',
    };
  }

  const nestedWrite = findNestedWriteStatement(ast);
  if (nestedWrite) {
    return {
      supported: false,
      errorCode: ErrorCode.UNSUPPORTED_SQL_FEATURE,
      errorMessage: `Nested write statement '${nestedWrite.type}' is not supported at '${nestedWrite.path}'`,
    };
  }

  const uncertaintyPath = findUncertaintyMarker(ast);
  if (uncertaintyPath) {
    return {
      supported: false,
      errorCode: ErrorCode.UNSUPPORTED_SQL_FEATURE,
      errorMessage: `Parser uncertainty detected at '${uncertaintyPath}'`,
    };
  }

  return { supported: true };
}

function hasRecursiveCte(ast: unknown): boolean {
  if (typeof ast !== 'object' || ast === null) {
    return false;
  }

  const root = ast as Record<string, unknown>;
  const withClause = root.with;
  if (!Array.isArray(withClause)) {
    return false;
  }

  for (const withItem of withClause) {
    const item = asRecord(withItem);
    if (item.recursive === true) {
      return true;
    }
  }

  return false;
}

function hasSelectInto(ast: unknown, statementType: string): boolean {
  if (statementType !== 'select') {
    return false;
  }
  if (typeof ast !== 'object' || ast === null) {
    return false;
  }

  const root = ast as Record<string, unknown>;
  const into = root.into;
  if (into === null || into === undefined) {
    return false;
  }

  if (typeof into === 'string') {
    return into.trim().length > 0;
  }

  if (typeof into !== 'object') {
    return true;
  }

  const intoRecord = into as Record<string, unknown>;

  if (Object.hasOwn(intoRecord, 'expr')) {
    const expr = intoRecord.expr;
    if (typeof expr === 'string') {
      return expr.trim().length > 0;
    }
    return expr !== null && expr !== undefined;
  }

  if (Object.hasOwn(intoRecord, 'table')) {
    const table = intoRecord.table;
    if (typeof table === 'string') {
      return table.trim().length > 0;
    }
    return table !== null && table !== undefined;
  }

  return false;
}

function findNestedWriteStatement(
  value: unknown,
  path = 'ast',
  depth = 0,
  seen = new Set<object>()
): { type: string; path: string } | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  if (seen.has(value)) {
    return null;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const found = findNestedWriteStatement(value[i], `${path}[${i}]`, depth + 1, seen);
      if (found) {
        return found;
      }
    }
    return null;
  }

  const record = value as Record<string, unknown>;
  const type = typeof record.type === 'string' ? record.type.toLowerCase() : '';
  if (depth > 0 && WRITE_STATEMENT_TYPES.has(type)) {
    return { type, path };
  }

  for (const [key, nested] of Object.entries(record)) {
    const found = findNestedWriteStatement(nested, `${path}.${key}`, depth + 1, seen);
    if (found) {
      return found;
    }
  }

  return null;
}

function findUncertaintyMarker(value: unknown, path = 'ast', seen = new Set<object>()): string | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  if (seen.has(value)) {
    return null;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const found = findUncertaintyMarker(value[i], `${path}[${i}]`, seen);
      if (found) {
        return found;
      }
    }
    return null;
  }

  const record = value as Record<string, unknown>;
  for (const [key, nestedValue] of Object.entries(record)) {
    const normalizedKey = key.toLowerCase();

    if (UNCERTAINTY_KEYS.has(normalizedKey) && nestedValue === true) {
      return `${path}.${key}`;
    }

    if (
      (normalizedKey === 'errors' || normalizedKey === 'warnings') &&
      Array.isArray(nestedValue) &&
      nestedValue.length > 0
    ) {
      return `${path}.${key}`;
    }

    const found = findUncertaintyMarker(nestedValue, `${path}.${key}`, seen);
    if (found) {
      return found;
    }
  }

  return null;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null) {
    return value as Record<string, unknown>;
  }

  return {};
}

function extractStatementType(ast: unknown): string {
  if (!ast || typeof ast !== 'object') {
    return 'unknown';
  }

  const typed = ast as Record<string, unknown>;
  return safeString(typed.type, 'unknown').toLowerCase();
}
