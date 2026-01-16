import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type RoomsNamespace = {
  meta: Record<string, string>;
  rooms: Record<string, unknown>;
  facilities: Record<string, string>;
};

const roomsDataMock = [
  {
    id: "room_1",
    sku: "room_1",
    widgetRoomCode: "1",
    widgetRateCodeNR: "nr",
    widgetRateCodeFlex: "flex",
    rateCodes: { direct: { nr: "nr", flex: "flex" }, ota: { nr: "nr", flex: "flex" } },
    occupancy: 2,
    pricingModel: "perBed",
    basePrice: { amount: 100, currency: "EUR" },
    seasonalPrices: [],
    availability: { totalBeds: 2, defaultRelease: 2 },
    imagesRaw: [],
    landingImage: "/landing.jpg",
    roomsHref: "/rooms#room_1",
  },
] as unknown[];

const englishNamespace: RoomsNamespace = {
  meta: {},
  rooms: {
    room_1: {
      title: "English title",
      bed_intro: "English intro",
      bed_description: "English description",
      facilities: ["wifi", "balcony"],
    },
  },
  facilities: {
    wifi: "Wi-Fi EN",
    balcony: "Balcony EN",
  },
};

const loadI18nNs = vi.fn(async () => undefined);
const getDataByLanguage = vi.fn<(lang: string) => RoomsNamespace | undefined>();
const i18nOptions: Record<string, unknown> = { fallbackLng: ["en"] };
const configMock = {
  fallbackLng: ["en"] as string[] | string,
  supportedLngs: ["en", "it", "es"],
};

vi.mock("@/utils/loadI18nNs", () => ({
  __esModule: true,
  loadI18nNs,
}));

vi.mock("@/data/roomsData", () => ({
  __esModule: true,
  default: roomsDataMock,
}));

vi.mock("@/locales/en/roomsPage.json", () => ({
  __esModule: true,
  default: englishNamespace,
}));

vi.mock("@/i18n", () => ({
  __esModule: true,
  default: {
    getDataByLanguage: (lang: string) => getDataByLanguage(lang),
    options: i18nOptions,
  },
}));

vi.mock("@/i18n.config", () => ({
  __esModule: true,
  i18nConfig: configMock,
}));

describe("roomsCatalog", () => {
  beforeEach(() => {
    vi.resetModules();
    getDataByLanguage.mockReset();
    loadI18nNs.mockClear();
  });

  afterEach(() => {
    i18nOptions.fallbackLng = ["en"];
    configMock.fallbackLng = ["en"];
  });

  it("merges primary and fallback resources while normalizing values", async () => {
    const italianNamespace: RoomsNamespace = {
      meta: {},
      rooms: {
        room_1: {
          title: " Titolo italiano ",
          bed_intro: "   ",
          facilities: ["wifi", "balcony"],
        },
      },
      facilities: {
        wifi: "   ",
        balcony: " ",
      },
    };

    getDataByLanguage.mockImplementation((lang) =>
      lang === "it" ? italianNamespace : lang === "en" ? englishNamespace : undefined,
    );

    const mod = await import("@/utils/roomsCatalog");
    const catalog = mod.getRoomsCatalog("it");

    expect(catalog).toHaveLength(1);
    const room = catalog[0];
    expect(room.title).toBe("Titolo italiano");
    expect(room.intro).toBe("English intro");
    expect(room.description).toBe("English description");
    expect(room.facilityKeys).toEqual(["wifi", "balcony"]);
    expect(room.amenities.map((item) => item.name)).toEqual(["Wi-Fi EN", "Balcony EN"]);
  });

  it("returns fallback English copy when translations are missing", async () => {
    getDataByLanguage.mockImplementation((lang) => (lang === "en" ? englishNamespace : undefined));

    const mod = await import("@/utils/roomsCatalog");
    const catalog = mod.getRoomsCatalog("es");

    expect(catalog[0]).toMatchObject({
      title: "English title",
      intro: "English intro",
      description: "English description",
      facilityKeys: ["wifi", "balcony"],
    });
    expect(catalog[0].amenities).toEqual([{ name: "Wi-Fi EN" }, { name: "Balcony EN" }]);
  });

  it("falls back to configured language when runtime options omit one", async () => {
    i18nOptions.fallbackLng = "it";
    getDataByLanguage.mockImplementation((lang) => (lang === "it" ? englishNamespace : undefined));

    const mod = await import("@/utils/roomsCatalog");
    expect(mod.resolveFallbackLanguage()).toBe("it");
  });

  it("prefers configuration fallback when runtime options are empty", async () => {
    i18nOptions.fallbackLng = undefined;
    configMock.fallbackLng = ["es"];
    const mod = await import("@/utils/roomsCatalog");

    expect(mod.resolveFallbackLanguage()).toBe("es");
  });

  it("defaults to English when no fallback configuration exists", async () => {
    i18nOptions.fallbackLng = undefined;
    configMock.fallbackLng = [];
    const mod = await import("@/utils/roomsCatalog");

    expect(mod.resolveFallbackLanguage()).toBe("en");
  });

  it("respects fallback overrides when fetching the catalog", async () => {
    const mod = await import("@/utils/roomsCatalog");
    getDataByLanguage.mockImplementation((lang) => (lang === "en" ? englishNamespace : undefined));

    const catalog = mod.getRoomsCatalog("es", { fallbackLang: "en" });
    expect(catalog[0].title).toBe("English title");
  });

  it("loads namespaces for primary and fallback languages", async () => {
    getDataByLanguage.mockImplementation((lang) => (lang === "en" ? englishNamespace : undefined));

    const mod = await import("@/utils/roomsCatalog");
    await mod.loadRoomsCatalog("es", { fallbackLang: "en" });

    expect(loadI18nNs).toHaveBeenNthCalledWith(1, "es", "roomsPage");
    expect(loadI18nNs).toHaveBeenNthCalledWith(2, "en", "roomsPage");
  });

  it("skips loading the fallback namespace when it matches the primary", async () => {
    const mod = await import("@/utils/roomsCatalog");
    await mod.loadRoomsCatalog("en", { fallbackLang: "en" });

    expect(loadI18nNs).toHaveBeenCalledTimes(1);
    expect(loadI18nNs).toHaveBeenCalledWith("en", "roomsPage");
  });
});