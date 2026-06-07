import { expect, test, describe } from "bun:test";
import { safeString } from "../src/utils/safe-string";

describe("safeString", () => {
  test("handles normal strings", () => {
    expect(safeString("hello")).toBe("hello");
  });

  test("handles numbers", () => {
    expect(safeString(123)).toBe("123");
  });

  test("handles null and undefined", () => {
    expect(safeString(null)).toBe("null");
    expect(safeString(undefined)).toBe("undefined");
  });

  test("handles objects without prototype", () => {
    const badObj = Object.create(null);
    expect(safeString(badObj)).toBe("[Uncoercible Value]");
  });
});
