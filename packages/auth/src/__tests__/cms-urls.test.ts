import { describe, expect, it, jest } from "@jest/globals";
import { withEnv } from "./cmsEnvTestUtils";

describe("cms urls", () => {
  it("parses SANITY_BASE_URL when valid", async () => {
    await withEnv({ SANITY_BASE_URL: "https://sanity.example.com/" }, async () => {
      const { cmsEnv } = await import("@acme/config/env/cms");
      expect(cmsEnv.SANITY_BASE_URL).toBe("https://sanity.example.com");
    });
  });

  it("throws when SANITY_BASE_URL is invalid", async () => {
    await withEnv({ SANITY_BASE_URL: "not-a-url" }, async () => {
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expect(import("@acme/config/env/cms")).rejects.toThrow(
        "Invalid CMS environment variables",
      );
      expect(errorSpy).toHaveBeenCalledWith(
        "❌ Invalid CMS environment variables:",
        expect.objectContaining({
          SANITY_BASE_URL: { _errors: expect.arrayContaining([expect.any(String)]) },
        }),
      );
      errorSpy.mockRestore();
    });
  });

  it("trims trailing slashes", async () => {
    await withEnv(
      {
        SANITY_BASE_URL: "https://example.com/",
        CMS_BASE_URL: "https://cms.local/",
      },
      async () => {
        const { cmsEnv } = await import("@acme/config/env/cms");
        expect(cmsEnv.SANITY_BASE_URL).toBe("https://example.com");
        expect(cmsEnv.CMS_BASE_URL).toBe("https://cms.local");
      },
    );
  });

  it("throws on invalid CMS_SPACE_URL", async () => {
    await withEnv({ CMS_SPACE_URL: "not-a-url" }, async () => {
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expect(import("@acme/config/env/cms")).rejects.toThrow(
        "Invalid CMS environment variables",
      );
      expect(errorSpy).toHaveBeenCalledWith(
        "❌ Invalid CMS environment variables:",
        expect.objectContaining({
          CMS_SPACE_URL: { _errors: expect.arrayContaining([expect.any(String)]) },
        }),
      );
      errorSpy.mockRestore();
    });
  });
});
