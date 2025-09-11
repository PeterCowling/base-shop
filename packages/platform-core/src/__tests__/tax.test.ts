/** @jest-environment node */

import { promises as fs } from "fs";

// Preserve the real global fetch so it can be restored after each test.
// The previous implementation deleted `globalThis.fetch`, which caused
// MSW's `server.close()` cleanup in `jest.setup.ts` to crash when it
// attempted to restore the original fetch implementation.
const realFetch = globalThis.fetch;

// Helper to reset modules and mocks between tests
function reset() {
  jest.resetModules();
  jest.restoreAllMocks();
  // Rather than deleting `fetch`, reset it to the original implementation
  // so MSW can safely unpatch it during teardown.
  (globalThis as any).fetch = realFetch;
}

describe("tax", () => {
  afterEach(() => {
    reset();
  });

  describe("loadRules", () => {
    it("caches results after first read", async () => {
      // Arrange: mock rule file
      const readSpy = jest
        .spyOn(fs, "readFile")
        .mockResolvedValue("{\"us-ca\":0.1}");

      const { getTaxRate } = await import("../tax");

      // Act: call twice
      const first = await getTaxRate("us-ca");
      const second = await getTaxRate("us-ca");

      // Assert
      expect(first).toBe(0.1);
      expect(second).toBe(0.1);
      expect(readSpy).toHaveBeenCalledTimes(1);
    });

    it("returns empty rules when file is missing", async () => {
      const err: NodeJS.ErrnoException = Object.assign(new Error("missing"), {
        code: "ENOENT",
      });
      const readSpy = jest.spyOn(fs, "readFile").mockRejectedValue(err);

      const { getTaxRate } = await import("../tax");

      expect(await getTaxRate("us-ca")).toBe(0);
      expect(await getTaxRate("us-ny")).toBe(0);
      expect(readSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("getTaxRate", () => {
    it("returns 0 for unknown regions", async () => {
      jest
        .spyOn(fs, "readFile")
        .mockResolvedValue("{\"us-ca\":0.1}");

      const { getTaxRate } = await import("../tax");
      expect(await getTaxRate("unknown-region")).toBe(0);
    });
  });

});

