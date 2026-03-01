import { TableReference } from '../parser/types';

export function extractAllTables(ast: unknown): TableReference[] {
  // First pass: collect all aliases from the entire AST
  const aliases = collectAliases(ast);
  const cteNames = collectCteNames(ast);
  
  // Second pass: extract tables
  const tables: TableReference[] = [];
  const visited = new Set<unknown>();

  function addTable(schema: unknown, name: unknown, alias: unknown): void {
    if (typeof name !== 'string' || name.length === 0) return;
    if (!isBaseRelation(name, cteNames, aliases)) return;

    tables.push({
      schema: typeof schema === 'string' ? schema : undefined,
      name,
      alias: typeof alias === 'string' ? alias : undefined,
    });
  }

  function traverse(node: unknown): void {
    if (!node || typeof node !== 'object') return;
    if (visited.has(node)) return;
    visited.add(node);

    const typed = node as Record<string, unknown>;

    if (Array.isArray(typed.from)) {
      for (const item of typed.from) {
        extractFromItem(item, addTable, traverse);
      }
    }

    if (Array.isArray(typed.join)) {
      for (const join of typed.join) {
        const joinItem = asRecord(join);
        addTable(joinItem.db, joinItem.table, joinItem.as);
        if (joinItem.expr) traverse(joinItem.expr);
      }
    }

    if (Array.isArray(typed.with)) {
      for (const cte of typed.with) {
        const cteNode = asRecord(cte);
        if (cteNode.stmt) traverse(cteNode.stmt);
      }
    }

    if (Array.isArray(typed.table)) {
      for (const tableItem of typed.table) {
        const tableNode = asRecord(tableItem);
        addTable(tableNode.db, tableNode.table, tableNode.as);
      }
    } else if (typed.table && typeof typed.table === 'object') {
      const singleTable = asRecord(typed.table);
      addTable(singleTable.db, singleTable.table, singleTable.as);
    } else if (typeof typed.table === 'string') {
      addTable(typed.db, typed.table, typed.as);
    }

    // Don't traverse into WHERE - column references there might use aliases
    // But DO traverse into subqueries in WHERE
    if (typed.where && typeof typed.where === 'object') {
      const whereNode = asRecord(typed.where);
      // Only traverse nested select statements, not column refs
      if (whereNode.type === 'select') {
        traverse(whereNode);
      }
    }

    if (Array.isArray(typed.columns)) {
      for (const column of typed.columns) {
        const columnNode = asRecord(column);
        // Only traverse subqueries in columns, not column refs
        if (columnNode.expr && typeof columnNode.expr === 'object') {
          const exprNode = asRecord(columnNode.expr);
          if (exprNode.type === 'select') {
            traverse(columnNode.expr);
          }
        }
      }
    }

    for (const value of Object.values(typed)) {
      if (value && typeof value === 'object') traverse(value);
    }
  }

  traverse(ast);

  // Deduplicate
  const seen = new Set<string>();
  return tables.filter((table) => {
    const key = `${(table.schema ?? '').toLowerCase()}.${table.name.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractFromItem(
  item: unknown,
  addTable: (schema: unknown, name: unknown, alias: unknown) => void,
  traverse: (node: unknown) => void
): void {
  if (!item || typeof item !== 'object') return;

  const typed = item as Record<string, unknown>;
  addTable(typed.db, typed.table, typed.as);

  if (typed.expr && typeof typed.expr === 'object') {
    traverse(typed.expr);
  }
}

function collectAliases(ast: unknown): Set<string> {
  const aliases = new Set<string>();
  const visited = new Set<unknown>();

  function walk(node: unknown): void {
    if (!node || typeof node !== 'object') return;
    if (visited.has(node)) return;
    visited.add(node);

    const typed = node as Record<string, unknown>;

    // Collect aliases from FROM clause
    if (Array.isArray(typed.from)) {
      for (const item of typed.from) {
        const fromItem = asRecord(item);
        if (typeof fromItem.as === 'string' && fromItem.as.length > 0) {
          aliases.add(fromItem.as.toLowerCase());
        }
      }
    }

    // Collect aliases from JOIN
    if (Array.isArray(typed.join)) {
      for (const join of typed.join) {
        const joinItem = asRecord(join);
        if (typeof joinItem.as === 'string' && joinItem.as.length > 0) {
          aliases.add(joinItem.as.toLowerCase());
        }
      }
    }

    // Recurse into all properties
    for (const value of Object.values(typed)) {
      if (value && typeof value === 'object') walk(value);
    }
  }

  walk(ast);
  return aliases;
}

function collectCteNames(ast: unknown): Set<string> {
  const names = new Set<string>();
  const visited = new Set<unknown>();

  function walk(node: unknown): void {
    if (!node || typeof node !== 'object') return;
    if (visited.has(node)) return;
    visited.add(node);

    const typed = node as Record<string, unknown>;

    if (Array.isArray(typed.with)) {
      for (const cte of typed.with) {
        const cteNode = asRecord(cte);
        const cteName = extractCteName(cteNode.name);
        if (cteName) names.add(cteName.toLowerCase());
      }
    }

    for (const value of Object.values(typed)) {
      if (value && typeof value === 'object') walk(value);
    }
  }

  walk(ast);
  return names;
}

function extractCteName(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return null;

  const typed = value as Record<string, unknown>;
  if (typeof typed.value === 'string' && typed.value.length > 0) {
    return typed.value;
  }
  return null;
}

function isBaseRelation(name: string, cteNames: Set<string>, aliases: Set<string>): boolean {
  const lowerName = name.toLowerCase();
  return !cteNames.has(lowerName) && !aliases.has(lowerName);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object') {
    return value as Record<string, unknown>;
  }
  return {};
}
