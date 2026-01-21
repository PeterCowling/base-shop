import { describe, expect, it, jest } from "@jest/globals";

import { withEnv } from "./cmsEnvTestUtils";

describe("cms pagination limit", () => {
  it("coerces CMS_PAGINATION_LIMIT to number", async () => {
    await withEnv({ CMS_PAGINATION_LIMIT: "50" }, async () => {
      const { cmsEnv } = await import("@acme/config/env/cms");
      expect(cmsEnv.CMS_PAGINATION_LIMIT).toBe(50);
    });
  });

  it("throws on invalid CMS_PAGINATION_LIMIT", async () => {
    await withEnv({ CMS_PAGINATION_LIMIT: "abc" }, async () => {
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expect(import("@acme/config/env/cms")).rejects.toThrow(
        "Invalid CMS environment variables",
      );
      expect(errorSpy).toHaveBeenCalledWith(
        "❌ Invalid CMS environment variables:",
        expect.objectContaining({
          CMS_PAGINATION_LIMIT: {
            _errors: expect.arrayContaining([expect.any(String)]),
          },
        }),
      );
      errorSpy.mockRestore();
    });
  });
});
