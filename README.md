# llm-sql-guard

SQL injection detection and sanitization for LLM-generated queries.

## Installation

```bash
bun install llm-sql-guard
```

## Usage

```typescript
import { sanitize } from 'llm-sql-guard';

const result = sanitize("SELECT * FROM users WHERE id = 1");
console.log(result);
```

## API

### sanitize(sql: string): SanitizeResult

Sanitizes an SQL query by detecting and neutralizing potential injection attacks.

### detect(sql: string): DetectionResult

Detects potential SQL injection patterns in a query.

## License

MIT
