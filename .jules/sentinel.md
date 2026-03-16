## 2023-11-20 - Unhandled Exceptions on Invalid Inputs
**Vulnerability:** Core functions did not defensively type-check their arguments (`sql: string`, `policy: Policy`). When this library is used with unvalidated external input (e.g., from an API endpoint using `req.body.sql`), passing `null` or `undefined` bypassed TypeScript's static checks and caused the validation engine to crash with an unhandled runtime exception (`TypeError: null is not an object`), potentially leading to a Denial of Service (DoS) vulnerability.
**Learning:** Even in strongly-typed languages like TypeScript, runtime boundaries that accept external data cannot rely entirely on static type definitions. External inputs can bypass type systems (e.g. from JSON payloads).
**Prevention:** Always implement explicit runtime type-checking guards at public entry points (like the main `validate` function) to ensure variables actually match their expected types, failing gracefully instead of throwing unhandled exceptions.

## 2024-03-12 - Defense-in-Depth for Parameter Types
**Vulnerability:** Core functions did not defensively type-check their arguments (`sql: string`, `policy: Policy`) against non-objects or missing properties correctly at runtime, since `null` and `undefined` bypassed TypeScript's static checks and caused the validation engine to crash with an unhandled runtime exception (`TypeError: null is not an object`).
**Learning:** Even in strongly-typed languages like TypeScript, runtime boundaries that accept external data cannot rely entirely on static type definitions.
**Prevention:** Explicit runtime type-checking guards at public entry points should fail safely and return a structured validation error instead of throwing unhandled exceptions.
