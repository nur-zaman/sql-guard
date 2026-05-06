const fs = require('fs');
const file = 'src/policy/function.ts';
let code = fs.readFileSync(file, 'utf8');

const replacement = `  for (const fn of functions) {
    // Determine the actual name to check against policy.
    // The policy is compiled to lowercase.
    // If the function is extracted with quotes (e.g. '"LOWER"'), it means it was explicitly double-quoted.
    // In PostgreSQL, unquoted identifiers match case-insensitively (handled by comparing lowercased versions).
    // Quoted identifiers are case-sensitive. The policy expects exact match if the user provided quotes? No, the policy only accepts unquoted lowercase strings for allowedFunctions.
    // So if the AST name has double quotes, it should match the policy ONLY if the policy explicitly allowed it, or more simply, we strip quotes for checking if it matches the policy exactly?
    // Actually, if the AST name starts with a double quote, we can just use the literal name to check against the allowlist?
    // Wait, the allowlist compilation uses normalize(), which does \`.toLowerCase()\`. So \`"LOWER"\` in policy becomes \`"lower"\`.
    // Wait, no, policy entries shouldn't have quotes usually. If they do, they are lowercased.
    // So an attacker could bypass if we just use \`.toLowerCase()\`.
    // We should NOT use \`.toLowerCase()\` if it's quoted.
    // If it's quoted: \`"LOWER"\`. The policy has \`lower\`. \`"LOWER"\` !== \`lower\`. So it will be correctly denied!
    // Let's implement this logic:

    let normalizedName = fn.name;
    if (normalizedName.startsWith('"') && normalizedName.endsWith('"') && normalizedName.length >= 2) {
      // It is quoted. PostgreSQL treats it case-sensitively. We should NOT lowercase it.
      // But we should strip the quotes to compare with the allowlist (which might contain the exact case-sensitive name if the user put it there? Actually policy is always lowercased.
      // Wait, if policy is always lowercased, a case-sensitive function with uppercase letters can NEVER be allowed!
      // That is probably acceptable and secure by default.
      normalizedName = normalizedName.slice(1, -1).replace(/""/g, '"');
    } else {
      normalizedName = normalizedName.toLowerCase();
    }

    let normalizedSchema = fn.schema;
    if (typeof normalizedSchema === 'string') {
      if (normalizedSchema.startsWith('"') && normalizedSchema.endsWith('"') && normalizedSchema.length >= 2) {
        normalizedSchema = normalizedSchema.slice(1, -1).replace(/""/g, '"');
      } else {
        normalizedSchema = normalizedSchema.toLowerCase();
      }
    }

    const allowed = normalizedSchema
      ? allowlists.qualified.has(\`\${normalizedSchema}.\${normalizedName}\`)
      : allowlists.unqualified.has(normalizedName);
    if (allowed) continue;

    const key = \`\${normalizedSchema ?? ''}.\${normalizedName}\`;
    if (seenViolations.has(key)) continue;
    seenViolations.add(key);

    violations.push({
      // Re-add quotes for the error message so the user knows exactly what was blocked
      name: fn.name,
      schema: fn.schema,
    });
  }`;

// Use regex to replace the for loop body
code = code.replace(/  for \(const fn of functions\) {[\s\S]*?    }\);[\n\s]*}/, replacement);
fs.writeFileSync(file, code);
