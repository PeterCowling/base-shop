import { describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";

const importModule = () => import("@/routes/guides/porter-service-positano.translators");

describe("porter-service-positano translators", () => {
  it("creates a guides translator scoped to the guides namespace", async () => {
    const getFixedTSpy = vi.spyOn(i18n, "getFixedT");
    try {
      const { getGuidesTranslator } = await importModule();

      const translator = getGuidesTranslator("it");

      expect(getFixedTSpy).toHaveBeenCalledWith("it", "guides");
      expect(typeof translator).toBe("function");
    } finally {
      getFixedTSpy.mockRestore();
    }
  });

  it("creates a fallback translator scoped to the guidesFallback namespace", async () => {
    const getFixedTSpy = vi.spyOn(i18n, "getFixedT");
    try {
      const { getGuidesFallbackTranslator } = await importModule();

      const translator = getGuidesFallbackTranslator("fr");

      expect(getFixedTSpy).toHaveBeenCalledWith("fr", "guidesFallback");
      expect(typeof translator).toBe("function");
    } finally {
      getFixedTSpy.mockRestore();
    }
  });
});