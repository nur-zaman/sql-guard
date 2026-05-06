const fs = require('fs');
const file = 'src/analysis/functions.ts';
let code = fs.readFileSync(file, 'utf8');

const extractCode = `function extractFunctionIdentity(
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

  // Handle schema if it exists. Sometimes node-sql-parser puts schema as a string value, sometimes as an array
  let schema: string | undefined;
  if (typeof schemaNode.value === 'string' && schemaNode.value.length > 0) {
    schema = schemaNode.type === 'double_quote_string' ? \`"\${schemaNode.value}"\` : schemaNode.value.toLowerCase();
  } else if (Array.isArray(schemaNode.name)) {
    for (const part of schemaNode.name) {
      const partRecord = asRecord(part);
      if (typeof partRecord.value === 'string' && partRecord.value.length > 0) {
        schema = partRecord.type === 'double_quote_string' ? \`"\${partRecord.value}"\` : partRecord.value.toLowerCase();
        break;
      }
    }
  } else if (typeof schemaNode.name === 'string' && schemaNode.name.length > 0) {
    schema = schemaNode.name.toLowerCase();
  }

  if (typeof fnName.name === 'string' && fnName.name.length > 0) {
    return { name: fnName.name.toLowerCase(), schema };
  }

  if (Array.isArray(fnName.name)) {
    for (const part of fnName.name) {
      const partRecord = asRecord(part);
      if (typeof partRecord.value === 'string' && partRecord.value.length > 0) {
        const nameVal = partRecord.type === 'double_quote_string' ? \`"\${partRecord.value}"\` : partRecord.value.toLowerCase();
        return { name: nameVal, schema };
      }
    }
  }

  return null;
}`;

// need to replace extractFunctionIdentity
code = code.replace(/function extractFunctionIdentity\([\s\S]*?return null;\n\}/, extractCode);

fs.writeFileSync(file, code);
