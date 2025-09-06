import { useTranslations } from "../useTranslations.server";

jest.mock("../en.json", () => ({
  __esModule: true,
  default: { greet: "Hello" },
}));

jest.mock("../de.json", () => ({
  __esModule: true,
  default: {},
}));

describe("useTranslations.server", () => {
  it("falls back to English for missing keys", async () => {
    const t = await useTranslations("de");
    expect(t("greet")).toBe("Hello");
  });
});
