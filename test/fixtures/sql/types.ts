import type { Policy, ErrorCode } from '../../../src/index';

export interface PolicyFixture {
  name: string;
  sql: string;
  policy: Policy;
  expected: {
    ok: boolean;
    errorCode?: ErrorCode;
    violationMessageIncludes?: string;
  };
}
