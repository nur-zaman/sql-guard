import { describe, test, expect } from 'bun:test';
import { checkUnsupportedFeatures } from '../../src/policy/fail-closed';

describe('Malicious AST handling in checkUnsupportedFeatures', () => {
  test('handles AST with malicious type property', () => {
    // An object with no prototype
    const badType = Object.create(null);

    // An object that throws when converted to string
    const throwingType = {
      toString: () => { throw new Error('boom'); }
    };

    const ast1 = { type: badType };

    expect(() => checkUnsupportedFeatures(ast1)).not.toThrow();

    const result1 = checkUnsupportedFeatures(ast1);
    expect(result1.supported).toBe(false);

    const ast2 = { type: throwingType };
    expect(() => checkUnsupportedFeatures(ast2)).not.toThrow();
  });
});
