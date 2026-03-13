import { describe, expect, test } from "bun:test";
import {
  isUnqualifiedName,
  parseQualifiedName,
} from "../src/normalize/qualified-name";

describe("isUnqualifiedName", () => {
  test("returns true for simple unqualified names", () => {
    expect(isUnqualifiedName("users")).toBe(true);
    expect(isUnqualifiedName("orders")).toBe(true);
    expect(isUnqualifiedName("products")).toBe(true);
  });

  test("returns true for quoted unqualified names without dots", () => {
    expect(isUnqualifiedName('"Users"')).toBe(true);
    expect(isUnqualifiedName('"UserTable"')).toBe(true);
  });

  test("returns true for quoted identifiers containing dots", () => {
    expect(isUnqualifiedName('"audit.log"')).toBe(true);
    expect(isUnqualifiedName('"table.name"')).toBe(true);
    expect(isUnqualifiedName('"a.b.c"')).toBe(true);
  });

  test("returns false for qualified names", () => {
    expect(isUnqualifiedName("public.users")).toBe(false);
    expect(isUnqualifiedName("analytics.events")).toBe(false);
    expect(isUnqualifiedName("schema.table")).toBe(false);
  });

  test("returns false for quoted qualified names", () => {
    expect(isUnqualifiedName('"public"."users"')).toBe(false);
    expect(isUnqualifiedName('"schema"."table"')).toBe(false);
  });

  test("returns false for mixed quoted/unquoted qualified names", () => {
    expect(isUnqualifiedName('public."users"')).toBe(false);
    expect(isUnqualifiedName('"schema".table')).toBe(false);
  });

  test("returns false for non-string inputs", () => {
    expect(isUnqualifiedName(null)).toBe(false);
    expect(isUnqualifiedName(undefined)).toBe(false);
    expect(isUnqualifiedName(123)).toBe(false);
    expect(isUnqualifiedName({})).toBe(false);
  });

  test("returns false for empty strings", () => {
    expect(isUnqualifiedName("")).toBe(false);
    expect(isUnqualifiedName("  ")).toBe(false);
  });

  test("handles quoted identifiers with escaped quotes", () => {
    expect(isUnqualifiedName('"table""name"')).toBe(true);
    expect(isUnqualifiedName('"schema""name"."table""name"')).toBe(false);
  });

  test("returns false for malformed quoted identifiers", () => {
    expect(isUnqualifiedName('"users')).toBe(false);
    expect(isUnqualifiedName('users"')).toBe(false);
    expect(isUnqualifiedName('"')).toBe(false);
  });

  test("distinguishes between quoted and unquoted dotted names", () => {
    // Unquoted: audit.log is qualified (schema.table)
    expect(isUnqualifiedName("audit.log")).toBe(false);
    // Quoted: "audit.log" is unqualified (just a table name with a dot)
    expect(isUnqualifiedName('"audit.log"')).toBe(true);
  });
});

describe("parseQualifiedName integration with isUnqualifiedName", () => {
  test("parseQualifiedName correctly handles names that isUnqualifiedName identifies as unqualified", () => {
    // For unqualified names, parseQualifiedName should return null
    expect(parseQualifiedName("users")).toBeNull();
    expect(parseQualifiedName('"audit.log"')).toBeNull();
  });

  test("parseQualifiedName correctly handles names that isUnqualifiedName identifies as qualified", () => {
    // For qualified names, parseQualifiedName should return a valid result
    const result1 = parseQualifiedName("public.users");
    expect(result1).not.toBeNull();
    expect(result1?.schema).toBe("public");
    expect(result1?.name).toBe("users");

    const result2 = parseQualifiedName('"public"."audit.log"');
    expect(result2).not.toBeNull();
    expect(result2?.schema).toBe("public");
    expect(result2?.name).toBe("audit.log");
  });

  test("auto-qualification preserves behavior: unqualified + defaultSchema = qualified", () => {
    const unqualifiedTable = '"audit.log"';
    const defaultSchema = "public";

    expect(isUnqualifiedName(unqualifiedTable)).toBe(true);

    const qualified = `${defaultSchema}.${unqualifiedTable}`;
    expect(qualified).toBe('public."audit.log"');

    const parsed = parseQualifiedName(qualified);
    expect(parsed).not.toBeNull();
    expect(parsed?.schema).toBe("public");
    expect(parsed?.name).toBe("audit.log");
    expect(parsed?.fullyQualified).toBe("public.audit.log");
  });
});
