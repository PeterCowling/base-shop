type RoomsNamespace = {
  meta: Record<string, string>;
  rooms: Record<string, unknown>;
  facilities: Record<string, string>;
};

type ApartmentNamespace = {
  title: string;
  body: string;
  amenitiesList: string[];
  detailsList: string[];
};

type LanguageData = {
  apartmentPage?: ApartmentNamespace;
  roomsPage?: RoomsNamespace;
};

const roomsDataMock = [
  {
    id: "room_3",
    sku: "room_3",
    widgetRoomCode: "1",
    widgetRateCodeNR: "nr",
    widgetRateCodeFlex: "flex",
    rateCodes: {
      direct: { nr: "nr", flex: "flex" },
      ota: { nr: "nr", flex: "flex" },
    },
    occupancy: 2,
    pricingModel: "perBed",
    basePrice: { amount: 100, currency: "EUR" },
    seasonalPrices: [],
    availability: { totalBeds: 2, defaultRelease: 2 },
    images: { bed: "/img/test-bed.webp", bathroom: "/img/test-bathroom.webp" },
    landingImage: "/landing.jpg",
    roomsHref: "/rooms#room_3",
  },
  {
    id: "apartment",
    sku: "apartment",
    widgetRoomCode: "2025-14",
    widgetRateCodeNR: "nr-apartment",
    widgetRateCodeFlex: "flex-apartment",
    rateCodes: {
      direct: { nr: "nr-apartment", flex: "flex-apartment" },
      ota: { nr: "nr-apartment", flex: "flex-apartment" },
    },
    occupancy: 5,
    pricingModel: "perRoom",
    basePrice: { amount: 180, currency: "EUR" },
    seasonalPrices: [],
    availability: { totalBeds: 5, defaultRelease: 1 },
    images: { bed: "/img/apartment-bed.webp", bathroom: "/img/apartment-bathroom.webp" },
    landingImage: "/apartment-landing.jpg",
    roomsHref: "/book-private-accommodations",
  },
] as unknown[];

