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
- Strict schema-qualified table allowlists (`schema.table` required)
- Statement policy outcomes (select/insert/update/delete)
- Resolver path validation (unqualified query table resolution)
- Invalid policy handling (`INVALID_POLICY`)
