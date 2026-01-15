import { describe, expect, it, vi } from "vitest";
import i18n from "@/i18n";

const importModule = () =>
  import("@/routes/guides/how-to-reach-positano-on-a-budget.translators");

describe("how-to-reach-positano-on-a-budget translators", () => {
  it("returns guide translators scoped to the guides namespace", async () => {
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

  it("returns header translators scoped to the header namespace", async () => {
    const getFixedTSpy = vi.spyOn(i18n, "getFixedT");
    try {
      const { getHeaderTranslator } = await importModule();
      const translator = getHeaderTranslator("fr");

      expect(getFixedTSpy).toHaveBeenCalledWith("fr", "header");
      expect(typeof translator).toBe("function");
    } finally {
      getFixedTSpy.mockRestore();
    }
  });

  it("prefers trimmed strings from the primary translator", async () => {
    const { resolveTranslatorString } = await importModule();

    const primary = vi.fn(() => "  Primary value  ");
    const fallback = vi.fn(() => "Fallback");

    const result = resolveTranslatorString(primary, fallback, "key", " Default value ");

    expect(result).toBe("Primary value");
    expect(primary).toHaveBeenCalledWith("key");
    expect(fallback).not.toHaveBeenCalled();
  });

  it("uses fallback translations when the primary translator returns a placeholder", async () => {
    const { resolveTranslatorString } = await importModule();

    const primary = vi.fn(() => "  ");
    const fallback = vi.fn(() => "  Fallback value  ");

    const result = resolveTranslatorString(primary, fallback, "labels.home", " Default ");

    expect(result).toBe("Fallback value");
    expect(primary).toHaveBeenCalledWith("labels.home");
    expect(fallback).toHaveBeenCalledWith("labels.home");
  });

  it("falls back to the provided default when no translators return content", async () => {
    const { resolveTranslatorString } = await importModule();

    const primary = vi.fn((key: string) => key);
    const fallback = vi.fn(() => " ");

    const result = resolveTranslatorString(primary, fallback, "labels.guides", " Default heading ");

    expect(result).toBe("Default heading");
    expect(primary).toHaveBeenCalledWith("labels.guides");
    expect(fallback).toHaveBeenCalledWith("labels.guides");
  });
});