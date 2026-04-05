## 2025-03-05 - [Policy Configuration Array Element Validation]
**Vulnerability:** Policy array configurations (`allowedTables`, `allowedFunctions`) lacked runtime type checks for individual elements, allowing JavaScript consumers to pass objects with malicious `toString` methods that cause unhandled exceptions and crash the validator.
**Learning:** Even when top-level API structures are type-checked (e.g., verifying an array exists), deep validation of array elements is critical in security boundaries to prevent type confusion vulnerabilities and ensure robustness against malicious payloads bypassing TypeScript boundaries.
**Prevention:** Explicitly loop through configuration arrays at runtime and verify each element is a string before evaluating it.
