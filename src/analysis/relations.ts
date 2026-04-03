import { TableReference } from '../parser/types';

export function extractAllTables(ast: unknown): TableReference[] {
  const tables: TableReference[] = [];
  const visited = new Set<unknown>();

  function addTable(schema: unknown, name: unknown, alias: unknown, cteScope: Set<string>): void {
    if (typeof name !== 'string' || name.length === 0) return;
    const hasSchema = typeof schema === 'string' && schema.length > 0;
    if (!hasSchema && cteScope.has(canonicalName(name))) {
      return;
    }

    tables.push({
      schema: hasSchema ? schema : undefined,
      name,
      alias: typeof alias === 'string' ? alias : undefined,
    });
  }

  function traverse(node: unknown, inheritedCtes: Set<string>): void {
    if (!node || typeof node !== 'object') return;
    if (visited.has(node)) return;
    visited.add(node);

    const typed = node as Record<string, unknown>;
    const localCtes = buildLocalCteScope(typed.with, inheritedCtes);

    if (Array.isArray(typed.with)) {
      for (const cte of typed.with) {
        const cteNode = asRecord(cte);
        if (cteNode.stmt) {
          traverse(cteNode.stmt, localCtes);
        }
      }
    }

    if (Array.isArray(typed.from)) {
      for (const item of typed.from) {
        extractFromItem(item, localCtes, addTable, traverse);
      }
    }

    if (Array.isArray(typed.join)) {
      for (const join of typed.join) {
        const joinItem = asRecord(join);
        addTable(joinItem.db, joinItem.table, joinItem.as, localCtes);
        if (joinItem.expr) {
          traverse(joinItem.expr, localCtes);
        }
      }
    }

    if (isRelationStatementType(typed.type)) {
      collectStatementTableTargets(typed.table, localCtes, addTable);
    }

    for (const [key, value] of Object.entries(typed)) {
      if (key === 'with') continue;
      if (value && typeof value === 'object') {
        traverse(value, localCtes);
      }
    }
  }

  traverse(ast, new Set<string>());

  // Deduplicate
  const seen = new Set<string>();
  return tables.filter((table) => {
    const key = `${table.schema ?? ''}.${table.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractFromItem(
  item: unknown,
  cteScope: Set<string>,
  addTable: (schema: unknown, name: unknown, alias: unknown, cteScope: Set<string>) => void,
  traverse: (node: unknown, cteScope: Set<string>) => void
): void {
  if (!item || typeof item !== 'object') return;

  const typed = item as Record<string, unknown>;
  addTable(typed.db, typed.table, typed.as, cteScope);

  if (typed.expr && typeof typed.expr === 'object') {
    traverse(typed.expr, cteScope);
  }
}

function extractCteName(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return null;

  const typed = value as Record<string, unknown>;
  if (typeof typed.value === 'string' && typed.value.length > 0) {
    if (typed.type === 'double_quote_string') {
      return `"${typed.value.replace(/"/g, '""')}"`;
    }
    return typed.value;
  }
  return null;
}

function buildLocalCteScope(withClause: unknown, inherited: Set<string>): Set<string> {
  const local = new Set(inherited);
  if (!Array.isArray(withClause)) {
    return local;
  }

  for (const cte of withClause) {
    const cteNode = asRecord(cte);
    const cteName = extractCteName(cteNode.name);
    if (cteName) {
      local.add(canonicalName(cteName));
    }
  }

  return local;
}

function collectStatementTableTargets(
  tableNode: unknown,
  cteScope: Set<string>,
  addTable: (schema: unknown, name: unknown, alias: unknown, cteScope: Set<string>) => void
): void {
  if (Array.isArray(tableNode)) {
    for (const tableItem of tableNode) {
      const tableRecord = asRecord(tableItem);
      addTable(tableRecord.db, tableRecord.table, tableRecord.as, cteScope);
    }
    return;
  }

  if (tableNode && typeof tableNode === 'object') {
    const tableRecord = asRecord(tableNode);
    addTable(tableRecord.db, tableRecord.table, tableRecord.as, cteScope);
    return;
  }

  if (typeof tableNode === 'string') {
    addTable(undefined, tableNode, undefined, cteScope);
  }
}

function isRelationStatementType(type: unknown): boolean {
  if (typeof type !== 'string') {
    return false;
  }

  const normalized = type.toLowerCase();
  return normalized === 'insert' || normalized === 'update' || normalized === 'delete';
}

function canonicalName(name: string): string {
  if (name.startsWith('"') && name.endsWith('"') && name.length >= 2) {
    return name.slice(1, -1).replace(/""/g, '"');
  }
  return name.toLowerCase();
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object') {
    return value as Record<string, unknown>;
  }
  return {};
}
