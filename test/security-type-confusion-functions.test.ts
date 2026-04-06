import { describe, test, expect } from 'bun:test';
import { validate } from '../src/index';

describe('Security: Type Confusion in functions and statements', () => {
  test('does not throw on malicious toString in allowedFunctions', () => {
    const malicious = {
      toString: () => { throw new Error('malicious toString'); }
    };

    expect(() => {
      validate('SELECT * FROM public.users', {
        allowedTables: ['public.users'],
        allowedFunctions: [malicious as any]
      });
    }).not.toThrow();
  });

  test('does not throw on malicious toString in allowedStatements', () => {
    const malicious = {
      toString: () => { throw new Error('malicious toString'); }
    };

    expect(() => {
      validate('INSERT INTO public.users (id) VALUES (1)', {
        allowedTables: ['public.users'],
        allowedStatements: [malicious as any]
      });
    }).not.toThrow();
  });
});
