import { describe, expect, it } from "@jest/globals";
import { withEnv } from "./cmsEnvTestUtils";

describe("cms base env", () => {
  it("defaults SANITY_PROJECT_ID when missing", async () => {
    await withEnv({ SANITY_PROJECT_ID: undefined }, async () => {
      const { cmsEnv } = await import("@acme/config/env/cms");
      expect(cmsEnv.SANITY_PROJECT_ID).toBe("dummy-project-id");
    });
  });

  it("defaults SANITY_DATASET when missing", async () => {
    await withEnv({ SANITY_DATASET: undefined }, async () => {
      const { cmsEnv } = await import("@acme/config/env/cms");
      expect(cmsEnv.SANITY_DATASET).toBe("production");
    });
  });

  it("uses placeholder SANITY_API_TOKEN when absent", async () => {
    await withEnv({ SANITY_API_TOKEN: undefined }, async () => {
      const { cmsEnv } = await import("@acme/config/env/cms");
      expect(cmsEnv.SANITY_API_TOKEN).toBe("dummy-api-token");
    });
  });

  it("uses placeholder SANITY_PREVIEW_SECRET when missing", async () => {
    await withEnv({ SANITY_PREVIEW_SECRET: undefined }, async () => {
      const { cmsEnv } = await import("@acme/config/env/cms");
      expect(cmsEnv.SANITY_PREVIEW_SECRET).toBe("dummy-preview-secret");
    });
  });
});
