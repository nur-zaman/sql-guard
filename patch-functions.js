const fs = require('fs');
const file = 'src/analysis/functions.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `  function addFunction(name: unknown, schema: unknown): void {\n    if (typeof name !== 'string' || name.length === 0) return;\n\n    functions.push({\n      name: name.toLowerCase(),\n      schema: typeof schema === 'string' && schema.length > 0 ? schema.toLowerCase() : undefined,\n    });\n  }`,
  `  function addFunction(name: unknown, schema: unknown): void {\n    if (typeof name !== 'string' || name.length === 0) return;\n\n    functions.push({\n      name,\n      schema: typeof schema === 'string' && schema.length > 0 ? schema : undefined,\n    });\n  }`
);

const extractCode = `function extractFunctionIdentity(
  node: Record<string, unknown>
): { name: string; schema?: string } | null {
  if (node.type === 'aggr_func') {
    if (typeof node.name === 'string' && node.name.length > 0) {
      return { name: node.name };
    }
    return null;
  }

  if (node.type !== 'function') {
    return null;
  }

  const fnName = asRecord(node.name);
  const schemaNode = asRecord(fnName.schema);
  const schemaPart = Array.isArray(schemaNode.name) ? schemaNode.name[0] : null;
  const schemaRecord = asRecord(schemaPart);

  let schema: string | undefined;
  if (typeof schemaNode.value === 'string') {
    schema = schemaNode.value;
  } else if (schemaRecord && typeof schemaRecord.value === 'string') {
    schema = schemaRecord.type === 'double_quote_string' ? \`"\${schemaRecord.value}"\` : schemaRecord.value;
  }

  if (typeof fnName.name === 'string' && fnName.name.length > 0) {
    return { name: fnName.name, schema };
  }

  if (Array.isArray(fnName.name)) {
    for (const part of fnName.name) {
      const partRecord = asRecord(part);
      if (typeof partRecord.value === 'string' && partRecord.value.length > 0) {
        const nameVal = partRecord.type === 'double_quote_string' ? \`"\${partRecord.value}"\` : partRecord.value;
        return { name: nameVal, schema };
      }
    }
  }

  return null;
}`;

// need to replace extractFunctionIdentity
code = code.replace(/function extractFunctionIdentity\([\s\S]*?return null;\n\}/, extractCode);

fs.writeFileSync(file, code);
