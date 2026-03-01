# llm-sql-guard

Validate AI generated PostgreSQL queries against explicit allowlists. This package parses SQL into an AST and denies anything outside your policy.

## Installation

```bash
npm install llm-sql-guard
```

## Quickstart

```typescript
import { validate, assertSafeSql, ErrorCode } from 'llm-sql-guard';

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
import { assertSafeSql, SqlValidationError, ErrorCode } from 'llm-sql-guard';

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
  resolver?: (unqualified: string) => string | null;
}
```

Defaults and behavior:

- `allowedTables` is required.
- `allowedStatements` defaults to `['select']`.
- `allowMultiStatement` defaults to `false`.
- `allowedFunctions` defaults to `[]`, which means any function call is denied unless allowlisted.
- Unqualified table names are denied unless you provide `resolver` to map them to `schema.table`.

## Security Model

- AST based validation, not regex matching.
- Fail closed: unsupported or uncertain parser features are denied.
- Table allowlists: every referenced table must be in `policy.allowedTables`.
- Statement type restrictions: only `select` is allowed unless you opt in via `allowedStatements`.
- Multi statement restriction: `SELECT 1; SELECT 2` is denied unless `allowMultiStatement: true`.
- Function allowlists: any function call is denied unless in `allowedFunctions`.
- Metadata table protection: relations in `information_schema` and `pg_catalog` are denied unless explicitly allowlisted by fully qualified name.

This is a guardrail for LLM output. It helps enforce least privilege at the query shape level. Use it alongside parameterization, prepared statements, and database permissions.

## Limitations

- PostgreSQL focused (v1). Other dialects are not supported.
- No SQL rewriting or sanitization. This package validates, it doesn't transform queries.
- Not a complete SQL injection defense by itself. Treat it as defense in depth.
- No database context: it can't check column level permissions, RLS policies, or runtime schema changes.

## Error Codes

`validate()` returns a single `errorCode` plus a list of `violations`. When multiple violations exist, the code is picked by a fixed precedence (parse, statement, table, function, multi statement, unsupported).

| Code | Description |
|------|-------------|
| `PARSE_ERROR` | SQL could not be parsed into an AST. |
| `UNSUPPORTED_SQL_FEATURE` | Parsed SQL contains features outside the supported subset (fail closed). |
| `TABLE_NOT_ALLOWED` | A referenced table is not in `policy.allowedTables`, or an unqualified table can't be resolved. |
| `STATEMENT_NOT_ALLOWED` | Statement type is not allowed (defaults to `select` only). |
| `FUNCTION_NOT_ALLOWED` | A function call is not in `policy.allowedFunctions`. |
| `MULTI_STATEMENT_DISABLED` | Query contains multiple statements while `allowMultiStatement` is disabled. |

## Publishing

For first time npm publish:

```bash
npm login
npm publish --access public
```

Notes:

- `prepublishOnly` runs `bun run build`, so publishing requires Bun in your environment.

## License

MIT
