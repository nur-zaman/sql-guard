import { describe, expect, test } from 'bun:test';
import { ErrorCode, Policy } from '../src/index';
import { validateAgainstPolicy } from '../src/policy/engine';
import { checkUnsupportedFeatures } from '../src/policy/fail-closed';

describe('fail-closed handling', () => {
  const basePolicy: Policy = {
    allowedTables: ['public.users'],
  };

  test('accepts covered syntax', () => {
    const result = validateAgainstPolicy('SELECT * FROM public.users', basePolicy);

    expect(result.ok).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  test('rejects unsupported features', () => {
    const result = validateAgainstPolicy('CREATE TABLE foo (id INT)', basePolicy);

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.UNSUPPORTED_SQL_FEATURE);
    expect(result.violations[0].type).toBe('unsupported');
  });

  test('rejects unsupported DROP statements', () => {
    const result = validateAgainstPolicy('DROP TABLE users', basePolicy);

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.UNSUPPORTED_SQL_FEATURE);
  });

  test('rejects unsupported ALTER statements', () => {
    const result = validateAgainstPolicy('ALTER TABLE users ADD COLUMN foo TEXT', basePolicy);

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.UNSUPPORTED_SQL_FEATURE);
  });

  test('returns UNSUPPORTED_SQL_FEATURE error code', () => {
    const result = validateAgainstPolicy('GRANT SELECT ON users TO admin', basePolicy);

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.UNSUPPORTED_SQL_FEATURE);
    expect(result.violations[0].type).toBe('unsupported');
  });

  test('rejects TRUNCATE statements', () => {
    const result = validateAgainstPolicy('TRUNCATE TABLE users', basePolicy);

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.UNSUPPORTED_SQL_FEATURE);
  });

  test('create procedure/trigger detected', () => {
    const procedureCheck = checkUnsupportedFeatures({ type: 'proc' });
    const triggerCheck = checkUnsupportedFeatures({ type: 'trigger' });

    expect(procedureCheck.supported).toBe(false);
    expect(procedureCheck.errorCode).toBe(ErrorCode.UNSUPPORTED_SQL_FEATURE);
    expect(triggerCheck.supported).toBe(false);
    expect(triggerCheck.errorCode).toBe(ErrorCode.UNSUPPORTED_SQL_FEATURE);
  });

  test('rejects SELECT INTO', () => {
    const result = validateAgainstPolicy(
      'SELECT * INTO tmp_users FROM public.users',
      basePolicy
    );

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.UNSUPPORTED_SQL_FEATURE);
    expect(result.violations[0].message).toContain('SELECT INTO is not supported');
  });

  test('rejects INSERT hidden inside CTE', () => {
    const result = validateAgainstPolicy(
      'WITH ins AS (INSERT INTO public.users (id) VALUES (1)) SELECT 1',
      basePolicy
    );

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.UNSUPPORTED_SQL_FEATURE);
    expect(result.violations[0].message).toContain("Nested write statement 'insert'");
  });

  test('rejects UPDATE hidden inside CTE', () => {
    const result = validateAgainstPolicy(
      'WITH upd AS (UPDATE public.users SET id = id) SELECT 1',
      basePolicy
    );

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.UNSUPPORTED_SQL_FEATURE);
    expect(result.violations[0].message).toContain("Nested write statement 'update'");
  });

  test('rejects DELETE hidden inside CTE', () => {
    const result = validateAgainstPolicy(
      'WITH del AS (DELETE FROM public.users) SELECT 1',
      basePolicy
    );

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.UNSUPPORTED_SQL_FEATURE);
    expect(result.violations[0].message).toContain("Nested write statement 'delete'");
  });

  test('rejects parser uncertainty', () => {
    const result = checkUnsupportedFeatures({
      type: 'select',
      parser_uncertain: true,
    });

    expect(result.supported).toBe(false);
    expect(result.errorCode).toBe(ErrorCode.UNSUPPORTED_SQL_FEATURE);
  });
});
