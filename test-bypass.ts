import { validate } from './src/index';

const policy = {
  allowedTables: ['public.users'],
  allowedFunctions: ['lower'], // only allow lower()
};

// Attack query: use "LOWER"() to bypass checking? But actually "LOWER" isn't lower().
// If policy allows `lower`, and we pass `SELECT "LOWER"()`, node-sql-parser extracts `name: [ { type: "double_quote_string", value: "LOWER" } ]`.
// extractAllFunctions calls `.toLowerCase()` on it, so it becomes `lower`.
// The policy validator sees `lower`, which is in the allowlist, so it allows it!
// BUT PostgreSQL treats `"LOWER"()` as a case-sensitive function named `LOWER`, NOT `lower`.
// So an attacker could execute `"LOWER"()` which could be a malicious function they created, or another function!

const result = validate('SELECT "LOWER"() FROM public.users', policy);
console.log(result);
