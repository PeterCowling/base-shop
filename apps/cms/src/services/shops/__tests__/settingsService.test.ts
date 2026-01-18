import {
  updateCurrencyAndTax,
  updateDeposit,
  updateReverseLogistics,
  updateUpsReturns,
  updateStockAlert,
  updatePremierDelivery,
  updateAiCatalog,
  setFreezeTranslations,
} from "../settingsService";
import { authorize, fetchSettings, persistSettings } from "../helpers";

jest.mock("../helpers", () => ({
  authorize: jest.fn().mockResolvedValue(undefined),
  fetchSettings: jest.fn(),
  persistSettings: jest.fn(),
}));

jest.mock("@acme/platform-core/utils", () => ({
  recordMetric: jest.fn(),
}));

describe("settings service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns validation errors for missing currency and tax region", async () => {
    const fd = new FormData();
    const result = await updateCurrencyAndTax("shop", fd);
    expect(result.errors?.currency[0]).toBe("Required");
    expect(result.errors?.taxRegion[0]).toBe("Required");
  });

  it("updates currency and tax region", async () => {
    (fetchSettings as jest.Mock).mockResolvedValue({});
    const fd = new FormData();
    fd.set("currency", "USD");
    fd.set("taxRegion", "US");
    const result = await updateCurrencyAndTax("shop", fd);
    expect(persistSettings).toHaveBeenCalledWith(
      "shop",
      expect.objectContaining({ currency: "USD", taxRegion: "US" }),
    );
    expect(result.settings).toEqual(
      expect.objectContaining({ currency: "USD", taxRegion: "US" }),
    );
  });

  it("returns validation errors when updating deposit", async () => {
    const fd = new FormData();
    const result = await updateDeposit("shop", fd);
    expect(result.errors).toBeDefined();
    expect(persistSettings).not.toHaveBeenCalled();
  });

  it("persists deposit settings", async () => {
    (fetchSettings as jest.Mock).mockResolvedValue({});
    const fd = new FormData();
    fd.set("enabled", "on");
    fd.set("intervalMinutes", "10");
    const result = await updateDeposit("shop", fd);
    expect(persistSettings).toHaveBeenCalledWith(
      "shop",
      expect.objectContaining({
        depositService: { enabled: true, intervalMinutes: 10 },
      }),
    );
    expect(result.settings?.depositService).toEqual({
      enabled: true,
      intervalMinutes: 10,
    });
  });

  it("returns validation errors when updating reverse logistics", async () => {
    const fd = new FormData();
    const result = await updateReverseLogistics("shop", fd);
    expect(result.errors).toBeDefined();
    expect(persistSettings).not.toHaveBeenCalled();
  });

  it("persists reverse logistics settings", async () => {
    (fetchSettings as jest.Mock).mockResolvedValue({});
    const fd = new FormData();
    fd.set("enabled", "on");
    fd.set("intervalMinutes", "15");
    const result = await updateReverseLogistics("shop", fd);
    expect(persistSettings).toHaveBeenCalledWith(
      "shop",
      expect.objectContaining({
        reverseLogisticsService: { enabled: true, intervalMinutes: 15 },
      }),
    );
    expect(result.settings?.reverseLogisticsService).toEqual({
      enabled: true,
      intervalMinutes: 15,
    });
  });

  it("returns validation errors when updating UPS returns", async () => {
    const fd = new FormData();
    fd.set("enabled", "invalid");
    const result = await updateUpsReturns("shop", fd);
    expect(result.errors).toBeDefined();
    expect(persistSettings).not.toHaveBeenCalled();
  });

  it("persists UPS return settings", async () => {
    (fetchSettings as jest.Mock).mockResolvedValue({});
    const fd = new FormData();
    fd.set("enabled", "on");
    fd.set("bagEnabled", "on");
    fd.set("homePickupEnabled", "on");
    const result = await updateUpsReturns("shop", fd);
    expect(persistSettings).toHaveBeenCalledWith(
      "shop",
      expect.objectContaining({
        returnService: {
          upsEnabled: true,
          bagEnabled: true,
          homePickupEnabled: true,
        },
      }),
    );
    expect(result.settings?.returnService).toEqual({
      upsEnabled: true,
      bagEnabled: true,
      homePickupEnabled: true,
    });
  });

  it("returns validation errors when updating stock alert", async () => {
    const fd = new FormData();
    const result = await updateStockAlert("shop", fd);
    expect(result.errors).toBeDefined();
    expect(persistSettings).not.toHaveBeenCalled();
  });

  it("persists stock alert settings", async () => {
    (fetchSettings as jest.Mock).mockResolvedValue({});
    const fd = new FormData();
    fd.set("recipients", "a@example.com,b@example.com");
    fd.set("webhook", "https://example.com");
    fd.set("threshold", "5");
    const result = await updateStockAlert("shop", fd);
    expect(persistSettings).toHaveBeenCalledWith(
      "shop",
      expect.objectContaining({
        stockAlert: {
          recipients: ["a@example.com", "b@example.com"],
          webhook: "https://example.com",
          threshold: 5,
        },
      }),
    );
    expect(result.settings?.stockAlert).toEqual({
      recipients: ["a@example.com", "b@example.com"],
      webhook: "https://example.com",
      threshold: 5,
    });
  });

  it("returns validation errors when updating premier delivery", async () => {
    const fd = new FormData();
    fd.append("windows", "invalid-window");
    const result = await updatePremierDelivery("shop", fd);
    expect(result.errors).toBeDefined();
    expect(persistSettings).not.toHaveBeenCalled();
  });

  it("persists premier delivery settings", async () => {
    (fetchSettings as jest.Mock).mockResolvedValue({});
    const fd = new FormData();
    fd.append("regions", "US");
    fd.append("windows", "09-17");
    fd.append("carriers", "UPS");
    fd.set("surcharge", "10");
    fd.set("serviceLabel", "Fast");
    const result = await updatePremierDelivery("shop", fd);
    expect(persistSettings).toHaveBeenCalledWith(
      "shop",
      expect.objectContaining({
        premierDelivery: {
          regions: ["US"],
          windows: ["09-17"],
          carriers: ["UPS"],
          surcharge: 10,
          serviceLabel: "Fast",
        },
        luxuryFeatures: expect.objectContaining({ premierDelivery: true }),
      }),
    );
    expect(result.settings?.premierDelivery).toEqual({
      regions: ["US"],
      windows: ["09-17"],
      carriers: ["UPS"],
      surcharge: 10,
      serviceLabel: "Fast",
    });
  });

  it("returns validation errors when updating AI catalog", async () => {
    const fd = new FormData();
    const result = await updateAiCatalog("shop", fd);
    expect(result.errors).toBeDefined();
    expect(persistSettings).not.toHaveBeenCalled();
  });

  it("persists AI catalog settings", async () => {
    (fetchSettings as jest.Mock).mockResolvedValue({});
    const fd = new FormData();
    fd.set("enabled", "on");
    fd.set("pageSize", "20");
    fd.append("fields", "id");
    fd.append("fields", "title");
    const result = await updateAiCatalog("shop", fd);
    expect(persistSettings).toHaveBeenCalledWith(
      "shop",
      expect.objectContaining({
        seo: {
          aiCatalog: { enabled: true, pageSize: 20, fields: ["id", "title"] },
        },
      }),
    );
    expect(result.settings?.seo?.aiCatalog).toEqual({
      enabled: true,
      pageSize: 20,
      fields: ["id", "title"],
    });
  });

  it("sets freeze translations", async () => {
    (fetchSettings as jest.Mock).mockResolvedValue({ freezeTranslations: false });
    const result = await setFreezeTranslations("shop", true);
    expect(persistSettings).toHaveBeenCalledWith(
      "shop",
      { freezeTranslations: true },
    );
    expect(result.freezeTranslations).toBe(true);
  });
});
