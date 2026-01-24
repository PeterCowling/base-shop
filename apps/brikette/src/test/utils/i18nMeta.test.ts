
import "@testing-library/jest-dom";
import { resolveI18nMeta } from "@/utils/i18nMeta";

const translatorMap = new Map<string, (key: string) => unknown>();

jest.mock("@/i18n", () => ({
  __esModule: true,
  default: {
    hasResourceBundle: jest.fn(),
    getFixedT: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const i18nMock = require("@/i18n").default as {
  hasResourceBundle: jest.Mock;
  getFixedT: jest.Mock;
};
const { hasResourceBundle, getFixedT } = i18nMock;

hasResourceBundle.mockImplementation((lang: string, ns: string) => translatorMap.has(`${lang}:${ns}`));
getFixedT.mockImplementation(
  (lang: string, ns: string) => translatorMap.get(`${lang}:${ns}`) ?? ((key: string) => key),
);

const setTranslations = (
  lang: string,
  namespace: string,
  entries: Record<string, unknown>,
) => {
  translatorMap.set(`${lang}:${namespace}`, (key: string) => entries[key]);
};

describe("resolveI18nMeta", () => {
  beforeEach(() => {
    translatorMap.clear();
    hasResourceBundle.mockClear();
    getFixedT.mockClear();
  });

  it("prefers explicit strings from the active language", () => {
    setTranslations("es", "roomsPage", {
      "meta.title": "Habitaciones",
      "meta.description": "Descripcion",
    });

    const meta = resolveI18nMeta("es", "roomsPage");

    expect(meta).toEqual({ title: "Habitaciones", description: "Descripcion" });
  });

  it("falls back to the configured language when keys are unresolved", () => {
    setTranslations("it", "roomsPage", {
      "meta.title": "meta.title",
      "meta.description": "meta.description",
    });
    setTranslations("en", "roomsPage", {
      "meta.title": "Rooms",
      "meta.description": "Book a stay",
    });

    const meta = resolveI18nMeta("it", "roomsPage");

    expect(meta).toEqual({ title: "Rooms", description: "Book a stay" });
    expect(hasResourceBundle).toHaveBeenCalledWith("en", "roomsPage");
  });

  it("returns the key when neither language resolves a string", () => {
    setTranslations("fr", "roomsPage", {
      "meta.title": { unexpected: true },
      "meta.description": null,
    });

    const meta = resolveI18nMeta("fr", "roomsPage");

    expect(meta).toEqual({ title: "meta.title", description: "meta.description" });
  });

  it("uses plain fallback strings even when they equal the key", () => {
    setTranslations("de", "roomsPage", {
      "meta.title": "meta.title",
      "meta.description": "meta.description",
    });
    setTranslations("en", "roomsPage", {
      "meta.title": "meta.title",
      "meta.description": "",
    });

    const meta = resolveI18nMeta("de", "roomsPage");

    expect(meta).toEqual({ title: "meta.title", description: "" });
  });
});