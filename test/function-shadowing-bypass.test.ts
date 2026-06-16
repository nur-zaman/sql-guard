import { describe, test, expect } from 'bun:test';
import { validateAgainstPolicy } from '../src/policy/engine';

describe('function shadowing bypass', () => {
  test('quoted uppercase function should not bypass allowlist for lowercase function', () => {
    const result = validateAgainstPolicy(
      'SELECT "LOWER"(name) FROM public.users',
      {
        allowedTables: ['public.users'],
        allowedFunctions: ['lower'],
      }
    );
    expect(result.ok).toBe(false);
  });
});