const englishNamespace: RoomsNamespace = {
  meta: {},
  rooms: {
    room_3: {
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

const englishApartmentNamespace: ApartmentNamespace = {
  title: "Sea View Apartment",
  body: "Private apartment with a sea view and step-free arrival.",
  amenitiesList: ["Sea-view terrace", "Kitchen"],
  detailsList: ["Sleeps up to five guests", "Street-level access"],
};

const loadI18nNs = jest.fn(async () => undefined);
const getDataByLanguage = jest.fn<LanguageData | undefined, [string]>();
const i18nOptions: Record<string, unknown> = { fallbackLng: ["en"] };
const configMock = {
  fallbackLng: ["en"] as string[] | string,
  supportedLngs: ["en", "it", "es"],
};

const makeLanguageData = (
  roomsPage?: RoomsNamespace,
  apartmentPage?: ApartmentNamespace,
): LanguageData => ({
  ...(roomsPage ? { roomsPage } : {}),
  ...(apartmentPage ? { apartmentPage } : {}),
});

jest.mock("@/utils/loadI18nNs", () => ({
  __esModule: true,
  loadI18nNs,
}));

jest.mock("@/data/roomsData", () => ({
  __esModule: true,
  websiteVisibleRoomsData: roomsDataMock,
  default: roomsDataMock,
}));

jest.mock("@/locales/en/roomsPage.json", () => ({
  __esModule: true,
  default: englishNamespace,
}));

jest.mock("@/locales/en/apartmentPage.json", () => ({
  __esModule: true,
  default: englishApartmentNamespace,
}));

jest.mock("@/i18n", () => ({
  __esModule: true,
  default: {
    getDataByLanguage: (lang: string) => getDataByLanguage(lang),
    options: i18nOptions,
  },
}));

jest.mock("@/i18n.config", () => ({
  __esModule: true,
  i18nConfig: configMock,
}));

describe("roomsCatalog", () => {
  beforeEach(() => {
    jest.resetModules();
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
        room_3: {
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
      lang === "it"
        ? makeLanguageData(italianNamespace)
        : lang === "en"
          ? makeLanguageData(englishNamespace, englishApartmentNamespace)
          : undefined
    );

    const mod = await import("@/utils/roomsCatalog");
    const catalog = mod.getRoomsCatalog("it");

    expect(catalog).toHaveLength(2);
    const room = catalog.find((candidate) => candidate.id === "room_3");
    if (!room) {
      throw new Error("Expected room_3 in catalog");
    }
    expect(room.title).toBe("Titolo italiano");
    expect(room.intro).toBe("English intro");
    expect(room.description).toBe("English description");
    expect(room.facilityKeys).toEqual(["wifi", "balcony"]);
    expect(room.amenities.map((item) => item.name)).toEqual([
      "Wi-Fi EN",
      "Balcony EN",
    ]);
  });

  it("returns fallback English copy when translations are missing", async () => {
    getDataByLanguage.mockImplementation((lang) =>
      lang === "en" ? makeLanguageData(englishNamespace, englishApartmentNamespace) : undefined
    );

    const mod = await import("@/utils/roomsCatalog");
    const catalog = mod.getRoomsCatalog("es");
    const room = catalog.find((candidate) => candidate.id === "room_3");
    if (!room) {
      throw new Error("Expected room_3 in catalog");
    }

    expect(room).toMatchObject({
      title: "English title",
      intro: "English intro",
      description: "English description",
      facilityKeys: ["wifi", "balcony"],
    });
    expect(room?.amenities).toEqual([
      { name: "Wi-Fi EN" },
      { name: "Balcony EN" },
    ]);
  });

  it("falls back to configured language when runtime options omit one", async () => {
    i18nOptions.fallbackLng = "it";
    getDataByLanguage.mockImplementation((lang) =>
      lang === "it" ? makeLanguageData(englishNamespace, englishApartmentNamespace) : undefined
    );

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
    getDataByLanguage.mockImplementation((lang) =>
      lang === "en" ? makeLanguageData(englishNamespace, englishApartmentNamespace) : undefined
    );

    const catalog = mod.getRoomsCatalog("es", { fallbackLang: "en" });
    expect(catalog.find((candidate) => candidate.id === "room_3")?.title).toBe("English title");
  });

  it("uses apartmentPage copy for apartment entries instead of the raw room id fallback", async () => {
    getDataByLanguage.mockImplementation((lang) =>
      lang === "en" ? makeLanguageData(englishNamespace, englishApartmentNamespace) : undefined
    );

    const mod = await import("@/utils/roomsCatalog");
    const catalog = mod.getRoomsCatalog("es", { fallbackLang: "en" });
    const apartment = catalog.find((candidate) => candidate.id === "apartment");
    if (!apartment) {
      throw new Error("Expected apartment in catalog");
    }

    expect(apartment).toMatchObject({
      title: "Sea View Apartment",
      description: "Private apartment with a sea view and step-free arrival.",
      facilityKeys: [],
    });
    expect(apartment?.amenities).toEqual([
      { name: "Sea-view terrace" },
      { name: "Kitchen" },
    ]);
  });

  it("loads namespaces for primary and fallback languages", async () => {
    getDataByLanguage.mockImplementation((lang) =>
      lang === "en" ? makeLanguageData(englishNamespace, englishApartmentNamespace) : undefined
    );

    const mod = await import("@/utils/roomsCatalog");
    await mod.loadRoomsCatalog("es", { fallbackLang: "en" });

    expect(loadI18nNs).toHaveBeenNthCalledWith(1, "es", "roomsPage");
    expect(loadI18nNs).toHaveBeenNthCalledWith(2, "es", "apartmentPage");
    expect(loadI18nNs).toHaveBeenNthCalledWith(3, "en", "roomsPage");
    expect(loadI18nNs).toHaveBeenNthCalledWith(4, "en", "apartmentPage");
  });

  it("skips loading the fallback namespace when it matches the primary", async () => {
    const mod = await import("@/utils/roomsCatalog");
    await mod.loadRoomsCatalog("en", { fallbackLang: "en" });

    expect(loadI18nNs).toHaveBeenCalledTimes(2);
    expect(loadI18nNs).toHaveBeenCalledWith("en", "roomsPage");
    expect(loadI18nNs).toHaveBeenCalledWith("en", "apartmentPage");
  });
});
