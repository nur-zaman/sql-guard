<p align="center">
  <img src="./assets/sql-guard-logo.png" width="160" alt="sql-guard logo: a database protected by a shield" />
</p>

<h1 align="center">sql-guard</h1>

<p align="center">
  <strong>Fail-closed PostgreSQL validation for AI-generated SQL.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/sql-guard"><img src="https://img.shields.io/npm/v/sql-guard?color=22c55e&label=npm" alt="npm version" /></a>
  <a href="https://github.com/nur-zaman/sql-guard/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-0f172a" alt="MIT license" /></a>
  <a href="https://github.com/nur-zaman/sql-guard"><img src="https://img.shields.io/badge/PostgreSQL-AST--validated-38bdf8" alt="PostgreSQL AST validated" /></a>
</p>

`sql-guard` parses PostgreSQL SQL into an AST, then checks it against an explicit policy. It is built for the point where an LLM has proposed a query, but **before** your application executes it.

It does not rewrite or sanitize SQL. If it cannot confidently validate a query, it denies it.

## Why sql-guard?

Giving an AI assistant access to a database often means accepting SQL that was composed at runtime. A prompt restriction or regex is not a security boundary. `sql-guard` adds a focused, code-level guardrail:

- Allow only the tables your feature needs.
- Default to read-only queries.
- Allow only the functions you explicitly trust.
- Reject stacked statements, unsupported syntax, and ambiguous cases.
- Return structured violations you can log, inspect, or surface safely.

> [!IMPORTANT]
> `sql-guard` is defense in depth—not a replacement for parameterized queries, least-privilege database roles, row-level security, or application authorization.

## Install

```bash
npm install sql-guard
```

Requires Node.js 18 or later.

## Quick start

```ts
import { validate } from 'sql-guard';

const policy = {
  allowedTables: ['public.users', 'public.orders'],
  allowedFunctions: ['count', 'lower'],
};

const result = validate(
  'SELECT lower(u.email) FROM public.users AS u',
  policy,
);

if (!result.ok) {
  console.error(result.errorCode, result.violations);
  // Do not execute the query.
}
```

Use `assertSafeSql()` when rejecting unsafe SQL should interrupt the request immediately:

```ts
import { assertSafeSql, SqlValidationError } from 'sql-guard';

try {
  assertSafeSql('SELECT * FROM public.users', {
    allowedTables: ['public.users'],
  });

  // Execute only after validation succeeds.
} catch (error) {
  if (error instanceof SqlValidationError) {
    console.error(error.code, error.violations);
  }
  throw error;
}
```

## What it blocks

With the default policy, `sql-guard` accepts only a single `SELECT` and denies every function call unless it is allowlisted.

| Query or pattern | Default outcome | Why |
| --- | --- | --- |
| `SELECT * FROM public.users` | Allowed | The table is explicitly allowlisted. |
| `SELECT * FROM users` | Denied | Unqualified relation names need a resolver or `defaultSchema`. |
| `SELECT * FROM public.secret_users` | Denied | Every referenced table must be allowlisted. |
| `SELECT pg_catalog.pg_read_file(...)` | Denied | Functions are denied until individually allowlisted. |
| `SELECT 1; DELETE FROM public.users` | Denied | Multiple statements are disabled by default. |
| `WITH x AS (INSERT ...) SELECT * FROM x` | Denied | Data-modifying CTEs are unsupported and fail closed. |
| `SELECT * FROM information_schema.tables` | Denied | Metadata schemas require an explicit, fully qualified allowlist entry. |

The validator follows relations inside joins, subqueries, unions, and CTEs; an allowed alias or CTE name does not conceal an unauthorized base table.

## Policy

```ts
import type { Policy } from 'sql-guard';

const policy: Policy = {
  // Required. Schema-qualified by default.
  allowedTables: ['public.users', 'analytics.events'],

  // Optional. Defaults to ['select'].
  allowedStatements: ['select'],

  // Optional. Defaults to false.
  allowMultiStatement: false,

  // Optional. Defaults to []. Unlisted calls are denied.
  allowedFunctions: ['count', 'lower'],

  // Optional. Defaults to 'strict' (case-sensitive).
  tableIdentifierMatching: 'strict',

  // Optional. Resolves unqualified relation references.
  resolver: (name) => (name === 'users' ? 'public.users' : null),

  // Optional. A simpler alternative for one application schema.
  defaultSchema: 'public',

  // Optional. Defaults to 100,000 characters.
  maxQueryLength: 100_000,
};
```

### Resolving unqualified tables

By default, both policy entries and SQL table references are expected to be schema-qualified. You can choose one of these explicit resolution strategies:

```ts
// Resolve unqualified SQL tables to a single schema.
const publicPolicy = {
  defaultSchema: 'public',
  allowedTables: ['users', 'orders'],
};

// Or define exactly which aliases can resolve to which schema-qualified table.
const resolverPolicy = {
  allowedTables: ['public.users', 'archive.users'],
  resolver: (name: string) => {
    if (name === 'users') return 'public.users';
    if (name === 'old_users') return 'archive.users';
    return null;
  },
};
```

`resolver` takes precedence over `defaultSchema`. Metadata schemas such as `pg_catalog` and `information_schema` are never granted access implicitly.

### Functions are opt-in

`allowedFunctions` is empty by default. Unqualified and schema-qualified calls are intentionally different:

```ts
const policy = {
  allowedTables: ['public.users'],
  allowedFunctions: [
    'lower',                         // allows lower(...)
    'pg_catalog.current_database',   // allows only this qualified call
  ],
};
```

## API

### `validate(sql, policy)`

Never throws. Returns a `ValidationResult`:

```ts
type ValidationResult = {
  ok: boolean;
  violations: Violation[];
  errorCode?: ErrorCode;
};
```

### `assertSafeSql(sql, policy)`

Returns `void` when the query is allowed. Otherwise it throws `SqlValidationError`, which includes `code` and `violations`.

### Error codes

`validate()` returns one primary error code and a list of violations. Invalid policy configuration is reported before parsing SQL.

| Code | Meaning |
| --- | --- |
| `PARSE_ERROR` | SQL could not be parsed. |
| `UNSUPPORTED_SQL_FEATURE` | SQL uses a feature outside the supported subset. |
| `TABLE_NOT_ALLOWED` | A table is not allowlisted or cannot be resolved. |
| `STATEMENT_NOT_ALLOWED` | The statement type is not permitted by the policy. |
| `FUNCTION_NOT_ALLOWED` | A function call is not allowlisted. |
| `MULTI_STATEMENT_DISABLED` | Multiple statements were supplied while disabled. |
| `INVALID_POLICY` | The policy configuration is invalid. |
| `QUERY_TOO_LARGE` | SQL exceeds `maxQueryLength` before parsing. |

Each violation has a `type`, a human-readable `message`, and—when available—a 1-indexed `location`.

## Security model and limits

`sql-guard` is PostgreSQL-focused and validates query shape rather than executing or rewriting SQL. It is designed to be one layer in a larger security model:

1. Generate or receive the SQL.
2. Validate it with a narrow `sql-guard` policy.
3. Use parameterized values for all user-controlled data.
4. Execute with a database role limited to the required permissions.
5. Keep RLS and application authorization in place.

It cannot determine column-level permissions, evaluate RLS, detect runtime schema changes, or make a database role safer. Other SQL dialects are not supported in v1.

## License

[MIT](./LICENSE)
