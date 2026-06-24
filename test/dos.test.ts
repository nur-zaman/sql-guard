import { test, expect } from 'bun:test';
import { validate } from '../src/index';

test('resolver throwing Object.create(null) crashes validate', () => {
  const policy = {
    allowedTables: ['public.users'],
    resolver: () => { throw Object.create(null); }
  };
  expect(() => validate('SELECT * FROM users', policy)).not.toThrow();
});
