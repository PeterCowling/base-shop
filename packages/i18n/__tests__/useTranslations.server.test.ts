import { useTranslations } from "../src/useTranslations.server";

describe("useTranslations (server)", () => {
  it("returns translations and falls back to key", async () => {
    const t = await useTranslations("de");
    expect(t("nav.home")).toBe("Startseite");
    expect(t("missing.key")).toBe("missing.key");
  });
});
