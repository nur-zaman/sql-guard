# SQL Policy Fixture Corpus

This directory contains fixture-driven policy validation cases used by
`test/corpus/core-policy-corpus.test.ts`.

## Fixture shape

Each fixture exports an object with this structure:

```ts
{
  name: string;
  sql: string;
  policy: Policy;
  expected: {
    ok: boolean;
    errorCode?: ErrorCode;
    violationMessageIncludes?: string;
  };
}
```

## Coverage

- CTEs (simple, multiple, unauthorized source, recursive unsupported)
- Subqueries (scalar, IN, EXISTS, correlated)
- JOINs (inner, left, right, full, cross, self-join)
- Quoted identifiers
- Schema-qualified names
- Statement policy outcomes (select/insert/update/delete)
- Resolver path validation (unqualified table resolution)
