import { describe, expect, test } from 'bun:test';
import { ErrorCode, Policy } from '../src/index';
import { validateAgainstPolicy } from '../src/policy/engine';

describe('threat model regression - functions', () => {
  const basePolicy: Policy = {
    allowedTables: ['public.users'],
    allowedFunctions: ['lower'],
  };

  test('ast_dedup_shadowing_functions: differently cased identifiers do not shadow each other in functions', () => {
    // If we call both LOWER() and lower() but only `lower` is allowed. Wait, `lower` is case-insensitive if not quoted in pg.
    // If we do "LOWER"(), it's a completely different function in pg.
    // If they shadow during deduplication, it might bypass checking.
    const result = validateAgainstPolicy(
      'SELECT "LOWER"(name), lower(name) FROM public.users',
      basePolicy
    );
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.FUNCTION_NOT_ALLOWED);
  });
});
