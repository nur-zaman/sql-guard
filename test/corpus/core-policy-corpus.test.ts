import { describe, expect, test } from 'bun:test';
import { validateAgainstPolicy } from '../../src/policy/engine';
import type { PolicyFixture } from '../fixtures/sql/types';
import { cteFixtures } from '../fixtures/sql/cte-fixtures';
import { joinFixtures } from '../fixtures/sql/join-fixtures';
import { subqueryFixtures } from '../fixtures/sql/subquery-fixtures';
import { miscPolicyFixtures } from '../fixtures/sql/misc-policy-fixtures';

function assertFixtureMatches(fixture: PolicyFixture): void {
  const result = validateAgainstPolicy(fixture.sql, fixture.policy);

  expect(result.ok, `${fixture.name}: ok mismatch`).toBe(fixture.expected.ok);

  if (fixture.expected.errorCode) {
    expect(result.errorCode, `${fixture.name}: error code mismatch`).toBe(fixture.expected.errorCode);
  }

  if (fixture.expected.violationMessageIncludes) {
    expect(
      result.violations.some((violation) => violation.message.includes(fixture.expected.violationMessageIncludes!)),
      `${fixture.name}: missing violation message '${fixture.expected.violationMessageIncludes}'`
    ).toBe(true);
  }
}

const corpusGroups: Array<{ name: string; fixtures: PolicyFixture[] }> = [
  { name: 'cte fixtures', fixtures: cteFixtures },
  { name: 'subquery fixtures', fixtures: subqueryFixtures },
  { name: 'join fixtures', fixtures: joinFixtures },
  { name: 'misc policy fixtures', fixtures: miscPolicyFixtures },
];

describe('core policy corpus', () => {
  for (const group of corpusGroups) {
    describe(group.name, () => {
      for (const fixture of group.fixtures) {
        test(fixture.name, () => {
          assertFixtureMatches(fixture);
        });
      }
    });
  }

  test('fails on expectation mismatch', () => {
    const mismatchFixture: PolicyFixture = {
      name: 'intentional mismatch fixture',
      sql: 'SELECT * FROM public.users',
      policy: { allowedTables: ['public.users'] },
      expected: { ok: false },
    };

    expect(() => assertFixtureMatches(mismatchFixture)).toThrow();
  });
});
