import { FunctionCall } from '../parser/types';

export function extractAllFunctions(ast: unknown): FunctionCall[] {
  const functions: FunctionCall[] = [];
  const visited = new Set<unknown>();

  function addFunction(name: unknown, schema: unknown): void {
    if (typeof name !== 'string' || name.length === 0) return;

    functions.push({
      name: name.toLowerCase(),
      schema: typeof schema === 'string' && schema.length > 0 ? schema.toLowerCase() : undefined,
    });
  }

  function traverse(node: unknown): void {
    if (!node || typeof node !== 'object') return;
    if (visited.has(node)) return;
    visited.add(node);

    const typed = node as Record<string, unknown>;
    const identity = extractFunctionIdentity(typed);
    if (identity) addFunction(identity.name, identity.schema);

    for (const value of Object.values(typed)) {
      if (value && typeof value === 'object') traverse(value);
    }
  }

  traverse(ast);

  const seen = new Set<string>();
  return functions.filter((fn) => {
    const key = `${fn.schema ?? ''}.${fn.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractFunctionIdentity(
  node: Record<string, unknown>
): { name: string; schema?: string } | null {
  if (node.type === 'aggr_func') {
    if (typeof node.name === 'string' && node.name.length > 0) {
      return { name: node.name.toLowerCase() };
    }
    return null;
  }

  if (node.type !== 'function') {
    return null;
  }

  const fnName = asRecord(node.name);
  const schemaNode = asRecord(fnName.schema);
  const schema = typeof schemaNode.value === 'string' ? schemaNode.value : undefined;

  if (typeof fnName.name === 'string' && fnName.name.length > 0) {
    return { name: fnName.name.toLowerCase(), schema: schema?.toLowerCase() };
  }

  if (Array.isArray(fnName.name)) {
    for (const part of fnName.name) {
      const partRecord = asRecord(part);
      if (typeof partRecord.value === 'string' && partRecord.value.length > 0) {
        return { name: partRecord.value.toLowerCase(), schema: schema?.toLowerCase() };
      }
    }
  }

  return null;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object') {
    return value as Record<string, unknown>;
  }
  return {};
}
