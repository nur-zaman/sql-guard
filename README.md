# sql-guard

Validate AI generated PostgreSQL queries against explicit allowlists. This package parses SQL into an AST and denies anything outside your policy.

## Installation

```bash
npm install sql-guard
```

## Quickstart

```typescript
import { validate, assertSafeSql, ErrorCode } from 'sql-guard';

const policy = {
  allowedTables: ['public.users', 'public.orders'],
  allowedFunctions: ['count', 'lower'],
};

const result = validate('SELECT * FROM public.users', policy);
if (!result.ok) {
  console.log('Denied:', result.errorCode);
  console.log('Violations:', result.violations);
}

// Or fail fast with an exception
assertSafeSql('SELECT lower(u.email) FROM public.users u', policy);
```

## API Reference

### validate(sql, policy)

Validates SQL against a policy.

- Returns: `ValidationResult`
- On failure: `ok === false`, `violations` populated, and `errorCode` set

### assertSafeSql(sql, policy)

Validates SQL and throws when validation fails.

- Returns: `void`
- Throws: `SqlValidationError` with `code: ErrorCode` and `violations: Violation[]`

```typescript
import { assertSafeSql, SqlValidationError, ErrorCode } from 'sql-guard';

try {
  assertSafeSql('SELECT pg_catalog.current_database() FROM public.users', {
    allowedTables: ['public.users'],
    allowedFunctions: ['lower'],
  });
} catch (err) {
  if (err instanceof SqlValidationError) {
    if (err.code === ErrorCode.FUNCTION_NOT_ALLOWED) {
      console.error('Blocked a function call:', err.violations);
    }
  }
  throw err;
}
```

### ErrorCode

Enum of error codes returned by `validate()` and used by `SqlValidationError`.

### Policy

Policy settings that drive validation.

```ts
export interface Policy {
  allowedTables: string[];
  allowedStatements?: ('select' | 'insert' | 'update' | 'delete')[];
  allowMultiStatement?: boolean;
  allowedFunctions?: string[];
  tableIdentifierMatching?: 'strict' | 'caseInsensitive';
  resolver?: (unqualified: string) => string | null;
}
```

Defaults and behavior:

- `allowedTables` is required.
- `allowedTables` entries must be schema-qualified (`schema.table`). Invalid entries return `INVALID_POLICY`.
- `allowedStatements` defaults to `['select']`.
- `allowMultiStatement` defaults to `false`.
- `allowedFunctions` defaults to `[]`, which means any function call is denied unless allowlisted.
- `tableIdentifierMatching` defaults to `'strict'` (exact case-sensitive table matching).
- Set `tableIdentifierMatching: 'caseInsensitive'` to preserve case-insensitive table matching.
- Unqualified table references in SQL are denied unless you provide `resolver` to map them to `schema.table`.
- Unqualified function allowlist entries (for example, `lower`) match only unqualified calls (`lower(...)`).
- Schema-qualified function calls require schema-qualified allowlist entries (`pg_catalog.current_database`).

Strict policy examples:

```ts
const strictPolicy = {
  allowedTables: ['public.users', 'analytics.events'],
  allowedFunctions: ['lower', 'pg_catalog.current_database'],
  resolver: (unqualified: string) =>
    unqualified === 'users' ? 'public.users' : null,
};
```

## Security Model

- AST based validation, not regex matching.
- Fail closed: unsupported or uncertain parser features are denied.
- Data-modifying CTE payloads (for example `WITH x AS (INSERT ...) SELECT ...`) are denied as unsupported.
- `SELECT INTO` is denied as unsupported.
- Table allowlists: every referenced table must be in `policy.allowedTables` by fully qualified name.
- Statement type restrictions: only `select` is allowed unless you opt in via `allowedStatements`.
- Multi statement restriction: `SELECT 1; SELECT 2` is denied unless `allowMultiStatement: true`.
- Function allowlists: schema-qualified calls are allowed only by exact schema-qualified entries.
- Metadata table protection: relations in `information_schema` and `pg_catalog` are denied unless explicitly allowlisted by fully qualified name.

This is a guardrail for LLM output. It helps enforce least privilege at the query shape level. Use it alongside parameterization, prepared statements, and database permissions.

## Limitations

- PostgreSQL focused (v1). Other dialects are not supported.
- No SQL rewriting or sanitization. This package validates, it doesn't transform queries.
- Not a complete SQL injection defense by itself. Treat it as defense in depth.
- No database context: it can't check column level permissions, RLS policies, or runtime schema changes.

## Error Codes

`validate()` returns a single `errorCode` plus a list of `violations`. Invalid policy configuration is reported before SQL parsing.

| Code | Description |
|------|-------------|
| `PARSE_ERROR` | SQL could not be parsed into an AST. |
| `UNSUPPORTED_SQL_FEATURE` | Parsed SQL contains features outside the supported subset (fail closed). |
| `TABLE_NOT_ALLOWED` | A referenced table is not in `policy.allowedTables`, or an unqualified table can't be resolved. |
| `STATEMENT_NOT_ALLOWED` | Statement type is not allowed (defaults to `select` only). |
| `FUNCTION_NOT_ALLOWED` | A function call is not in `policy.allowedFunctions`. |
| `MULTI_STATEMENT_DISABLED` | Query contains multiple statements while `allowMultiStatement` is disabled. |
| `INVALID_POLICY` | Policy configuration is invalid (for example non-qualified table allowlist entries). |

## Violation Types

`Violation.type` can be:

- `parse`
- `unsupported`
- `policy`
- `statement`
- `table`
- `function`

## Publishing

For first time npm publish:

```bash
npm login
npm publish --access public
```

Notes:

- `prepublishOnly` runs typecheck, tests, and build, so publishing requires Bun in your environment.

## License

MIT
