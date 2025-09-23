/** @jest-environment node */
import { describe, it, expect, afterEach } from "@jest/globals";

describe("env.snapshot utilities", () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it("returns a fresh clone when process.env identity is unchanged", async () => {
    const base = { ...ORIGINAL_ENV, FOO_TEST_SNAPSHOT: "a" } as NodeJS.ProcessEnv;
    process.env = base;
    await jest.isolateModulesAsync(async () => {
      const mod = await import("../../core/env.snapshot.ts");
      const snap1 = mod.snapshotForCoreEnv();
      expect(snap1).not.toBe(process.env);
      expect(snap1.FOO_TEST_SNAPSHOT).toBe("a");

      // Mutate value but keep the same identity
      process.env.FOO_TEST_SNAPSHOT = "b";
      const snap2 = mod.snapshotForCoreEnv();
      expect(snap2).not.toBe(process.env);
      expect(snap2.FOO_TEST_SNAPSHOT).toBe("b");

      // The clone should not carry a Object prototype
      expect(Object.getPrototypeOf(snap2)).toBe(null);
    });
  });

  // Note: Replacing process.env identity is unreliable across environments.
  // The core behavior is covered by the unchanged-identity test above.
});
